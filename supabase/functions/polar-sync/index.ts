import {
  ApiError,
  authenticateConnection,
  decryptSecret,
  errorResponse,
  getAdmin,
  json,
  normalizeActivity,
  normalizeExercise,
  normalizeProfile,
  options,
  polarRequest,
  publicConnection,
} from "../_shared/polar.ts";

const POLAR_BASE = "https://www.polaraccesslink.com/v3";

function records(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === "object") as Array<Record<string, unknown>> : [];
}

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  const admin = getAdmin();
  let connectionId: string | null = null;
  let logId: string | null = null;
  try {
    if (req.method !== "GET" && req.method !== "POST") throw new ApiError(405, "method_not_allowed", "Use GET for status or POST for manual sync.");
    const connection = await authenticateConnection(req, admin);
    connectionId = connection.id;
    if (req.method === "GET") return json(req, { ok: true, connection: publicConnection(connection) });
    if (connection.status !== "connected" || !connection.access_token) throw new ApiError(409, "not_connected", "Polar account is not connected.");

    const accessToken = await decryptSecret(connection.access_token);
    if (!accessToken) throw new ApiError(409, "missing_access_token", "Polar access token is unavailable.");
    const { data: log } = await admin.from("polar_sync_log").insert({ connection_id: connection.id, sync_type: "manual_v1", status: "started" }).select("id").single();
    logId = log?.id || null;

    const [exerciseResult, activityResult, profileResult] = await Promise.all([
      polarRequest(`${POLAR_BASE}/exercises?zones=true&samples=false`, accessToken),
      polarRequest(`${POLAR_BASE}/users/activities`, accessToken),
      polarRequest(`${POLAR_BASE}/users/physical-info`, accessToken),
    ]);
    if ([exerciseResult, activityResult, profileResult].some((result) => result.status === 401)) {
      await admin.from("polar_connections").update({ status: "error", error_message: "Polar access token was rejected." }).eq("id", connection.id);
      throw new ApiError(401, "polar_token_rejected", "Polar access token was rejected. Reconnect the account.");
    }

    const warnings: string[] = [];
    const usable = (label: string, result: { ok: boolean; status: number; data: unknown }) => {
      if (result.ok) return result.data;
      if (result.status === 204 || result.status === 404) return null;
      warnings.push(`${label} unavailable (${result.status}).`);
      return null;
    };
    const rawExercises = records(usable("Exercises", exerciseResult));
    const rawActivities = records(usable("Daily activity", activityResult));
    const rawProfile = usable("Physical information", profileResult);
    const profileRecord = rawProfile && typeof rawProfile === "object" && !Array.isArray(rawProfile) ? rawProfile as Record<string, unknown> : null;
    const workouts = rawExercises.map(normalizeExercise).filter(Boolean);
    const activities = rawActivities.map(normalizeActivity).filter(Boolean);
    const profile = profileRecord ? normalizeProfile(profileRecord) : null;

    const rawRows = [
      ...rawExercises.map((payload) => ({ connection_id: connection.id, data_type: "exercise", polar_id: String(payload.id || payload["upload_time"] || crypto.randomUUID()), payload })),
      ...rawActivities.map((payload) => ({ connection_id: connection.id, data_type: "daily_activity", polar_id: String(payload.id || payload.date || (payload.samples as Record<string, unknown> | undefined)?.date || crypto.randomUUID()), payload })),
      ...(profileRecord ? [{ connection_id: connection.id, data_type: "physical_info", polar_id: "latest", payload: profileRecord }] : []),
    ];
    if (rawRows.length) {
      const { error: rawError } = await admin.from("polar_raw_data").upsert(rawRows, { onConflict: "connection_id,data_type,polar_id" });
      if (rawError) warnings.push("Raw payload archive could not be updated.");
    }

    const now = new Date().toISOString();
    const status = warnings.length ? "partial" : "success";
    await admin.from("polar_connections").update({ last_sync_at: now, status: "connected", error_message: warnings.length ? warnings.join(" ") : null }).eq("id", connection.id);
    if (logId) await admin.from("polar_sync_log").update({ status, finished_at: now, error_message: warnings.length ? warnings.join(" ") : null, raw_count: rawRows.length }).eq("id", logId);
    return json(req, {
      ok: true,
      connected: true,
      lastSyncAt: now,
      status,
      connection: { ...publicConnection(connection), status: "connected", lastSyncAt: now, errorMessage: warnings.length ? warnings.join(" ") : null },
      workouts,
      activity: activities,
      activities,
      profile,
      counts: { workouts: workouts.length, activity: activities.length, activities: activities.length, profile: profile ? 1 : 0 },
      warnings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Manual Polar sync failed.";
    if (logId) await admin.from("polar_sync_log").update({ status: "error", error_message: message, finished_at: new Date().toISOString() }).eq("id", logId);
    if (connectionId) await admin.from("polar_connections").update({ error_message: message }).eq("id", connectionId);
    return errorResponse(req, error);
  }
});
