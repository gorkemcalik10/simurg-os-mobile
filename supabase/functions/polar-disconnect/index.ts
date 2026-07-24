import {
  ApiError,
  authenticatedPolarContext,
  decryptSecret,
  errorResponse,
  getAdmin,
  json,
  options,
  polarRequest,
} from "../_shared/polar.ts";

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  const admin = getAdmin();
  try {
    if (req.method !== "POST" && req.method !== "DELETE") throw new ApiError(405, "method_not_allowed", "Use POST or DELETE to disconnect Polar.");
    const context = await authenticatedPolarContext(req, admin);
    const connection = context.connection;
    if (!connection) return json(req, { ok: true, connection: { connected: false, status: "disconnected", lastSyncAt: null } });
    if (connection.status === "disconnected" || !connection.access_token) {
      return json(req, { ok: true, connection: { connected: false, status: "disconnected", lastSyncAt: connection.last_sync_at } });
    }
    const accessToken = await decryptSecret(connection.access_token);
    if (!accessToken) throw new ApiError(409, "missing_access_token", "Polar access token is unavailable.");
    const result = await polarRequest(`https://www.polaraccesslink.com/v3/users/${encodeURIComponent(String(connection.polar_user_id))}`, accessToken, { method: "DELETE" });
    if (!result.ok && ![401, 404].includes(result.status)) {
      const message = `Polar de-registration failed (${result.status}).`;
      await admin.from("polar_connections").update({ error_message: message }).eq("id", connection.id);
      throw new ApiError(502, "polar_disconnect_failed", message);
    }
    const { error } = await admin.from("polar_connections").update({
      access_token: null,
      refresh_token: null,
      token_expires_at: null,
      status: "disconnected",
      error_message: null,
    }).eq("id", connection.id);
    if (error) throw new ApiError(500, "disconnect_store_failed", "Polar connection state could not be cleared.");
    await admin.from("polar_sync_log").insert({ connection_id: connection.id, sync_type: "disconnect", status: "success", finished_at: new Date().toISOString() });
    return json(req, { ok: true, connection: { connected: false, status: "disconnected", lastSyncAt: connection.last_sync_at } });
  } catch (error) {
    return errorResponse(req, error);
  }
});
