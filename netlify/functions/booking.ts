/**
 * Nakhla Dental — trusted server-side booking sender (Netlify Function, v2 format).
 * Same External_v1 contract as the Tabah Dent sender; deployed with the
 * Nakhla site so the browser talks only to its own origin. Keep this file
 * in sync with the parent project's netlify/functions/booking.ts.
 *
 * Two-phase External_v1 flow ("restore & complete"):
 *
 *   Phase A — step 1 → "التالي"     POST {action:"start"}
 *     → signed `request.create` {phase:"INCOMPLETE"} (no branch_id /
 *       preferred_at in data — External_v1 rejects them for INCOMPLETE).
 *       External_v1 schedules ONE follow-up email ~2 minutes later (FAST
 *       clock); it is cancelled the moment phase B lands.
 *   Phase B — final step → "إرسال"  POST {action:"complete"}
 *     → signed `request.complete` {expected_version, branch_id:"DEMO_BRANCH",
 *       preferred_at} for the SAME requestId. No new request is created; the
 *       pending follow-up job is cancelled and the request becomes SUBMITTED.
 *
 * The browser never talks to External_v1 and never holds the secret; this
 * function is the only signer. Both phases share the same origin/session/
 * rate-limit guards and the same retry semantics (max 3 attempts, 2s then 4s;
 * on retry only ts + signature change, body + event_id stay byte-identical).
 *
 * Environment variables (Netlify UI only — never VITE_/public):
 *   TABAH_EXEC_URL       https://script.google.com/macros/s/<ID>/exec (External_v1)
 *   TABAH_INGEST_SECRET  random URL-safe secret, 43-128 chars
 *   FALLBACK_INTAKE_URL  optional legacy simple-intake /exec URL; used only when
 *                        both TABAH_ variables are absent (demo-night switch)
 *
 * The v1 path requires a valid email and an explicit service consent
 * (External_v1 demo contract). On the v1 path:
 *   - action "start"    requires followup consent to be true (INCOMPLETE
 *     mandates followup:true — the user asked for help finishing later)
 *   - action "complete" always sends request.complete for the requestId the
 *     start created; no create is ever re-sent, and the consent decisions
 *     were captured explicitly by the form on step 1
 * The fallback intake keeps the public-site behaviour: email optional,
 * consent accepted but unused. The mode is known only server-side; the
 * browser form sends the same payload either way.
 *
 * External_v1 v1 contract implemented here (Tabah_Dent_External_v1/HANDOFF):
 *   - envelope {v:1, key_id:"ingest", ts, event_id, body, signature};
 *     message = [v, key_id, ts, event_id, body].join("\n");
 *     HMAC-SHA256 lowercase hex; on retry only ts + signature are refreshed
 *     while body + event_id stay byte-identical; max 3 attempts, 2s then 4s
 *   - phone/doctor/notes/department are legacy-intake-only fields, never
 *     sent to External_v1 (branch_id is fixed to DEMO_BRANCH)
 *   - consent.service must be true before any event is sent
 *   - REQUEST_EXISTS → read the same request back via request.get
 *   - duplicate:true is a prior acceptance, not a new request
 *   - VERSION_CONFLICT on complete → read the request back with request.get
 *     and surface STATUS_CONFLICT (never auto-resolve by resubmitting)
 *   - INVALID_TRANSITION on complete (already SUBMITTED) → read back and
 *     report success for the same request (idempotent re-press)
 *   - exhausted retries → UNCONFIRMED (retryable; the same requestId can be
 *     re-sent) — never a fake success, never a definitive failure
 *   - the handler runs under a hard deadline below the platform 10s cap
 *
 * Edge protection (HANDOFF_VSCODE_AR.md bound 5) — this handler is a trusted
 * signer and must never be an open POST that turns any visitor-supplied body
 * into a signed request:
 *   - allowed-origin check on every browser-reachable request (Origin alone
 *     is not authentication — the HMAC envelope stays the real authority)
 *   - per-session rate limit: N submissions per rolling window, keyed by a
 *     hash of the client identity; server-side only, no cookies issued
 *   - body size cap (MAX_BODY_BYTES) enforced before reading
 *   - session binding: one session may only ever submit its own requestIds;
 *     a requestId seen under a different session is rejected with
 *     SESSION_MISMATCH (knowing the id is not permission)
 *   - no cookie sessions → no CSRF token surface; the same-origin fetch and
 *     the Origin check close the cross-site POST path
 */

import { createHash, createHmac, randomUUID } from "node:crypto";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type SubmitReason =
  | "VALIDATION"
  | "CONSENT_REQUIRED"
  | "FOLLOWUP_CONSENT_REQUIRED"
  | "EMAIL_NOT_ALLOWED"
  | "EMAIL_SUPPRESSED"
  | "DEMO_LIMIT"
  | "NOT_CONFIGURED"
  | "UNCONFIRMED"
  | "RATE_LIMITED"
  | "ORIGIN_NOT_ALLOWED"
  | "SESSION_MISMATCH"
  | "STATUS_CONFLICT"
  | "SERVER_ERROR";

