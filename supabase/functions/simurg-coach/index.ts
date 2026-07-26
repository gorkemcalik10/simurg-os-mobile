import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { createCoachHandler } from "./security.mjs";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
const allowedOrigin = (() => {
  try {
    return new URL(Deno.env.get("SIMURG_APP_URL") || "").origin;
  } catch {
    return "";
  }
})();

async function verifyToken(token: string): Promise<{ id: string } | null> {
  if (!supabaseUrl || !supabaseKey) return null;
  const authClient = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id };
}

// AI narrative is deliberately disabled at this checkpoint. A future provider
// may receive only the frozen, minimized envelope created by security.mjs.
Deno.serve(createCoachHandler({ verifyToken, allowedOrigin }));
