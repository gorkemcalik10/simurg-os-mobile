import {
  ApiError,
  authenticateConnection,
  decryptSecret,
  errorResponse,
  getAdmin,
  json,
  normalizeActivity,
  normalizeCardioLoad,
  normalizeContinuousHr,
  normalizeExercise,
  normalizeNightlyRecharge,
  normalizeProfile,
  normalizeSleep,
  options,
  polarRequest,
  publicConnection,
} from "../_shared/polar.ts";

const POLAR_BASE = "https://www.polaraccesslink.com/v3";
type PolarResult = { ok: boolean; status: number; data: unknown };
type SyncStatus = "ok" | "no_data" | "forbidden" | "error";

function records(value: unknown, wrapperKeys: string[] = []): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value.filter((item) => item && typeof item === "object") as Array<Record<string, unknown>>;
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  for (const key of wrapperKeys) {
    if (Array.isArray(record[key])) return records(record[key]);
  }
  return record.date ? [record] : [];
}

function objectRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function resultStatus(result: PolarResult, count: number): SyncStatus {
  if (result.ok) return count > 0 ? "ok" : "no_data";
  if (result.status === 204 || result.status === 404) return "no_data";
  if (result.status === 403) return "forbidden";
  return "error";
}

function resultError(label: string, result: PolarResult): string | null {
  if (result.ok || result.status === 204 || result.status === 404) return null;
  if (result.status === 403) return `${label} unavailable or consent not granted.`;
  if (result.status === 429) return `${label} rate limited; try again later.`;
  if (result.status === 400) return `${label} request was not supported for this account.`;
  return `${label} unavailable (${result.status}).`;
}