/** Form action — which step of the two-phase flow is being sent. */
export type BookingAction = "start" | "complete";

export type SubmitOutcome =
  | {
      ok: true;
      mode: "v1" | "fallback";
      /** "create" = request.create accepted, "complete" = request.complete accepted. */
      stage: "create" | "complete";
      action: BookingAction;
      reference: string;
      duplicate: boolean;
      status?: string;
      requestId: string;
    }
  | { ok: false; retryable: boolean; reason: SubmitReason; field?: string };

export type ValidatedBooking = {
  action: BookingAction;
  requestId: string;
  name: string;
  email: string;
  preferredAt: string;
  consent: { followup: boolean; review: boolean };
  legacy: {
    phone: string;
    branch: string;
    department: string;
    doctor: string;
    notes: string;
    lang: string;
  };
};

type ExecOutcome =
  | { kind: "accepted"; duplicate: boolean; status: string; reference: string }
  | { kind: "exists" }
  | { kind: "rejected"; code: string }
  | { kind: "retry" };

type LegacyOutcome =
  | { kind: "accepted"; reference: string; duplicate: boolean }
  | { kind: "rejected"; code: string; field?: string }
  | { kind: "retry" };

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const INGEST_KEY_ID = "ingest";
const MAX_BODY_BYTES = 8192;
const MAX_RESPONSE_CHARS = 131072;

/* Edge-protection constants (HANDOFF bound 5) */
const ALLOWED_ORIGINS = new Set(["https://tabah-dent.netlify.app"]);
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_TRACKED_SESSIONS = 10000;
const SESSION_ID_RE = /^[A-Za-z0-9_-]{8,128}$/;

const ATTEMPT_TIMEOUT_MS = 8000;
const RETRY_DELAYS_MS = [2000, 4000];
const RUN_BUDGET_MS = 9000;
const FINALIZE_MS = 600;
const MIN_ATTEMPT_MS = 900;

const REQUEST_ID_RE = /^[A-Za-z0-9][A-Za-z0-9-]{7,63}$/;
const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLOT_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const NAME_FORBIDDEN_RE = /[-\u001f\u007f]/;
const PHONE_RE = /^\+?[0-9]{9,15}$/;
const EXEC_URL_RE = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;
const SECRET_RE = /^[A-Za-z0-9_-]{43,128}$/;

const ALLOWED_INPUT_KEYS = new Set([
  "action", "requestId", "name", "email", "date", "timeSlot", "consent",
  "phone", "branch", "department", "doctor", "notes", "lang",
]);

