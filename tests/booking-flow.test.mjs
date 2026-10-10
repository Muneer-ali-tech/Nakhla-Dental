'use strict';

/**
 * Nakhla Dental — two-phase booking flow test against the REAL local
 * pieces: this site's own netlify/functions/booking.ts (bundled) wired to
 * the External_v1 simulator (the actual .gs sources) from the parent
 * workspace's scripts/demo-runtime.mjs. No network; mail stays in the
 * in-memory inbox.
 *
 * Verifies the "restore & complete" contract the Nakhla form relies on:
 *   1. Phase A (step 1 → "التالي") — request.create INCOMPLETE:
 *      saves the lead (name/email/phone), instant RECEIPT email lands,
 *      exactly ONE FOLLOWUP job is scheduled (~3 min FAST clock).
 *   2. Abandonment: if nothing else happens, the FOLLOWUP stays PENDING
 *      (it fires later via the worker tick) — i.e. the visitor who leaves
 *      gets the restore email.
 *   3. Phase B (final step → "إرسال") — request.complete on the SAME
 *      requestId: no second request is created, the request becomes
 *      SUBMITTED, and the pending FOLLOWUP is CANCELLED (no reminder after
 *      a completed booking).
 *   4. Idempotent re-press of "التالي": REQUEST_EXISTS is read back as a
 *      prior acceptance (duplicate:true), never a new request.
 *   5. A start without follow-up consent is rejected with
 *      FOLLOWUP_CONSENT_REQUIRED (the contract mandates the opt-in).
 *
 * Run from the Nakhla folder:  node --test tests/booking-flow.test.mjs
 * (or from anywhere: node --test <this file> — paths resolve on their own)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(__dirname, '..');

// The site's own self-contained runtime — nothing is imported from the
// parent workspace, so this test keeps working after the folder is moved.
const { createDemoRuntime } = await import(
  pathToFileURL(path.join(SITE, 'scripts', 'demo-runtime.mjs')).href
);

/**
 * Nakhla's own fork of the external backend (external-backend/apps-script)
 * so the simulated emails carry Nakhla branding, exactly like the deployed
 * Nakhla Apps Script will.
 */
function nakhlaRuntime() {
  return createDemoRuntime({
    functionPath: path.join(SITE, 'netlify', 'functions', 'booking.ts'),
    externalPath: path.join(SITE, 'external-backend'),
    mailFromName: 'Nakhla Dental DEMO',
  });
}

function postBooking(handler, payload) {
  const sessionId = 'test-session-0123456789';
  return handler(
    new Request('http://localhost:5177/.netlify/functions/booking', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:5177',
        'x-tabah-session': sessionId,
      },
      body: JSON.stringify(payload),
    }),
  ).then(async (res) => ({ status: res.status, body: await res.json() }));
}

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

