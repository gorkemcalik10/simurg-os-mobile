import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((value) => binary += String.fromCharCode(value));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function randomToken(bytes = 32): string {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return base64Url(value);
}

export async function hashSecret(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return base64Url(new Uint8Array(digest));
}

async function encryptionKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("POLAR_TOKEN_ENCRYPTION_KEY");
  if (!secret || secret.length < 32) {
    throw new ApiError(500, "missing_encryption_key", "Polar token encryption is not configured.");
  }
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptSecret(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), encoder.encode(value));
  return `v1.${base64Url(iv)}.${base64Url(new Uint8Array(encrypted))}`;
}

export async function decryptSecret(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  const [version, ivValue, cipherValue] = value.split(".");
  if (version !== "v1" || !ivValue || !cipherValue) {
    throw new ApiError(500, "invalid_ciphertext", "Stored Polar token cannot be decrypted.");
  }
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64Url(ivValue) },
    await encryptionKey(),
    fromBase64Url(cipherValue),
  );
  return decoder.decode(decrypted);
}

export function getAdmin(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY");
  if (!url || !serviceKey) {
    throw new ApiError(500, "missing_supabase_config", "Supabase server configuration is missing.");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function configuredAppOrigin(): string {
  const configured = Deno.env.get("SIMURG_APP_URL") || "";
  try {
    return new URL(configured).origin;
  } catch {
    return "";
  }
}

export function configuredAppUrl(): string {
  const configured = Deno.env.get("SIMURG_APP_URL") || "";
  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new ApiError(500, "missing_app_url", "SIMURG_APP_URL is not configured.");
  }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    throw new ApiError(500, "invalid_app_url", "SIMURG_APP_URL must use HTTPS.");
  }
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function corsHeaders(req: Request): Record<string, string> {
  const requestOrigin = req.headers.get("origin") || "";
  const configuredOrigin = configuredAppOrigin();
  const localOrigin = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin);
  const allowedOrigin = requestOrigin && (requestOrigin === configuredOrigin || localOrigin)
    ? requestOrigin
    : configuredOrigin || "null";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-simurg-polar-client, x-simurg-polar-key",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export function options(req: Request): Response | null {
  return req.method === "OPTIONS" ? new Response(null, { status: 204, headers: corsHeaders(req) }) : null;
}

export function errorResponse(req: Request, error: unknown): Response {
  if (error instanceof ApiError) {
    return json(req, { ok: false, error: error.code, message: error.message }, error.status);
  }
  console.error("Polar AccessLink error", error);
  return json(req, { ok: false, error: "internal_error", message: "Unexpected Polar integration error." }, 500);
}

export type PolarConnection = {
  id: string;
  client_id: string;
  client_key_hash: string;
  polar_user_id: number;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  connected_at: string;
  last_sync_at: string | null;
  status: "connected" | "disconnected" | "error";
  error_message: string | null;
};

export async function authenticateConnection(req: Request, admin = getAdmin()): Promise<PolarConnection> {
  const clientId = req.headers.get("x-simurg-polar-client") || "";
  const clientKey = req.headers.get("x-simurg-polar-key") || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientId) || clientKey.length < 32) {
    throw new ApiError(401, "invalid_client_capability", "Polar connection capability is missing or invalid.");
  }
  const clientKeyHash = await hashSecret(clientKey);
  const { data, error } = await admin
    .from("polar_connections")
    .select("id,client_id,client_key_hash,polar_user_id,access_token,refresh_token,token_expires_at,connected_at,last_sync_at,status,error_message")
    .eq("client_id", clientId)
    .eq("client_key_hash", clientKeyHash)
    .maybeSingle();
  if (error) throw new ApiError(500, "connection_lookup_failed", "Polar connection lookup failed.");
  if (!data) throw new ApiError(404, "connection_not_found", "No Polar connection exists for this device.");
  return data as PolarConnection;
}

export function publicConnection(connection: PolarConnection) {
  return {
    status: connection.status,
    polarUserId: String(connection.polar_user_id),
    connectedAt: connection.connected_at,
    lastSyncAt: connection.last_sync_at,
    tokenExpiresAt: connection.token_expires_at,
    errorMessage: connection.error_message,
  };
}

export async function polarRequest(url: string, accessToken: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text.slice(0, 500);
    }
  }
  return { ok: response.ok, status: response.status, data };
}