const REJECTION_FIELD: Record<string, string> = {
  INVALID_NAME: "name",
  INVALID_EMAIL: "email",
  INVALID_DATE: "date",
  INVALID_PREFERRED_TIME: "date",
  SERVICE_CONSENT_REQUIRED: "consent",
  FOLLOWUP_CONSENT_REQUIRED: "consent.followup",
  INVALID_CONSENT: "consent",
  INVALID_CONSENT_TIME: "consent",
  INVALID_CONSENT_PROOF: "consent",
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function fail(retryable: boolean, reason: SubmitReason, field?: string): SubmitOutcome {
  return { ok: false, retryable, reason, field };
}

const unconfirmed = (): SubmitOutcome => fail(true, "UNCONFIRMED");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function jsonOut(status: number, payload: SubmitOutcome): Response {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

function statusFor(outcome: SubmitOutcome): number {
  if (outcome.ok) return 200;
  switch (outcome.reason) {
    case "VALIDATION":
    case "CONSENT_REQUIRED":
    case "FOLLOWUP_CONSENT_REQUIRED":
      return 400;
    case "EMAIL_NOT_ALLOWED":
    case "EMAIL_SUPPRESSED":
    case "ORIGIN_NOT_ALLOWED":
    case "SESSION_MISMATCH":
      return 403;
    case "RATE_LIMITED":
      return 429;
    case "NOT_CONFIGURED":
    case "DEMO_LIMIT":
    case "UNCONFIRMED":
      return 503;
    case "STATUS_CONFLICT":
    case "SERVER_ERROR":
      return 502;
    default:
      return 500;
  }
}

function mapRejection(code: string): SubmitOutcome {
  if (code === "RECIPIENT_NOT_ALLOWED") return fail(false, "EMAIL_NOT_ALLOWED", "email");
  if (code === "CONTACT_SUPPRESSED") return fail(false, "EMAIL_SUPPRESSED", "email");
  if (code === "REQUEST_EXISTS") return fail(false, "SERVER_ERROR");
  if (code === "NOT_FOUND") return fail(false, "SERVER_ERROR");
  if (code === "VERSION_CONFLICT") return fail(false, "STATUS_CONFLICT", "version");
  if (code === "INVALID_TRANSITION") return fail(false, "STATUS_CONFLICT", "status");
  if (code === "FOLLOWUP_CONSENT_REQUIRED") {
    return fail(false, "FOLLOWUP_CONSENT_REQUIRED", "consent.followup");
  }
  if (code.startsWith("DEMO_")) return fail(false, "DEMO_LIMIT");
  if (
    code.startsWith("CONFIG") ||
    code === "SETUP_REQUIRED" ||
    code === "DEMO_ONLY" ||
    code === "BAD_SIGNATURE" ||
    code === "STALE_SIGNATURE" ||
    code === "INVALID_ENVELOPE" ||
    code === "INVALID_JSON" ||
    code === "INVALID_BODY"
  ) {
    return fail(false, "NOT_CONFIGURED");
  }
  if (code.startsWith("INVALID") || code.startsWith("UNEXPECTED") || code === "TEST_DATA_REQUIRED") {
    return fail(false, "VALIDATION", REJECTION_FIELD[code]);
  }
  return fail(false, "SERVER_ERROR");
}

/** Remaining ms an attempt may use, clamped so the handler never exceeds its budget. */
function attemptTimeout(deadline: number): number {
  const usable = deadline - Date.now() - FINALIZE_MS;
  return Math.min(ATTEMPT_TIMEOUT_MS, Math.max(MIN_ATTEMPT_MS, usable));
}

function canAttempt(deadline: number, extraDelayMs = 0): boolean {
  return deadline - Date.now() - FINALIZE_MS >= extraDelayMs + MIN_ATTEMPT_MS;
}

/* ------------------------------------------------------------------ */
/* Edge protection (HANDOFF bound 5)                                    */
/* ------------------------------------------------------------------ */

/**
 * Origin allowlist. Browser-reachable requests must carry an Origin that is
 * either explicitly allowlisted (the known production domain) or same-origin
 * with the request itself (covers custom domains; browsers always send the
 * header for fetches from a real page). Origin alone is NOT authentication —
 * the HMAC envelope to External_v1 remains the real authority — but it
 * blocks cross-site POSTs from turning visitor bodies into signed requests.
 * No Referer fallback: an absent Origin is rejected.
 */
export function isOriginAllowed(request: Request, origin: string): boolean {
  if (origin === "") return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  let originUrl: URL;
  let requestUrl: URL;
  try {
    originUrl = new URL(origin);
    requestUrl = new URL(request.url);
  } catch {
    return false;
  }
  const isLocalHostname = (h: string) => h === "localhost" || h === "127.0.0.1" || h === "[::1]";
  // Local dev/preview servers on ANY port (vite picks 5174+ if 5173 is
  // busy), and only for local requests — the function never actually runs
  // off-machine behind a localhost Origin in production.
  if (isLocalHostname(originUrl.hostname)) {
    return originUrl.protocol === "http:" && isLocalHostname(requestUrl.hostname);
  }
  // Same-origin only over https: the function lives on the site itself.
  return originUrl.protocol === "https:" && originUrl.host === requestUrl.host;
}

/** Stable, non-reversible key from the client identity the edge gives us. */
function clientKey(sessionId: string): string {
  return createHash("sha256").update(`tabah-edge:${sessionId}`).digest("hex");
}

/**
 * Per-session, in-memory state: rolling window of new-request submissions
 * plus the requestId→session binding. Netlify Functions run on many
 * isolates, so this is a cheap local guard against one session hammering
 * the signer; the External_v1 rate limits and the ingest allowlist remain
 * the authoritative backstop.
 */
type SessionRecord = {
  requestIds: Set<string>;
  submissions: number[];
};

const SESSIONS = new Map<string, SessionRecord>();

function sessionRecord(sessionKey: string, nowMs: number): SessionRecord {
  const existing = SESSIONS.get(sessionKey);
  if (
    existing !== undefined &&
    nowMs - (existing.submissions[existing.submissions.length - 1] ?? 0) <= SESSION_TTL_MS
  ) {
    return existing;
  }
  const fresh: SessionRecord = { requestIds: new Set(), submissions: [] };
  if (SESSIONS.size >= MAX_TRACKED_SESSIONS) SESSIONS.clear(); // memory cap
  SESSIONS.set(sessionKey, fresh);
  return fresh;
}

export type EdgeSession = { ok: true; sessionKey: string } | { ok: false; error: SubmitOutcome };

/**
 * Edge checks that run before any body parsing or signing: allowed origin,
 * session header present and well-formed. Rate limiting and requestId
 * binding happen in registerSubmission once the payload is validated.
 */
export function checkEdge(request: Request): EdgeSession {
  const origin = request.headers.get("origin") ?? "";
  if (!isOriginAllowed(request, origin)) {
    return { ok: false, error: fail(false, "ORIGIN_NOT_ALLOWED", "origin") };
  }
  const sessionId = request.headers.get("x-tabah-session") ?? "";
  if (!SESSION_ID_RE.test(sessionId)) {
    return { ok: false, error: fail(false, "VALIDATION", "session") };
  }
  return { ok: true, sessionKey: clientKey(sessionId) };
}

/**
 * Session binding + rate limiting for one validated submission.
 *
 *   - A requestId already owned by this session is always allowed and
 *     consumes no budget: the v1 contract mandates that the same requestId
 *     can be re-sent (client auto-retry, UNCONFIRMED re-press).
 *   - A requestId owned by another session is rejected — knowing the id is
 *     not permission (bound 4).
 *   - A new requestId consumes one slot of the per-session rolling window;
 *     over the limit the session gets RATE_LIMITED until the window frees.
 */
export function registerSubmission(sessionKey: string, requestId: string): SubmitOutcome | null {
  const record = sessionRecord(sessionKey, Date.now());
  if (record.requestIds.has(requestId)) return null; // same-session resubmit
  if (ownsRequestIdElsewhere(sessionKey, requestId)) {
    return fail(false, "SESSION_MISMATCH", "requestId");
  }
  const now = Date.now();
  record.submissions = record.submissions.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (record.submissions.length >= RATE_LIMIT_MAX) {
    return fail(false, "RATE_LIMITED");
  }
  record.submissions.push(now);
  record.requestIds.add(requestId);
  return null;
}

function ownsRequestIdElsewhere(sessionKey: string, requestId: string): boolean {
  for (const [key, record] of SESSIONS) {
    if (key !== sessionKey && record.requestIds.has(requestId)) return true;
  }
  return false;
}

/** Test seam: forget all in-memory session state. */
export function resetEdgeStateForTests(): void {
  SESSIONS.clear();
}

/* ------------------------------------------------------------------ */
/* Input validation (mirrors External_v1 rules exactly)                */
/* ------------------------------------------------------------------ */

function optionalText(input: Record<string, unknown>, key: string, max: number): string {
  const v = input[key];
  if (typeof v !== "string" || v === "") return "";
  return v.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max);
}

export function validateBookingInput(
  raw: unknown,
  opts: { requireEmail: boolean; requireConsent: boolean },
): { ok: true; value: ValidatedBooking } | { ok: false; error: SubmitOutcome } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: fail(false, "VALIDATION", "body") };
  }
  const input = raw as Record<string, unknown>;
  for (const key of Object.keys(input)) {
    if (!ALLOWED_INPUT_KEYS.has(key)) return { ok: false, error: fail(false, "VALIDATION", key) };
  }

  // Two-phase flow: "start" = step-1 INCOMPLETE create, "complete" = final
  // SUBMITTED/complete. Absent action is NOT defaulted — the caller states
  // which step it is sending.
  const action = input.action;
  if (action !== "start" && action !== "complete") {
    return { ok: false, error: fail(false, "VALIDATION", "action") };
  }

  const requestId = input.requestId;
  if (typeof requestId !== "string" || !REQUEST_ID_RE.test(requestId)) {
    return { ok: false, error: fail(false, "VALIDATION", "requestId") };
  }

  const name = input.name;
  if (
    typeof name !== "string" ||
    name.length > 60 ||
    NAME_FORBIDDEN_RE.test(name) ||
    name.trim().length < 1
  ) {
    return { ok: false, error: fail(false, "VALIDATION", "name") };
  }

  // Email: required (and allowlisted) by the External_v1 contract; optional
  // on the legacy intake, but still format-checked when provided.
  const email = typeof input.email === "string" ? input.email.trim() : "";
  if (
    email.length > 120 ||
    (email !== "" && !EMAIL_RE.test(email)) ||
    (opts.requireEmail && email === "")
  ) {
    return { ok: false, error: fail(false, "VALIDATION", "email") };
  }

  // Phone: optional but format-checked — it is captured at step 1 together
  // with the name and email (External_v1 stores it on the request record).
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  if (phone !== "" && (phone.length > 15 || !PHONE_RE.test(phone))) {
    return { ok: false, error: fail(false, "VALIDATION", "phone") };
  }

  // Slot fields are final-step data: required for "complete", forbidden for
  // "start" (INCOMPLETE must carry no branch_id / preferred_at).
  let preferredAt = "";
  if (action === "complete") {
    const date = input.date;
    if (typeof date !== "string" || !DATE_RE.test(date)) {
      return { ok: false, error: fail(false, "VALIDATION", "date") };
    }
    const timeSlot = input.timeSlot;
    if (typeof timeSlot !== "string" || !SLOT_RE.test(timeSlot)) {
      return { ok: false, error: fail(false, "VALIDATION", "timeSlot") };
    }

    const parts = date.split("-").map(Number);
    const cal = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    if (
      cal.getUTCFullYear() !== parts[0] ||
      cal.getUTCMonth() !== parts[1] - 1 ||
      cal.getUTCDate() !== parts[2]
    ) {
      return { ok: false, error: fail(false, "VALIDATION", "date") };
    }

    preferredAt = `${date}T${timeSlot}:00+03:00`;
    const preferredMs = Date.parse(preferredAt);
    const nowMs = Date.now();
    if (!Number.isFinite(preferredMs) || preferredMs <= nowMs || preferredMs >= nowMs + 90 * 86400000) {
      return { ok: false, error: fail(false, "VALIDATION", "date") };
    }
  } else {
    if (input.date !== undefined) return { ok: false, error: fail(false, "VALIDATION", "date") };
    if (input.timeSlot !== undefined) {
      return { ok: false, error: fail(false, "VALIDATION", "timeSlot") };
    }
  }

  // Consent: an explicit user decision (no hidden defaults). Required with
  // service:true on the v1 path; accepted but unused on the legacy path.
  let consentService = false;
  let consentFollowup = false;
  let consentReview = false;
  if (input.consent !== undefined) {
    const consent = input.consent;
    if (typeof consent !== "object" || consent === null || Array.isArray(consent)) {
      return { ok: false, error: fail(false, "VALIDATION", "consent") };
    }
    const c = consent as Record<string, unknown>;
    for (const key of Object.keys(c)) {
      if (key !== "service" && key !== "followup" && key !== "review") {
        return { ok: false, error: fail(false, "VALIDATION", "consent") };
      }
    }
    if (
      typeof c.service !== "boolean" ||
      typeof c.followup !== "boolean" ||
      typeof c.review !== "boolean"
    ) {
      return { ok: false, error: fail(false, "VALIDATION", "consent") };
    }
    consentService = c.service;
    consentFollowup = c.followup;
    consentReview = c.review;
  }
  if (opts.requireConsent && consentService !== true) {
    return { ok: false, error: fail(false, "CONSENT_REQUIRED", "consent.service") };
  }
  // INCOMPLETE mandates an explicit follow-up opt-in: the visitor asked to
  // be helped back to the form (External_v1: FOLLOWUP_CONSENT_REQUIRED).
  if (opts.requireConsent && action === "start" && consentFollowup !== true) {
    return { ok: false, error: fail(false, "FOLLOWUP_CONSENT_REQUIRED", "consent.followup") };
  }

  const lang = optionalText(input, "lang", 2);
  if (lang !== "" && lang !== "ar" && lang !== "en") {
    return { ok: false, error: fail(false, "VALIDATION", "lang") };
  }

  return {
    ok: true,
    value: {
      action,
      requestId,
      name: name.trim(),
      email: email.toLowerCase(),
      preferredAt,
      consent: { followup: consentFollowup, review: consentReview },
      legacy: {
        phone,
        branch: optionalText(input, "branch", 40),
        department: optionalText(input, "department", 40),
        doctor: optionalText(input, "doctor", 60),
        notes: optionalText(input, "notes", 500),
        lang,
      },
    },
  };
}

