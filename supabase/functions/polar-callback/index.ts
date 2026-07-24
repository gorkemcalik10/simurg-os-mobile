import {
  ApiError,
  configuredAppUrl,
  encryptSecret,
  getAdmin,
  hashSecret,
  polarRequest,
} from "../_shared/polar.ts";

const POLAR_TOKEN_URL = "https://polarremote.com/v2/oauth2/token";
const POLAR_USERS_URL = "https://www.polaraccesslink.com/v3/users";

function appRedirect(base: string, params: Record<string, string>): Response {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return Response.redirect(url.toString(), 302);
}

Deno.serve(async (req) => {
  let fallbackUrl: string;
  try {
    fallbackUrl = configuredAppUrl();
  } catch {
    return new Response("SIMURG_APP_URL is not configured.", { status: 500 });
  }
  const admin = getAdmin();
  let stateRow: Record<string, unknown> | null = null;
  let logId: string | null = null;
  try {
    if (req.method !== "GET") throw new ApiError(405, "method_not_allowed", "Polar callback accepts GET only.");
    const url = new URL(req.url);
    const state = url.searchParams.get("state") || "";
    if (!state) throw new ApiError(400, "missing_state", "OAuth state is missing.");

    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("polar_oauth_states")
      .update({ used_at: now })
      .eq("state_hash", await hashSecret(state))
      .is("used_at", null)
      .gt("expires_at", now)
      .select("user_id,client_id,client_key_hash,return_url")
      .maybeSingle();
    if (error || !data) throw new ApiError(400, "invalid_state", "OAuth state is invalid, expired, or already used.");
    if (!data.user_id) throw new ApiError(400, "legacy_state_requires_restart", "Restart Polar connection from an authenticated Simurg session.");
    stateRow = data;
    fallbackUrl = String(data.return_url || fallbackUrl);

    const { data: log } = await admin.from("polar_sync_log").insert({ sync_type: "oauth_callback", status: "started" }).select("id").single();
    logId = log?.id || null;

    const oauthError = url.searchParams.get("error");
    if (oauthError) throw new ApiError(400, "polar_authorization_denied", `Polar authorization failed: ${oauthError}`);
    const code = url.searchParams.get("code") || "";
    if (!code) throw new ApiError(400, "missing_code", "Polar authorization code is missing.");

    const polarClientId = Deno.env.get("POLAR_CLIENT_ID") || "";
    const polarClientSecret = Deno.env.get("POLAR_CLIENT_SECRET") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    if (!polarClientId || !polarClientSecret || !supabaseUrl) throw new ApiError(500, "missing_oauth_config", "Polar OAuth secrets are missing.");
    const redirectUri = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/polar-callback`;
    const tokenBody = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri });
    const tokenResponse = await fetch(POLAR_TOKEN_URL, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${polarClientId}:${polarClientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json;charset=UTF-8",
      },
      body: tokenBody,
    });
    const tokenPayload = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokenPayload.access_token || !tokenPayload.x_user_id) {
      throw new ApiError(502, "token_exchange_failed", "Polar token exchange failed.");
    }

    const accessToken = String(tokenPayload.access_token);
    const polarUserId = Number(tokenPayload.x_user_id);
    const memberId = `simurg-${String(data.client_id).replace(/-/g, "").slice(0, 24)}`;
    const registerResponse = await fetch(POLAR_USERS_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ "member-id": memberId }),
    });
    if (registerResponse.status === 409) {
      const existing = await polarRequest(`${POLAR_USERS_URL}/${encodeURIComponent(String(polarUserId))}`, accessToken);
      if (!existing.ok) throw new ApiError(409, "polar_user_registration_conflict", "Polar user is already linked to another client registration.");
    } else if (!registerResponse.ok) {
      throw new ApiError(502, "polar_user_registration_failed", "Polar user registration failed.");
    }

    const expiresIn = Number(tokenPayload.expires_in);
    const connectionPayload = {
      user_id: data.user_id,
      client_id: data.client_id,
      client_key_hash: data.client_key_hash,
      polar_user_id: polarUserId,
      access_token: await encryptSecret(accessToken),
      refresh_token: await encryptSecret(tokenPayload.refresh_token ? String(tokenPayload.refresh_token) : null),
      token_expires_at: Number.isFinite(expiresIn) && expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
      connected_at: now,
      status: "connected",
      error_message: null,
    };
    const [ownedResult, polarResult, deviceResult] = await Promise.all([
      admin.from("polar_connections").select("id,user_id,polar_user_id").eq("user_id", data.user_id).maybeSingle(),
      admin.from("polar_connections").select("id,user_id,polar_user_id").eq("polar_user_id", polarUserId).maybeSingle(),
      admin.from("polar_connections").select("id,user_id,polar_user_id").eq("client_id", data.client_id).maybeSingle(),
    ]);
    if (ownedResult.error || polarResult.error || deviceResult.error) {
      throw new ApiError(500, "connection_lookup_failed", "Existing Polar connections could not be checked.");
    }
    const ownedConnection = ownedResult.data;
    const polarConnection = polarResult.data;
    const deviceConnection = deviceResult.data;
    if (polarConnection?.user_id && polarConnection.user_id !== data.user_id) {
      throw new ApiError(409, "polar_account_already_owned", "This Polar account belongs to another Simurg account.");
    }
    if (deviceConnection?.user_id && deviceConnection.user_id !== data.user_id) {
      throw new ApiError(409, "device_connection_already_owned", "This device connection belongs to another Simurg account.");
    }
    const candidates = [ownedConnection, polarConnection, deviceConnection].filter(Boolean);
    const candidateIds = Array.from(new Set(candidates.map((row) => row!.id)));
    if (candidateIds.length > 1) {
      throw new ApiError(409, "connection_merge_required", "Existing Polar connection records require manual review before reconnecting.");
    }
    let connectionId: string | null = candidateIds[0] || null;
    if (connectionId) {
      const { error: updateError } = await admin.from("polar_connections").update(connectionPayload).eq("id", connectionId);
      if (updateError) throw new ApiError(500, "connection_store_failed", "Polar connection could not be updated.");
    } else {
      const { data: stored, error: storeError } = await admin.from("polar_connections").insert(connectionPayload).select("id").single();
      if (storeError || !stored) throw new ApiError(500, "connection_store_failed", "Polar connection could not be stored.");
      connectionId = stored.id;
    }
    if (logId) await admin.from("polar_sync_log").update({ connection_id: connectionId, status: "success", finished_at: new Date().toISOString() }).eq("id", logId);
    return appRedirect(fallbackUrl, { polar: "connected" });
  } catch (error) {
    console.error("Polar callback error", error);
    const message = error instanceof ApiError ? error.message : "Unexpected Polar callback error.";
    if (logId) await admin.from("polar_sync_log").update({ status: "error", error_message: message, finished_at: new Date().toISOString() }).eq("id", logId);
    return appRedirect(fallbackUrl, { polar: "error", polar_message: message.slice(0, 180) });
  }
});