function pick(record: Record<string, unknown> | null | undefined, keys: string[]): unknown {
  for (const key of keys) {
    if (record && record[key] !== undefined && record[key] !== null && record[key] !== "") return record[key];
  }
  return null;
}

function numeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const direct = Number(value.replace(",", "."));
  if (Number.isFinite(direct)) return direct;
  const match = value.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function safeRaw<T>(value: T): T | null {
  try {
    return JSON.parse(JSON.stringify(value, (key, item) => {
      if (/access.?token|refresh.?token|authorization|client.?secret|client.?key|encryption.?key/i.test(key)) return undefined;
      if (typeof item === "number" && !Number.isFinite(item)) return null;
      return item;
    })) as T;
  } catch {
    return null;
  }
}

function durationSeconds(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value);
  const source = String(value || "").trim();
  if (!source) return 0;
  if (/^P/i.test(source)) {
    const match = source.match(/^P(?:(\d+(?:\.\d+)?)D)?T?(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/i);
    if (match) return Math.round((Number(match[1] || 0) * 86400) + (Number(match[2] || 0) * 3600) + (Number(match[3] || 0) * 60) + Number(match[4] || 0));
  }
  const parts = source.split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function durationText(seconds: number): string {
  const value = Math.max(0, Math.round(seconds));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = value % 60;
  return [hours, minutes, secs].map((part) => String(part).padStart(2, "0")).join(":");
}

function dayName(date: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
  } catch {
    return "";
  }
}

function zoneDuration(zones: Record<string, string>, keys: string[]): number {
  return keys.reduce((total, key) => total + durationSeconds(zones[key]), 0);
}

export function normalizeExercise(input: Record<string, unknown>) {
  const start = String(pick(input, ["start_time", "start-time"]) || "");
  const date = (start.match(/^\d{4}-\d{2}-\d{2}/) || [""])[0];
  if (!date) return null;
  const rawDuration = pick(input, ["duration"]);
  const seconds = durationSeconds(rawDuration);
  const heartRate = (pick(input, ["heart_rate", "heart-rate"]) || {}) as Record<string, unknown>;
  const rawZones = (pick(input, ["heart_rate_zones", "heart-rate-zones"]) || []) as Array<Record<string, unknown>>;
  const zones: Record<string, string> = { zone1: "00:00:00", zone2: "00:00:00", zone3: "00:00:00", zone4: "00:00:00", zone5: "00:00:00" };
  rawZones.forEach((zone) => {
    const index = Math.round(numeric(pick(zone, ["index"])) || 0);
    if (index >= 1 && index <= 5) zones[`zone${index}`] = durationText(durationSeconds(pick(zone, ["in_zone", "in-zone", "inzone"])));
  });
  const classified = zoneDuration(zones, ["zone1", "zone2", "zone3", "zone4", "zone5"]);
  const fuelValues = {
    carbohydrate: numeric(pick(input, ["carbohydrate_percentage", "carbohydrate-percentage"])),
    protein: numeric(pick(input, ["protein_percentage", "protein-percentage"])),
    fat: numeric(pick(input, ["fat_percentage", "fat-percentage"])),
  };
  const hasFuel = Object.values(fuelValues).some((value) => value !== null);
  const sport = String(pick(input, ["sport"]) || "Polar Workout");
  const detail = String(pick(input, ["detailed_sport_info", "detailed-sport-info"]) || sport);
  const calories = numeric(pick(input, ["calories"]));
  const trainingLoadPro = objectValue(pick(input, ["training_load_pro", "training-load-pro"]));
  const rpeSource = pick(trainingLoadPro, ["user_rpe", "user-rpe"]);
  return {
    type: "polar_flow_workout",
    source: "Polar Flow",
    polarExerciseId: String(pick(input, ["id"]) || ""),
    device: String(pick(input, ["device"]) || "Polar device"),
    deviceId: pick(input, ["device_id", "device-id"]),
    activityType: sport,
    workoutType: detail,
    date,
    day: dayName(date),
    startTime: (start.match(/T(\d{2}:\d{2}(?::\d{2})?)/) || ["", ""])[1],
    duration: durationText(seconds),
    durationMinutes: Math.round((seconds / 60) * 10) / 10,
    activeCal: calories,
    totalCal: calories,
    avgHR: numeric(pick(heartRate, ["average"])),
    minHR: numeric(pick(heartRate, ["minimum"])),
    maxHR: numeric(pick(heartRate, ["maximum"])),
    rpe: numeric(rpeSource),
    trainingLoad: numeric(pick(input, ["training_load", "training-load"])),
    trainingLoadType: "Polar Training Load",
    cardioLoad: numeric(pick(trainingLoadPro, ["cardio_load", "cardio-load"])),
    muscleLoad: numeric(pick(trainingLoadPro, ["muscle_load", "muscle-load"])),
    perceivedLoad: numeric(pick(trainingLoadPro, ["perceived_load", "perceived-load"])),
    distance: numeric(pick(input, ["distance"])),
    runningIndex: numeric(pick(input, ["running_index", "running-index"])),
    zones,
    zoneSummary: {
      easyControlled: durationText(zoneDuration(zones, ["zone1", "zone2"])),
      moderate: durationText(zoneDuration(zones, ["zone3"])),
      high: durationText(zoneDuration(zones, ["zone4", "zone5"])),
      unclassifiedTime: durationText(Math.max(0, seconds - classified)),
    },
    fuel: hasFuel ? fuelValues : null,
    samples: Array.isArray(input.samples) ? safeRaw(input.samples) : null,
    notes: String(pick(input, ["notes", "note"]) || ""),
    syncedAt: new Date().toISOString(),
    importedAt: new Date().toISOString(),
    raw: safeRaw(input),
  };
}

