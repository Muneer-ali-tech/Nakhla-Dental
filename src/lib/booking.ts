/**
 * Nakhla Dental — booking submission client (two-phase demo flow).
 *
 * Standalone Nakhla booking client — the browser never talks to Google Apps
 * Script directly and never holds endpoint URLs or secrets. Every submission
 * goes to this site's own Netlify Function, which signs and forwards server-side:
 *
 *   Phase A — step 1 → "التالي"
 *     POST {action:"start", requestId, name, email, consent} →
 *     request.create phase:INCOMPLETE. External_v1 schedules ONE follow-up
 *     email ~2 minutes later to restore the visitor if they leave now.
 *
 *   Phase B — final step → "إرسال"
 *     POST {action:"complete", requestId, ..., date, timeSlot} →
 *     request.complete with the SAME requestId (expected_version 1). The
 *     pending follow-up is cancelled server-side and the request becomes
 *     SUBMITTED. No new request is ever created.
 *
 * The requestId and version of the started attempt live in sessionStorage
 * (getStartState/saveStartState/clearStartState) so a visitor who closes
 * the modal and reopens it continues the same logical booking attempt.
 *
 * Deployment variables live only in the Netlify UI (functions scope):
 *   NAKHLA_EXEC_URL, NAKHLA_INGEST_SECRET, FALLBACK_INTAKE_URL.
 * See netlify/functions/booking.ts for the trusted-sender contract.
 */

const ENDPOINT = "/.netlify/functions/booking";
const TIMEOUT_MS = 12000;
const RETRY_DELAY_MS = 1200;
const SESSION_STORAGE_KEY = "nakhla-booking-session";
const START_STORAGE_KEY = "nakhla-booking-start";

/**
 * Opaque per-tab session id for the server's edge guards (rate limit +
 * request binding). It is NOT a credential, holds no personal data, and
 * grants nothing by itself — it only lets the server tell one browser
 * session's submissions apart from another's.
 */
function bookingSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && /^[A-Za-z0-9_-]{8,128}$/.test(existing)) return existing;
    const fresh = newRequestId();
    sessionStorage.setItem(SESSION_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return newRequestId();
  }
}

export type Consent = { service: boolean; followup: boolean; review: boolean };

/**
 * Phase A — sent when the visitor presses "التالي" on step 1. Carries NO
 * branch_id / preferred_at slot data (INCOMPLETE rejects those). The
 * name + email + phone trio is saved server-side at this moment, so even an
 * abandoned attempt leaves a captured lead.
 */
export type StartPayload = {
  action: "start";
  requestId: string;
  name: string;
  email: string;
  phone: string;
  consent: Consent;
  lang: "ar" | "en";
};

/**
 * Phase B — sent on the final step's submit button. Same requestId as the
 * start (or fresh, see getStartState); completes the INCOMPLETE request.
 */
export type CompletePayload = {
  action: "complete";
  requestId: string;
  name: string;
  email: string;
  date: string;
  timeSlot: string;
  consent: Consent;
  phone: string;
  branch: string;
  department: string;
  doctor: string;
  notes: string;
  lang: "ar" | "en";
};

export type BookingPayload = StartPayload | CompletePayload;

export type SubmitFailure =
  | "NOT_CONFIGURED"
  | "OPENED_AS_FILE"
  | "VALIDATION"
  | "CONSENT_REQUIRED"
  | "FOLLOWUP_CONSENT_REQUIRED"
  | "EMAIL_NOT_ALLOWED"
  | "EMAIL_SUPPRESSED"
  | "DEMO_LIMIT"
  | "UNCONFIRMED"
  | "RATE_LIMITED"
  | "ORIGIN_NOT_ALLOWED"
  | "SESSION_MISMATCH"
  | "STATUS_CONFLICT"
  | "SERVER_ERROR"
  | "NETWORK"
  | "TIMEOUT"
  | "REJECTED";

export type SubmitResult =
  | { ok: true; reference: string; duplicate: boolean; requestId: string; stage: "create" | "complete" }
  | { ok: false; retryable: boolean; reason: SubmitFailure; field?: string };

/** Maps the exact time-button labels of the booking UI to 24-hour slots. */
export const SLOT_24H: Record<string, string> = {
  "9:00 صباحاً": "09:00",
  "10:00 صباحاً": "10:00",
  "11:00 صباحاً": "11:00",
  "12:00 صباحاً": "12:00",
  "1:00 صباحاً": "13:00",
  "4:00 مساءً": "16:00",
  "5:00 مساءً": "17:00",
  "6:00 مساءً": "18:00",
  "7:00 مساءً": "19:00",
  "8:00 مساءً": "20:00",
  "9:00 مساءً": "21:00",
  "9:00 AM": "09:00",
  "10:00 AM": "10:00",
  "11:00 AM": "11:00",
  "12:00 AM": "12:00",
  "1:00 AM": "13:00",
  "4:00 PM": "16:00",
  "5:00 PM": "17:00",
  "6:00 PM": "18:00",
  "7:00 PM": "19:00",
  "8:00 PM": "20:00",
  "9:00 PM": "21:00",
};