function isoDate(daysAgo = 0): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
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
    const { data: log } = await admin.from("polar_sync_log").insert({ connection_id: connection.id, sync_type: "manual_v2", status: "started" }).select("id").single();
    logId = log?.id || null;

    const from = isoDate(2);
    const to = isoDate(0);
    const [exerciseResult, activityResult, profileResult, sleepResult, nightlyResult, continuousHrResult, cardioLoadResult] = await Promise.all([
      polarRequest(`${POLAR_BASE}/exercises?zones=true&samples=false`, accessToken),
      polarRequest(`${POLAR_BASE}/users/activities`, accessToken),
      polarRequest(`${POLAR_BASE}/users/physical-info`, accessToken),
      polarRequest(`${POLAR_BASE}/users/sleep`, accessToken),
      polarRequest(`${POLAR_BASE}/users/nightly-recharge`, accessToken),
      polarRequest(`${POLAR_BASE}/users/continuous-heart-rate?from=${from}&to=${to}`, accessToken),
      polarRequest(`${POLAR_BASE}/users/cardio-load/period/days/28`, accessToken),
    ]);
    const results = [exerciseResult, activityResult, profileResult, sleepResult, nightlyResult, continuousHrResult, cardioLoadResult];
    if (results.some((result) => result.status === 401)) {
      await admin.from("polar_connections").update({ status: "error", error_message: "Polar access token was rejected." }).eq("id", connection.id);
      throw new ApiError(401, "polar_token_rejected", "Polar access token was rejected. Reconnect the account.");
    }

    const rawExercises = records(exerciseResult.ok ? exerciseResult.data : null);
    const rawActivities = records(activityResult.ok ? activityResult.data : null);
    const profileRecord = profileResult.ok ? objectRecord(profileResult.data) : null;
    const rawSleep = records(sleepResult.ok ? sleepResult.data : null, ["nights"]);
    const rawNightlyRecharge = records(nightlyResult.ok ? nightlyResult.data : null, ["recharges"]);
    const rawContinuousHr = records(continuousHrResult.ok ? continuousHrResult.data : null, ["samples", "days"]);
    const rawCardioLoad = records(cardioLoadResult.ok ? cardioLoadResult.data : null, ["cardio_loads", "cardio-loads"]);

    const workouts = rawExercises.map(normalizeExercise).filter(Boolean);
    const activities = rawActivities.map(normalizeActivity).filter(Boolean);
    const profile = profileRecord ? normalizeProfile(profileRecord) : null;
    const sleep = rawSleep.map(normalizeSleep).filter(Boolean);
    const nightlyRecharge = rawNightlyRecharge.map(normalizeNightlyRecharge).filter(Boolean);
    const continuousHr = rawContinuousHr.map(normalizeContinuousHr).filter(Boolean);
    const cardioLoad = rawCardioLoad.map(normalizeCardioLoad).filter(Boolean);

    const counts = {
      workouts: workouts.length,
      activity: activities.length,
      activities: activities.length,
      profile: profile ? 1 : 0,
      sleep: sleep.length,
      nightlyRecharge: nightlyRecharge.length,
      continuousHr: continuousHr.length,
      cardioLoad: cardioLoad.length,
    };
    const statuses = {
      workouts: resultStatus(exerciseResult, counts.workouts),
      activity: resultStatus(activityResult, counts.activity),
      profile: resultStatus(profileResult, counts.profile),
      sleep: resultStatus(sleepResult, counts.sleep),
      nightlyRecharge: resultStatus(nightlyResult, counts.nightlyRecharge),
      continuousHr: resultStatus(continuousHrResult, counts.continuousHr),
      cardioLoad: resultStatus(cardioLoadResult, counts.cardioLoad),
    };
    const errors = {
      workouts: resultError("Exercises", exerciseResult),
      activity: resultError("Daily activity", activityResult),
      profile: resultError("Physical information", profileResult),
      sleep: resultError("Sleep", sleepResult),
      nightlyRecharge: resultError("Nightly Recharge", nightlyResult),
      continuousHr: resultError("Continuous HR", continuousHrResult),
      cardioLoad: resultError("Cardio Load", cardioLoadResult),
    };
    const warnings = Object.values(errors).filter((message): message is string => Boolean(message));

    const rawRows = [
      ...rawExercises.map((payload) => ({ connection_id: connection.id, data_type: "exercise", polar_id: String(payload.id || payload["upload_time"] || crypto.randomUUID()), payload })),
      ...rawActivities.map((payload) => ({ connection_id: connection.id, data_type: "daily_activity", polar_id: String(payload.id || payload.date || (payload.samples as Record<string, unknown> | undefined)?.date || crypto.randomUUID()), payload })),
      ...(profileRecord ? [{ connection_id: connection.id, data_type: "physical_info", polar_id: "latest", payload: profileRecord }] : []),
      ...rawSleep.map((payload) => ({ connection_id: connection.id, data_type: "sleep", polar_id: String(payload.date || crypto.randomUUID()), payload })),
      ...rawNightlyRecharge.map((payload) => ({ connection_id: connection.id, data_type: "nightly_recharge", polar_id: String(payload.date || crypto.randomUUID()), payload })),
      ...rawContinuousHr.map((payload) => ({ connection_id: connection.id, data_type: "continuous_hr", polar_id: String(payload.date || crypto.randomUUID()), payload })),
      ...rawCardioLoad.map((payload) => ({ connection_id: connection.id, data_type: "cardio_load", polar_id: String(payload.date || crypto.randomUUID()), payload })),
    ];
    if (rawRows.length) {
      const { error: rawError } = await admin.from("polar_raw_data").upsert(rawRows, { onConflict: "connection_id,data_type,polar_id" });
      if (rawError) warnings.push("Raw payload archive could not be updated.");
    }

    const now = new Date().toISOString();
    const syncStatus = warnings.length ? "partial" : "success";
    await admin.from("polar_connections").update({ last_sync_at: now, status: "connected", error_message: warnings.length ? warnings.join(" ") : null }).eq("id", connection.id);
    if (logId) await admin.from("polar_sync_log").update({ status: syncStatus, finished_at: now, error_message: warnings.length ? warnings.join(" ") : null, raw_count: rawRows.length }).eq("id", logId);
    return json(req, {
      ok: true,
      connected: true,
      lastSyncAt: now,
      status: syncStatus,
      connection: { ...publicConnection(connection), status: "connected", lastSyncAt: now, errorMessage: warnings.length ? warnings.join(" ") : null },
      workouts,
      activity: activities,
      activities,
      profile,
      sleep,
      nightlyRecharge,
      continuousHr,
      cardioLoad,
      counts,
      statuses,
      errors,
      warnings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Manual Polar sync failed.";
    if (logId) await admin.from("polar_sync_log").update({ status: "error", error_message: message, finished_at: new Date().toISOString() }).eq("id", logId);
    if (connectionId) await admin.from("polar_connections").update({ error_message: message }).eq("id", connectionId);
    return errorResponse(req, error);
  }
});