export function normalizeActivity(input: Record<string, unknown>) {
  const samples = (pick(input, ["samples"]) || {}) as Record<string, unknown>;
  const start = String(pick(input, ["start_time", "start-time"]) || "");
  const date = String(pick(input, ["date"]) || pick(samples, ["date"]) || (start.match(/^\d{4}-\d{2}-\d{2}/) || [""])[0]);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return {
    date,
    source: "Polar Flow",
    polarActivityId: String(pick(input, ["id"]) || date),
    activeDuration: String(pick(input, ["active_duration", "active-duration", "duration"]) || ""),
    inactiveDuration: String(pick(input, ["inactive_duration", "inactive-duration"]) || ""),
    dailyActivity: numeric(pick(input, ["daily_activity", "daily-activity"])),
    activeCalories: numeric(pick(input, ["active_calories", "active-calories"])),
    totalCalories: numeric(pick(input, ["calories"])),
    steps: numeric(pick(input, ["steps", "active_steps", "active-steps"])),
    distanceFromSteps: numeric(pick(input, ["distance_from_steps", "distance-from-steps"])),
    inactivityAlertCount: numeric(pick(input, ["inactivity_alert_count", "inactivity-alert-count"])),
    syncedAt: new Date().toISOString(),
    raw: safeRaw(input),
  };
}

export function normalizeProfile(input: Record<string, unknown>) {
  return {
    source: "Polar Flow",
    weight: numeric(pick(input, ["weight"])),
    height: numeric(pick(input, ["height"])),
    birthday: pick(input, ["birthday"]),
    gender: pick(input, ["gender"]),
    maximumHeartRate: numeric(pick(input, ["maximum_heart_rate", "maximum-heart-rate"])),
    restingHeartRate: numeric(pick(input, ["resting_heart_rate", "resting-heart-rate"])),
    aerobicThreshold: numeric(pick(input, ["aerobic_threshold", "aerobic-threshold"])),
    anaerobicThreshold: numeric(pick(input, ["anaerobic_threshold", "anaerobic-threshold"])),
    vo2Max: numeric(pick(input, ["vo2_max", "vo2-max"])),
    weightSource: pick(input, ["weight_source", "weight-source"]),
    trainingBackground: pick(input, ["training_background"]),
    typicalDay: pick(input, ["typical_day"]),
    sleepGoal: numeric(pick(input, ["sleep_goal", "sleep-goal"])),
    modified: pick(input, ["modified", "created"]),
    syncedAt: new Date().toISOString(),
    raw: safeRaw(input),
  };
}

