const MAX_BODY_BYTES = 64 * 1024;
const MAX_TEXT = 4096;
const ALLOWED_TYPES = new Set(['daily', 'pre_workout', 'post_workout', 'weekly', 'pattern']);
const ALLOWED_DECISIONS = new Set(['progress', 'normal', 'controlled', 'reduce', 'recovery', 'rest']);
const PROHIBITED_KEYS = new Set([
  'raw', 'polarraw', 'token', 'accesstoken', 'refreshtoken', 'authorization',
  'email', 'name', 'displayname', 'fullname', 'firstname', 'lastname', 'birthdate', 'birthday',
  'userid', 'supabaseuserid', 'polaruserid', 'profile', 'samples', 'hrvsamples',
  'breathingsamples', 'heartrateseries'
]);

export class CoachSecurityError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'CoachSecurityError';
    this.code = code;
    this.status = status;
  }
}

function normalizedKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}
function inspectKeys(value, path = '$', depth = 0) {
  if (depth > 16) throw new CoachSecurityError('payload_too_deep', 'Coach payload is too deeply nested.');
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectKeys(item, `${path}[${index}]`, depth + 1));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const key of Object.keys(value)) {
    if (PROHIBITED_KEYS.has(normalizedKey(key))) {
      throw new CoachSecurityError('sensitive_field_rejected', `Sensitive field is not accepted at ${path}.${key}.`);
    }
    inspectKeys(value[key], `${path}.${key}`, depth + 1);
  }
}
function safeText(value, max = MAX_TEXT) {
  if (value == null) return null;
  const next = String(value).replace(/\s+/g, ' ').trim();
  return next ? next.slice(0, max) : null;
}
function safeNumber(value, min, max) {
  if (value == null || value === '') return null;
  const next = Number(value);
  if (!Number.isFinite(next) || next < min || next > max) {
    throw new CoachSecurityError('invalid_number', 'Coach payload contains an invalid numeric value.');
  }
  return next;
}
function safeStringList(value, limit = 8) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, limit).map(item => safeText(item, 1024)).filter(Boolean);
}
function safeGuidance(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    mainLifts: safeText(source.mainLifts, 2048),
    accessories: safeText(source.accessories, 2048),
    stabilityPosture: safeText(source.stabilityPosture, 2048),
    conditioning: safeText(source.conditioning, 2048)
  };
}
function safeTrend(value) {
  if (!value || typeof value !== 'object') return null;
  const result = {
    id: safeText(value.id, 128),
    metric: safeText(value.metric, 128),
    title: safeText(value.title, 512),
    summary: safeText(value.summary, 2048),
    direction: safeText(value.direction, 64),
    relationship: safeText(value.relationship, 128),
    changePercent: value.changePercent == null ? null : safeNumber(value.changePercent, -1000, 1000),
    recentMean: value.recentMean == null ? null : safeNumber(value.recentMean, 0, 1000000),
    previousMean: value.previousMean == null ? null : safeNumber(value.previousMean, 0, 1000000),
    sampleSize: value.sampleSize == null ? null : safeNumber(value.sampleSize, 0, 100000),
    confidenceScore: value.confidenceScore == null ? null : safeNumber(value.confidenceScore, 0, 100)
  };
  return Object.fromEntries(Object.entries(result).filter(([, item]) => item != null));
}
function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}
function jsonBody(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
function corsHeaders(req, allowedOrigin) {
  const requestOrigin = req.headers.get('origin') || '';
  const local = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin);
  const origin = requestOrigin && (requestOrigin === allowedOrigin || local) ? requestOrigin : allowedOrigin || 'null';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

export function extractBearerToken(req) {
  const header = req.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) throw new CoachSecurityError('unauthorized', 'A valid authenticated session is required.', 401);
  return match[1];
}

