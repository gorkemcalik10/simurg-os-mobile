import {
  ApiError,
  authenticateUser,
  configuredAppUrl,
  errorResponse,
  getAdmin,
  hashSecret,
  json,
  options,
  randomToken,
} from "../_shared/polar.ts";

const POLAR_AUTHORIZE_URL = "https://flow.polar.com/oauth2/authorization";

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  try {
    if (req.method !== "POST") throw new ApiError(405, "method_not_allowed", "Use POST to start Polar OAuth.");
    const polarClientId = Deno.env.get("POLAR_CLIENT_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!polarClientId || !supabaseUrl) throw new ApiError(500, "missing_oauth_config", "Polar OAuth is not configured.");

    const body = await req.json().catch(() => ({}));
    const clientId = String(body.clientId || "");
    const clientKey = String(body.clientKey || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientId)) {
      throw new ApiError(400, "invalid_client_id", "Invalid device client identifier.");
    }
    if (clientKey.length < 32) throw new ApiError(400, "invalid_client_key", "Invalid device capability key.");

    const state = randomToken(32);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const returnUrl = configuredAppUrl();
    const admin = getAdmin();
    const user = await authenticateUser(req, admin);
    await admin.from("polar_oauth_states").delete().lt("expires_at", new Date().toISOString());
    const { error } = await admin.from("polar_oauth_states").insert({
      state_hash: await hashSecret(state),
      user_id: user.id,
      client_id: clientId,
      client_key_hash: await hashSecret(clientKey),
      return_url: returnUrl,
      expires_at: expiresAt,
    });
    if (error) throw new ApiError(500, "state_store_failed", "OAuth state could not be stored.");

    const redirectUri = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/polar-callback`;
    const authorizationUrl = new URL(POLAR_AUTHORIZE_URL);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("client_id", polarClientId);
    authorizationUrl.searchParams.set("redirect_uri", redirectUri);
    authorizationUrl.searchParams.set("scope", "accesslink.read_all");
    authorizationUrl.searchParams.set("state", state);

    return json(req, { ok: true, authorizationUrl: authorizationUrl.toString(), expiresAt });
  } catch (error) {
    return errorResponse(req, error);
  }
});