test('Nakhla function: two-phase flow schedules the follow-up, then cancels it on completion', async () => {
  const { handler, sim } = nakhlaRuntime();

  const requestId = 'nakhla-e2e-0001';
  const email = 'visitor@example.com';

  /* ---- Phase A: step 1 → "التالي" (INCOMPLETE create) ---- */
  const start = await postBooking(handler, {
    action: 'start',
    requestId,
    name: 'عبدالله العتيبي',
    email,
    phone: '0501234567',
    consent: { service: true, followup: true, review: false },
    lang: 'ar',
  });
  assert.equal(start.status, 200, `start accepted: ${JSON.stringify(start.body)}`);
  assert.equal(start.body.ok, true);
  assert.equal(start.body.stage, 'create');
  assert.ok(start.body.reference, 'a reference is returned');

  // Exactly one request exists, INCOMPLETE, with the lead captured.
  const states = sim.allState();
  assert.equal(states.length, 1, 'no second request is created by the start');
  const st = states[0];
  assert.equal(st.status, 'INCOMPLETE');
  assert.equal(st.email, email);
  assert.equal(st.phone, '0501234567');

  // The instant RECEIPT email has landed in the inbox — under Nakhla
  // branding (the Nakhla fork of the external backend), never the other
  // clinic's name.
  assert.ok(
    sim.mail.some((m) => m.to === email),
    'instant receipt email is delivered to the visitor',
  );
  const receipt = sim.mail.find((m) => m.to === email);
  assert.ok(
    receipt.subject.includes('عيادات نخلة'),
    `email subject is Nakhla-branded: "${receipt.subject}"`,
  );
  assert.ok(
    !receipt.subject.includes('طابة') && !receipt.body.includes('طابة دنت'),
    'no trace of the other clinic in the email content',
  );

  // Exactly ONE follow-up job is scheduled and still PENDING (fires ~3 min
  // later if the visitor never completes — the abandonment restore email).
  const followups = st.jobs.filter((j) => j.kind === 'FOLLOWUP');
  assert.equal(followups.length, 1, 'exactly one FOLLOWUP job is scheduled');
  assert.equal(followups[0].status, 'PENDING');

  /* ---- Idempotent re-press of "التالي": same request, duplicate read-back ---- */
  const startAgain = await postBooking(handler, {
    action: 'start',
    requestId,
    name: 'عبدالله العتيبي',
    email,
    phone: '0501234567',
    consent: { service: true, followup: true, review: false },
    lang: 'ar',
  });
  assert.equal(startAgain.status, 200);
  assert.equal(startAgain.body.ok, true);
  assert.equal(startAgain.body.duplicate, true, 're-press reads the same request back');
  assert.equal(sim.allState().length, 1, 'still exactly one request');

  /* ---- Phase B: final step → "إرسال" (complete) ---- */
  const complete = await postBooking(handler, {
    action: 'complete',
    requestId,
    name: 'عبدالله العتيبي',
    email,
    date: tomorrow(),
    timeSlot: '17:00',
    consent: { service: true, followup: true, review: false },
    phone: '0501234567',
    branch: 'qiblatain',
    department: 'implant',
    doctor: 'harbi',
    notes: '',
    lang: 'ar',
  });
  assert.equal(complete.status, 200, `complete accepted: ${JSON.stringify(complete.body)}`);
  assert.equal(complete.body.ok, true);
  assert.equal(complete.body.stage, 'complete');
  assert.equal(complete.body.reference, start.body.reference, 'the SAME request is completed');

  const after = sim.allState();
  assert.equal(after.length, 1, 'no new request was created by the complete');
  assert.equal(after[0].status, 'SUBMITTED');
  const followupAfter = after[0].jobs.filter((j) => j.kind === 'FOLLOWUP');
  assert.equal(followupAfter.length, 1);
  assert.equal(
    followupAfter[0].status,
    'CANCELLED',
    'the pending follow-up is cancelled the moment the booking completes',
  );

  // The completed-booking receipt thanks the visitor in Nakhla's name.
  assert.ok(
    sim.mail.some((m) => m.to === email && m.body.includes('عيادات نخلة')),
    'the confirmation email body is signed by عيادات نخلة',
  );
});

test('Nakhla function: a start without follow-up consent is rejected (explicit opt-in required)', async () => {
  const { handler, sim } = nakhlaRuntime();

  const res = await postBooking(handler, {
    action: 'start',
    requestId: 'nakhla-e2e-0002',
    name: 'سارة القحطاني',
    email: 'sara@example.com',
    phone: '0509876543',
    consent: { service: true, followup: false, review: false },
    lang: 'ar',
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.ok, false);
  assert.equal(res.body.reason, 'FOLLOWUP_CONSENT_REQUIRED');
  assert.equal(sim.allState().length, 0, 'nothing was created');
});

test('Nakhla function: any visitor email is accepted — instant receipt, follow-up due in ~3 minutes', async () => {
  const { handler, sim } = nakhlaRuntime();

  // بريد زائر عشوائي غير مدرج في أي قائمة — يجب أن يُقبل
  const email = 'random-visitor-' + Date.now() + '@example.com';
  const res = await postBooking(handler, {
    action: 'start',
    requestId: 'nakhla-open-0001',
    name: 'زائر جديد',
    email,
    phone: '0501112222',
    consent: { service: true, followup: true, review: false },
    lang: 'ar',
  });
  assert.equal(res.status, 200, `any email accepted: ${JSON.stringify(res.body)}`);
  assert.equal(res.body.ok, true);

  const st = sim.allState()[0];
  assert.equal(st.status, 'INCOMPLETE');

  // التذكير مجدول بعد ~٣ دقائق (ساعة FAST) — ليس فوراً
  const fu = st.jobs.filter((j) => j.kind === 'FOLLOWUP')[0];
  const gap = (Date.parse(fu.due_at) - Date.parse(st.created_at)) / 1000;
  assert.ok(gap > 150 && gap < 210, `follow-up is due ~3 minutes after create (gap=${gap}s)`);
  assert.equal(fu.status, 'PENDING', 'follow-up not sent yet');

  // الرسالة الفورية هي «إشعار الاستلام» (سلوك مقصود)، لا التذكير
  assert.ok(
    sim.mail.some((m) => m.to === email && m.subject.includes('تأكيد استلام فوري')),
    'instant receipt email arrives immediately (by design)',
  );
});