const KNOWN_ERRORS = [
  "VALIDATION",
  "CONSENT_REQUIRED",
  "FOLLOWUP_CONSENT_REQUIRED",
  "EMAIL_NOT_ALLOWED",
  "EMAIL_SUPPRESSED",
  "DEMO_LIMIT",
  "NOT_CONFIGURED",
  "OPENED_AS_FILE",
  "UNCONFIRMED",
  "RATE_LIMITED",
  "ORIGIN_NOT_ALLOWED",
  "SESSION_MISMATCH",
  "STATUS_CONFLICT",
  "SERVER_ERROR",
] as const;

/**
 * Fresh request id (opaque, matches the server's REQUEST_ID_RE contract:
 * 8–64 chars of [A-Za-z0-9-]). Used for session ids and for one booking
 * attempt's idempotent requestId.
 */
export function newRequestId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * The state of the booking attempt started at step 1 and kept until the
 * final submit is confirmed. It survives modal close/reopen within the tab:
 *
 *   - requestId: the id the INCOMPLETE create was sent under; the complete
 *     event MUST reuse it (no second request is ever created)
 *   - version:  always 1 here — the version the complete event is expected
 *     to match (expected_version) while nothing else has touched the record
 *   - reference: the reference returned by the start, re-shown on completion
 */
export type StartState = { requestId: string; version: number; reference: string };

function validRequestShape(state: Partial<StartState> | null): state is StartState {
  return (
    !!state &&
    typeof state.requestId === "string" &&
    /^[A-Za-z0-9-]{8,64}$/.test(state.requestId) &&
    typeof state.version === "number" &&
    Number.isInteger(state.version) &&
    state.version >= 1 &&
    typeof state.reference === "string"
  );
}

export function getStartState(): StartState | null {
  try {
    const raw = sessionStorage.getItem(START_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StartState> | null;
    return validRequestShape(parsed) ? { requestId: parsed.requestId, version: parsed.version, reference: parsed.reference } : null;
  } catch {
    return null;
  }
}

export function saveStartState(state: StartState): void {
  try {
    sessionStorage.setItem(START_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* best-effort only */
  }
}

/** Frees the attempt after the final submission is confirmed. */
export function clearStartState(): void {
  try {
    sessionStorage.removeItem(START_STORAGE_KEY);
  } catch {
    /* best-effort only */
  }
}

/**
 * The id of the booking attempt currently in flight (or that failed and
 * may be re-pressed). Kept for one attempt across every retry, re-press and
 * modal close/reopen — including after UNCONFIRMED — so the server always
 * sees the same requestId and can never create a duplicate. Never
 * regenerated to "fix" an error.
 */
export function getAttemptId(): string {
  const existing = getStartState();
  if (existing) return existing.requestId;
  try {
    const fresh = newRequestId();
    saveStartState({ requestId: fresh, version: 1, reference: "" });
    return fresh;
  } catch {
    return newRequestId();
  }
}

/** Frees the attempt slot after a confirmed success. */
export function clearAttemptId(): void {
  clearStartState();
}

async function postOnce(payload: BookingPayload): Promise<SubmitResult> {
  // The page was opened as a file from disk (file://…). The booking form
  // calls this site's own server-side function, which is unreachable from
  // a file page — no amount of retrying can fix that, so tell the user
  // exactly how to start the demo instead of a generic network error.
  if (typeof location !== "undefined" && location.protocol === "file:") {
    return { ok: false, retryable: false, reason: "OPENED_AS_FILE" };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // Same-origin call to this site's Netlify Function — no CORS preflight.
    // The session header backs the server's edge guards (rate limit,
    // requestId↔session binding); the browser sets Origin automatically.
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-nakhla-session": bookingSessionId(),
      },
      body: JSON.stringify(payload),
      credentials: "omit",
      cache: "no-store",
      signal: controller.signal,
    });
    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, retryable: true, reason: "NETWORK" };
    }
    const d = data as {
      ok?: unknown;
      reference?: unknown;
      duplicate?: unknown;
      requestId?: unknown;
      stage?: unknown;
      retryable?: unknown;
      reason?: unknown;
      field?: unknown;
    };
    if (d.ok === true && typeof d.reference === "string" && d.reference) {
      const stage = d.stage === "complete" ? "complete" : "create";
      return {
        ok: true,
        reference: d.reference,
        duplicate: d.duplicate === true,
        requestId: typeof d.requestId === "string" && d.requestId ? d.requestId : payload.requestId,
        stage,
      };
    }
    const reason =
      typeof d.reason === "string" && (KNOWN_ERRORS as readonly string[]).includes(d.reason)
        ? (d.reason as SubmitFailure)
        : "REJECTED";
    const retryable = d.retryable === true;
    const field = typeof d.field === "string" ? d.field : undefined;
    return { ok: false, retryable, reason, field };
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "AbortError";
    return { ok: false, retryable: true, reason: timedOut ? "TIMEOUT" : "NETWORK" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sends one booking event (phase A start or phase B complete). Retries once
 * on transient failures using the same requestId — the server treats a
 * repeated requestId as the same request (REQUEST_EXISTS read-back /
 * idempotency), so no duplicates are ever created. The requestId comes from
 * getAttemptId()/getStartState() and therefore stays the same across
 * retries, re-presses, and modal reopenings until the submission is
 * confirmed; it is never regenerated to "fix" an error.
 */
export async function submitBooking(payload: BookingPayload): Promise<SubmitResult> {
  const first = await postOnce(payload);
  if (first.ok || !first.retryable) return first;
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  return postOnce(payload);
}