/* ------------------------------------------------------------------ */
/* Event body + envelope (External_v1 v1 wire format)                  */
/* ------------------------------------------------------------------ */

/** Riyadh is UTC+3 year-round. */
export function riyadhIso(ms: number): string {
  return new Date(ms + 3 * 3600000).toISOString().replace("Z", "+03:00");
}

export function buildCreateEventBody(b: ValidatedBooking, nowMs: number): string {
  // Phase of this create: "start" sends INCOMPLETE (step 1 of the form, no
  // branch/slot data — External_v1 rejects those fields for INCOMPLETE and
  // schedules the 2-minute follow-up); "complete" sends SUBMITTED with the
  // branch and slot attached.
  const phase = b.action === "start" ? "INCOMPLETE" : "SUBMITTED";
  const data: Record<string, unknown> = {
    is_test: true,
    name: b.name,
    email: b.email,
    phase,
    consent: {
      service: true,
      followup: b.consent.followup,
      review: b.consent.review,
      at: riyadhIso(nowMs),
      version: "demo-email-v1",
      source: "demo-form",
    },
  };
  // Step-1 lead capture: the phone is stored together with the name and
  // email the moment the visitor presses "التالي" (External_v1 saves it on
  // the request record and shows it in the Requests view).
  if (b.legacy.phone) data.phone = b.legacy.phone;
  if (phase === "SUBMITTED") {
    data.branch_id = "DEMO_BRANCH";
    data.preferred_at = b.preferredAt;
  }
  return JSON.stringify({
    type: "request.create",
    request_id: b.requestId,
    data,
  });
}