export function sanitizeCoachInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new CoachSecurityError('invalid_payload', 'Coach request body must be an object.');
  }
  inspectKeys(input);
  const source = input.coach && typeof input.coach === 'object' ? input.coach : input;
  const type = safeText(source.type, 64);
  const decision = safeText(source.trainingDecision, 64);
  const date = safeText(source.date, 32);
  if (!ALLOWED_TYPES.has(type)) throw new CoachSecurityError('invalid_type', 'Unknown coach output type.');
  if (!ALLOWED_DECISIONS.has(decision)) throw new CoachSecurityError('invalid_decision', 'Unknown deterministic training decision.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw new CoachSecurityError('invalid_date', 'Coach date must use YYYY-MM-DD.');
  const safe = {
    schemaVersion: safeNumber(source.schemaVersion == null ? 1 : source.schemaVersion, 1, 100),
    type,
    date,
    inputHash: safeText(source.inputHash, 256),
    readinessScore: source.readinessScore == null ? null : safeNumber(source.readinessScore, 0, 100),
    readinessStatus: safeText(source.readinessStatus, 64),
    confidenceScore: safeNumber(source.confidenceScore, 0, 100),
    confidenceLabel: safeText(source.confidenceLabel, 64),
    headline: safeText(source.headline, 1024),
    summary: safeText(source.summary, 4096),
    keyDrivers: safeStringList(source.keyDrivers),
    trainingDecision: decision,
    loadAdjustmentPercent: safeNumber(source.loadAdjustmentPercent, -100, 100),
    workoutGuidance: safeGuidance(source.workoutGuidance),
    warnings: safeStringList(source.warnings),
    recoveryActions: safeStringList(source.recoveryActions),
    trendInsights: Array.isArray(source.trendInsights) ? source.trendInsights.slice(0, 8).map(safeTrend).filter(Boolean) : [],
    comparisonNotes: safeStringList(source.comparisonNotes),
    missingData: safeStringList(source.missingData),
    medicalDisclaimer: safeText(source.medicalDisclaimer, 4096)
  };
  return safe;
}

export function buildNarrativeEnvelope(deterministic) {
  return deepFreeze({
    schemaVersion: deterministic.schemaVersion,
    type: deterministic.type,
    date: deterministic.date,
    inputHash: deterministic.inputHash,
    readiness: {
      score: deterministic.readinessScore,
      status: deterministic.readinessStatus,
      confidenceScore: deterministic.confidenceScore,
      confidenceLabel: deterministic.confidenceLabel
    },
    safety: {
      trainingDecision: deterministic.trainingDecision,
      loadAdjustmentPercent: deterministic.loadAdjustmentPercent,
      warnings: deterministic.warnings
    },
    context: {
      keyDrivers: deterministic.keyDrivers,
      workoutGuidance: deterministic.workoutGuidance,
      recoveryActions: deterministic.recoveryActions,
      trendInsights: deterministic.trendInsights,
      comparisonNotes: deterministic.comparisonNotes,
      missingData: deterministic.missingData
    },
    medicalDisclaimer: deterministic.medicalDisclaimer
  });
}

export function mergeNarrative(deterministic, narrative) {
  const source = narrative && typeof narrative === 'object' ? narrative : {};
  return {
    ...deterministic,
    headline: safeText(source.headline, 1024) || deterministic.headline,
    summary: safeText(source.summary, 4096) || deterministic.summary,
    aiNarrative: {
      status: 'generated',
      explanation: safeText(source.explanation, 4096),
      modelWarnings: safeStringList(source.modelWarnings, 4)
    }
  };
}

export function createCoachHandler(options) {
  const verifyToken = options && options.verifyToken;
  const generateNarrative = options && options.generateNarrative;
  const allowedOrigin = options && options.allowedOrigin || '';
  if (typeof verifyToken !== 'function') throw new Error('verifyToken dependency is required.');
  return async function coachHandler(req) {
    const headers = corsHeaders(req, allowedOrigin);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (req.method !== 'POST') return jsonBody({ ok: false, error: 'method_not_allowed' }, 405, headers);
    try {
      const token = extractBearerToken(req);
      const authenticatedUser = await verifyToken(token);
      if (!authenticatedUser || !authenticatedUser.id) {
        return jsonBody({ ok: false, error: 'unauthorized' }, 401, headers);
      }
      const contentLength = Number(req.headers.get('content-length') || 0);
      if (contentLength > MAX_BODY_BYTES) throw new CoachSecurityError('payload_too_large', 'Coach payload is too large.', 413);
      const rawBody = await req.text();
      if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
        throw new CoachSecurityError('payload_too_large', 'Coach payload is too large.', 413);
      }
      let parsed;
      try { parsed = JSON.parse(rawBody); }
      catch { throw new CoachSecurityError('invalid_json', 'Coach request body is not valid JSON.'); }
      const deterministic = sanitizeCoachInput(parsed);
      const envelope = buildNarrativeEnvelope(deterministic);
      if (typeof generateNarrative !== 'function') {
        return jsonBody({ ok: false, error: 'ai_disabled', deterministic }, 503, headers);
      }
      const narrative = await generateNarrative(envelope);
      return jsonBody({ ok: true, result: mergeNarrative(deterministic, narrative) }, 200, headers);
    } catch (error) {
      if (error instanceof CoachSecurityError) {
        return jsonBody({ ok: false, error: error.code }, error.status, headers);
      }
      return jsonBody({ ok: false, error: 'internal_error' }, 500, headers);
    }
  };
}

export const SECURITY_LIMITS = Object.freeze({ maxBodyBytes: MAX_BODY_BYTES, maxText: MAX_TEXT });