export function normalizeSleep(input: Record<string, unknown>) {
  const date = String(pick(input, ["date"]) || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const startTime = pick(input, ["sleep_start_time", "sleep-start-time", "start_time"]);
  const endTime = pick(input, ["sleep_end_time", "sleep-end-time", "end_time"]);
  const startMs = startTime ? Date.parse(String(startTime)) : NaN;
  const endMs = endTime ? Date.parse(String(endTime)) : NaN;
  const seconds = Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs ? Math.round((endMs - startMs) / 1000) : null;
  return {
    date,
    source: "Polar Flow",
    startTime: startTime || null,
    endTime: endTime || null,
    duration: seconds === null ? null : durationText(seconds),
    durationSeconds: seconds,
    sleepScore: numeric(pick(input, ["sleep_score", "sleep-score"])),
    continuity: numeric(pick(input, ["continuity"])),
    continuityClass: numeric(pick(input, ["continuity_class", "continuity-class"])),
    sleepCycles: numeric(pick(input, ["sleep_cycles", "sleep-cycles"])),
    interruptions: numeric(pick(input, ["total_interruption_duration", "total-interruption-duration"])),
    deepSleep: numeric(pick(input, ["deep_sleep", "deep-sleep"])),
    lightSleep: numeric(pick(input, ["light_sleep", "light-sleep"])),
    remSleep: numeric(pick(input, ["rem_sleep", "rem-sleep"])),
    awakeTime: numeric(pick(input, ["awake_time", "awake-time"])),
    unrecognizedSleepStage: numeric(pick(input, ["unrecognized_sleep_stage", "unrecognized-sleep-stage"])),
    sleepGoal: numeric(pick(input, ["sleep_goal", "sleep-goal"])),
    sleepCharge: numeric(pick(input, ["sleep_charge", "sleep-charge"])),
    syncedAt: new Date().toISOString(),
    raw: safeRaw(input),
  };
}

export function normalizeNightlyRecharge(input: Record<string, unknown>) {
  const date = String(pick(input, ["date"]) || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return {
    date,
    source: "Polar Flow",
    heartRateAvg: numeric(pick(input, ["heart_rate_avg", "heart-rate-avg"])),
    beatToBeatAvg: numeric(pick(input, ["beat_to_beat_avg", "beat-to-beat-avg"])),
    heartRateVariabilityAvg: numeric(pick(input, ["heart_rate_variability_avg", "heart-rate-variability-avg"])),
    breathingRateAvg: numeric(pick(input, ["breathing_rate_avg", "breathing-rate-avg"])),
    nightlyRechargeStatus: numeric(pick(input, ["nightly_recharge_status", "nightly-recharge-status"])),
    ansCharge: numeric(pick(input, ["ans_charge", "ans-charge"])),
    ansChargeStatus: numeric(pick(input, ["ans_charge_status", "ans-charge-status"])),
    hrvSamples: safeRaw(objectValue(pick(input, ["hrv_samples", "hrv-samples"]))),
    breathingSamples: safeRaw(objectValue(pick(input, ["breathing_samples", "breathing-samples"]))),
    syncedAt: new Date().toISOString(),
    raw: safeRaw(input),
  };
}

export function normalizeContinuousHr(input: Record<string, unknown>) {
  const date = String(pick(input, ["date"]) || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const rawSamples = Array.isArray(pick(input, ["heart_rate_samples", "heart-rate-samples"])) ? pick(input, ["heart_rate_samples", "heart-rate-samples"]) as Array<Record<string, unknown>> : [];
  const samples = rawSamples.map((sample) => ({
    sampleTime: pick(sample, ["sample_time", "sample-time"]) || null,
    heartRate: numeric(pick(sample, ["heart_rate", "heart-rate"])),
  })).filter((sample) => sample.heartRate !== null);
  const values = samples.map((sample) => sample.heartRate as number);
  return {
    date,
    source: "Polar Flow",
    samples,
    sampleCount: samples.length,
    averageHr: values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null,
    minHr: values.length ? Math.min(...values) : null,
    maxHr: values.length ? Math.max(...values) : null,
    syncedAt: new Date().toISOString(),
    raw: safeRaw(input),
  };
}

export function normalizeCardioLoad(input: Record<string, unknown>) {
  const date = String(pick(input, ["date"]) || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const status = pick(input, ["cardio_load_status", "cardio-load-status"]);
  return {
    date,
    source: "Polar Flow",
    cardioLoad: numeric(pick(input, ["cardio_load", "cardio-load"])),
    cardioLoadStatus: status || null,
    strain: numeric(pick(input, ["strain"])),
    tolerance: numeric(pick(input, ["tolerance"])),
    cardioLoadRatio: numeric(pick(input, ["cardio_load_ratio", "cardio-load-ratio"])),
    loadStatus: status || null,
    cardioLoadLevel: safeRaw(objectValue(pick(input, ["cardio_load_level", "cardio-load-level"]))),
    syncedAt: new Date().toISOString(),
    raw: safeRaw(input),
  };
}