/**
 * The final-step event: completes the earlier INCOMPLETE request under the
 * same request_id with the expected version, attaching branch + slot. Never
 * creates a new request; the pending follow-up job is cancelled server-side.
 */
export function buildCompleteEventBody(b: ValidatedBooking): string {
  return JSON.stringify({
    type: "request.complete",
    request_id: b.requestId,
    data: {
      expected_version: 1,
      branch_id: "DEMO_BRANCH",
      preferred_at: b.preferredAt,
    },
  });
}

export function buildGetEventBody(requestId: string): string {
  return JSON.stringify({ type: "request.get", request_id: requestId, data: {} });
}

export function signEnvelope(
  body: string,
  eventId: string,
  secret: string,
  tsSeconds: number,
): string {
  const message = [1, INGEST_KEY_ID, tsSeconds, eventId, body].join("\n");
  const signature = createHmac("sha256", secret).update(message, "utf8").digest("hex");
  return JSON.stringify({
    v: 1,
    key_id: INGEST_KEY_ID,
    ts: tsSeconds,
    event_id: eventId,
    body,
    signature,
  });
}

/* ------------------------------------------------------------------ */
/* Transport                                                           */
/* ------------------------------------------------------------------ */

async function postExec(
  url: string,
  envelope: string,
  expectedRequestId: string,
  timeoutMs: number,
): Promise<ExecOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Apps Script answers with a 302 to script.googleusercontent.com; fetch
    // follows it (method becomes GET on the final URL, which is expected).
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: envelope,
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return { kind: "retry" };
    const text = await res.text();
    if (text.length > MAX_RESPONSE_CHARS) return { kind: "retry" };
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { kind: "retry" };
    }
    if (typeof parsed !== "object" || parsed === null) return { kind: "retry" };
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.ok !== "boolean") return { kind: "retry" };
    if (obj.ok) {
      const inner = obj.data;
      if (typeof inner !== "object" || inner === null) return { kind: "retry" };
      const d = inner as Record<string, unknown>;
      if (d.request_id !== expectedRequestId) return { kind: "retry" };
      if (typeof d.reference !== "string" || d.reference === "") return { kind: "retry" };
      return {
        kind: "accepted",
        duplicate: obj.duplicate === true,
        status: typeof d.status === "string" ? d.status : "",
        reference: d.reference,
      };
    }
    const err = obj.error;
    if (typeof err === "object" && err !== null) {
      const e = err as Record<string, unknown>;
      if (e.code === "REQUEST_EXISTS") return { kind: "exists" };
      if (e.retryable === true) return { kind: "retry" };
      return { kind: "rejected", code: typeof e.code === "string" ? e.code : "" };
    }
    return { kind: "retry" };
  } catch {
    return { kind: "retry" };
  } finally {
    clearTimeout(timer);
  }
}

async function postLegacy(
  url: string,
  payload: string,
  timeoutMs: number,
): Promise<LegacyOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "text/plain;charset=utf-8" },
      body: payload,
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return { kind: "retry" };
    const text = await res.text();
    if (text.length > MAX_RESPONSE_CHARS) return { kind: "retry" };
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { kind: "retry" };
    }
    if (typeof parsed !== "object" || parsed === null) return { kind: "retry" };
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.ok !== "boolean") return { kind: "retry" };
    if (obj.ok) {
      if (typeof obj.reference === "string" && obj.reference !== "") {
        return { kind: "accepted", reference: obj.reference, duplicate: obj.duplicate === true };
      }
      return { kind: "retry" };
    }
    const code = typeof obj.error === "string" ? obj.error : "";
    if (code === "" || code === "BUSY" || code === "SERVER_ERROR") return { kind: "retry" };
    const field = typeof obj.field === "string" ? obj.field : undefined;
    return { kind: "rejected", code, field };
  } catch {
    return { kind: "retry" }
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* External_v1 submission (create + REQUEST_EXISTS read-back)           */
/* ------------------------------------------------------------------ */

async function readExisting(
  execUrl: string,
  secret: string,
  requestId: string,
  action: BookingAction,
  deadline: number,
): Promise<SubmitOutcome> {
  const body = buildGetEventBody(requestId);
  const eventId = "evt-" + randomUUID();
  for (let attempt = 0; ; attempt++) {
    if (!canAttempt(deadline)) return unconfirmed();
    const envelope = signEnvelope(body, eventId, secret, Math.floor(Date.now() / 1000));
    const outcome = await postExec(execUrl, envelope, requestId, attemptTimeout(deadline));
    if (outcome.kind === "accepted") {
      return {
        ok: true,
        mode: "v1",
        stage: action === "start" ? "create" : "complete",
        action,
        reference: outcome.reference,
        duplicate: true,
        status: outcome.status,
        requestId,
      };
    }
    if (outcome.kind === "rejected") {
      if (outcome.code === "NOT_FOUND") return unconfirmed();
      return mapRejection(outcome.code);
    }
    if (attempt >= RETRY_DELAYS_MS.length) return unconfirmed();
    const delay = RETRY_DELAYS_MS[attempt];
    if (!canAttempt(deadline, delay)) return unconfirmed();
    await sleep(delay);
  }
}

/** Rejection whose meaning depends on what the request looks like right now. */
async function resolveConflict(
  execUrl: string,
  secret: string,
  requestId: string,
  action: BookingAction,
  deadline: number,
): Promise<SubmitOutcome> {
  // Read the authoritative state back and decide from it — never resubmit
  // over a conflict (HANDOFF: VERSION_CONFLICT must not be bypassed).
  const body = buildGetEventBody(requestId);
  const eventId = "evt-" + randomUUID();
  const outcome = await postExec(
    execUrl,
    signEnvelope(body, eventId, secret, Math.floor(Date.now() / 1000)),
    requestId,
    attemptTimeout(deadline),
  );
  if (outcome.kind === "accepted") {
    if (action === "start") {
      // A create that turns out to exist is a prior acceptance — fine.
      return {
        ok: true,
        mode: "v1",
        stage: "create",
        action,
        reference: outcome.reference,
        duplicate: true,
        status: outcome.status,
        requestId,
      };
    }
    // Complete: success only if the request really is SUBMITTED. INCOMPLETE
    // means the complete never landed — retryable, re-press completes it.
    if (outcome.status === "SUBMITTED") {
      return {
        ok: true,
        mode: "v1",
        stage: "complete",
        action,
        reference: outcome.reference,
        duplicate: true,
        status: outcome.status,
        requestId,
      };
    }
    return unconfirmed();
  }
  return unconfirmed();
}

export async function submitV1(
  execUrl: string,
  secret: string,
  b: ValidatedBooking,
  deadline: number,
): Promise<SubmitOutcome> {
  const body = buildCreateEventBody(b, Date.now());
  const eventId = "evt-" + randomUUID();
  for (let attempt = 0; ; attempt++) {
    if (!canAttempt(deadline)) return unconfirmed();
    const envelope = signEnvelope(body, eventId, secret, Math.floor(Date.now() / 1000));
    const outcome = await postExec(execUrl, envelope, b.requestId, attemptTimeout(deadline));
    if (outcome.kind === "accepted") {
      return {
        ok: true,
        mode: "v1",
        stage: "create",
        action: b.action,
        reference: outcome.reference,
        duplicate: outcome.duplicate,
        status: outcome.status,
        requestId: b.requestId,
      };
    }
    if (outcome.kind === "exists") {
      return readExisting(execUrl, secret, b.requestId, b.action, deadline);
    }
    if (outcome.kind === "rejected") return mapRejection(outcome.code);
    if (attempt >= RETRY_DELAYS_MS.length) return unconfirmed();
    const delay = RETRY_DELAYS_MS[attempt];
    if (!canAttempt(deadline, delay)) return unconfirmed();
    await sleep(delay);
  }
}

export async function submitCompleteV1(
  execUrl: string,
  secret: string,
  b: ValidatedBooking,
  deadline: number,
): Promise<SubmitOutcome> {
  const body = buildCompleteEventBody(b);
  const eventId = "evt-" + randomUUID();
  for (let attempt = 0; ; attempt++) {
    if (!canAttempt(deadline)) return unconfirmed();
    const envelope = signEnvelope(body, eventId, secret, Math.floor(Date.now() / 1000));
    const outcome = await postExec(execUrl, envelope, b.requestId, attemptTimeout(deadline));
    if (outcome.kind === "accepted") {
      return {
        ok: true,
        mode: "v1",
        stage: "complete",
        action: "complete",
        reference: outcome.reference,
        duplicate: outcome.duplicate,
        status: outcome.status,
        requestId: b.requestId,
      };
    }
    // The start was already SUBMITTED (e.g. the create was sent directly
    // with phase SUBMITTED on an earlier press): verify via request.get and
    // report the prior acceptance — never send a second create.
    if (outcome.kind === "rejected" && outcome.code === "INVALID_TRANSITION") {
      return resolveConflict(execUrl, secret, b.requestId, "complete", deadline);
    }
    // The request moved underneath us (stale expected_version). Read the
    // authoritative state; if it is already SUBMITTED it is a prior
    // acceptance, otherwise the conflict is surfaced to the visitor.
    if (outcome.kind === "rejected" && outcome.code === "VERSION_CONFLICT") {
      return resolveConflict(execUrl, secret, b.requestId, "complete", deadline);
    }
    if (outcome.kind === "rejected" && outcome.code === "NOT_FOUND") {
      return fail(false, "SERVER_ERROR", "requestId");
    }
    if (outcome.kind === "rejected") return mapRejection(outcome.code);
    if (outcome.kind === "exists") return fail(false, "SERVER_ERROR", "requestId");
    if (attempt >= RETRY_DELAYS_MS.length) return unconfirmed();
    const delay = RETRY_DELAYS_MS[attempt];
    if (!canAttempt(deadline, delay)) return unconfirmed();
    await sleep(delay);
  }
}

/* ------------------------------------------------------------------ */
/* Legacy fallback intake (emergency switch only)                      */
/* ------------------------------------------------------------------ */

function mapLegacyRejection(code: string, field?: string): SubmitOutcome {
  if (code === "VALIDATION" || code === "BAD_REQUEST") {
    return fail(false, "VALIDATION", field);
  }
  if (code === "LIMIT") return fail(false, "DEMO_LIMIT");
  if (code === "CONFIG_REQUIRED") return fail(false, "NOT_CONFIGURED");
  return fail(false, "SERVER_ERROR");
}

export async function submitLegacy(
  url: string,
  b: ValidatedBooking,
  deadline: number,
): Promise<SubmitOutcome> {
  const payload = JSON.stringify({
    v: 1,
    idempotencyKey: b.requestId,
    name: b.name,
    phone: b.legacy.phone,
    email: b.email,
    branch: b.legacy.branch,
    department: b.legacy.department,
    doctor: b.legacy.doctor,
    date: b.preferredAt.slice(0, 10),
    timeSlot: b.preferredAt.slice(11, 16),
    notes: b.legacy.notes,
    lang: b.legacy.lang === "en" ? "en" : "ar",
  });
  for (let attempt = 0; ; attempt++) {
    if (!canAttempt(deadline)) return unconfirmed();
    const outcome = await postLegacy(url, payload, attemptTimeout(deadline));
    if (outcome.kind === "accepted") {
      return {
        ok: true,
        mode: "fallback",
        stage: "complete",
        action: "complete",
        reference: outcome.reference,
        duplicate: outcome.duplicate,
        requestId: b.requestId,
      };
    }
    if (outcome.kind === "rejected") return mapLegacyRejection(outcome.code, outcome.field);
    if (attempt >= RETRY_DELAYS_MS.length) return unconfirmed();
    const delay = RETRY_DELAYS_MS[attempt];
    if (!canAttempt(deadline, delay)) return unconfirmed();
    await sleep(delay);
  }
}

/* ------------------------------------------------------------------ */
/* Handler                                                             */
/* ------------------------------------------------------------------ */

export default async function handler(request: Request): Promise<Response> {
  const deadline = Date.now() + RUN_BUDGET_MS;

  if (request.method !== "POST") return jsonOut(405, fail(false, "VALIDATION", "method"));

  // Edge guards (HANDOFF bound 5): allowed origin, session binding,
  // per-session rate limit — before any body parsing or signing.
  const edge = checkEdge(request);
  if (!edge.ok) return jsonOut(statusFor(edge.error), edge.error);

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonOut(413, fail(false, "VALIDATION", "body"));
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return jsonOut(413, fail(false, "VALIDATION", "body"));

  const execUrl = (process.env.TABAH_EXEC_URL ?? "").trim();
  const secret = (process.env.TABAH_INGEST_SECRET ?? "").trim();
  const fallbackUrl = (process.env.FALLBACK_INTAKE_URL ?? "").trim();

  const mode: "v1" | "fallback" | "none" =
    execUrl === "" && secret === ""
      ? (EXEC_URL_RE.test(fallbackUrl) ? "fallback" : "none")
      : !EXEC_URL_RE.test(execUrl)
        ? "none"
        : !SECRET_RE.test(secret)
          ? "none"
          : "v1";
  if (mode === "none") {
    return jsonOut(503, fail(false, "NOT_CONFIGURED"));
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return jsonOut(400, fail(false, "VALIDATION", "body"));
  }
  const checked = validateBookingInput(parsed, {
    requireEmail: mode === "v1",
    requireConsent: mode === "v1",
  });
  if (!checked.ok) return jsonOut(statusFor(checked.error), checked.error);

  // Session binding + per-session rate limit for the validated requestId.
  // Same-session resubmit (retry / UNCONFIRMED re-press) stays free; a
  // different session replaying a known requestId is rejected — knowing
  // the id is not permission (bound 4 + 5).
  const registerError = registerSubmission(edge.sessionKey, checked.value.requestId);
  if (registerError !== null) return jsonOut(statusFor(registerError), registerError);

  let outcome: SubmitOutcome;
  if (mode === "fallback") {
    // Legacy intake has no two-phase flow: only the final submit reaches it.
    if (checked.value.action !== "complete") {
      return jsonOut(400, fail(false, "VALIDATION", "action"));
    }
    try {
      outcome = await submitLegacy(fallbackUrl, checked.value, deadline);
    } catch {
      outcome = unconfirmed();
    }
  } else if (checked.value.action === "start") {
    // Phase A: request.create phase:INCOMPLETE (External_v1 schedules the
    // single restore email).
    try {
      outcome = await submitV1(execUrl, secret, checked.value, deadline);
    } catch {
      outcome = unconfirmed();
    }
  } else {
    // Phase B: request.complete on the SAME requestId — never a new create,
    // never a second request (the pending restore email is cancelled
    // server-side the moment this lands).
    try {
      outcome = await submitCompleteV1(execUrl, secret, checked.value, deadline);
    } catch {
      outcome = unconfirmed();
    }
  }
  return jsonOut(statusFor(outcome), outcome);
}
