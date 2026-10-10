'use strict';

/**
 * Nakhla Dental — standalone local demo runtime.
 *
 * Self-contained local demo runtime for the Nakhla site: every default path
 * (booking function, external backend, mail config) points INSIDE this
 * folder, so the Nakhla site folder can be moved or copied anywhere and
 * `npm run dev` still runs the full two-phase booking demo.
 *
 * Wires the REAL Netlify booking function to an in-process simulation of the
 * external system (the actual .gs sources inside a fake-Google vm), so the
 * two-phase booking flow works under `npm run dev` / `npm run preview` — all
 * on this machine only. Nothing leaves localhost; mail goes to an in-memory
 * inbox, plus real SMTP delivery if demo-mail.local.json is configured.
 *
 *   createDemoRuntime() → { handler, sim, EXEC_URL, allowedEmails }
 *     handler(request: Request) → Promise<Response>  the real function,
 *       with its fetch bridged to the simulator's /exec surface
 *     sim: { exec, record, allState, mail, logLines, runWorker, refreshViews }
 *   startWorker(sim, intervalMs)  ticks due mail jobs (mimics the Apps
 *     Script time trigger; the 3-minute follow-up lands via this tick)
 */

import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildSync } = require('esbuild');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
/* Nakhla's own fork of the external backend (rebranded emails). */
const EXTERNAL = path.join(ROOT, 'external-backend');

const SECRET = 'local-demo-ingest-secret-43-chars-minimum-padding-x';
const ADMIN = 'local-demo-admin-secret-43-chars-minimum-paddingxx';

/* The URL the netlify function sends its signed envelopes to; intercepted
 * by the fetch bridge and answered from the simulator — never a real
 * Google endpoint. */
export const EXEC_URL = 'https://script.google.com/macros/s/LOCAL-DEMO/exec';

export function allowedEmails() {
  return (process.env.DEMO_ALLOWED_EMAILS || 'demo@example.com')
    .split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* Real email delivery (opt-in)                                        */
/*                                                                    */
/* Without demo-mail.local.json the demo stays fully offline: every     */
/* message lands in the fake inbox on /demo only. With SMTP settings    */
/* present, each MailApp send ALSO goes out for real to the address     */
/* the visitor typed (instant receipt, booking-received receipt and the */
/* 3-minute reminder alike), while the fake inbox keeps mirroring it    */
/* for the dashboard. Credentials live in demo-mail.local.json which    */
/* is gitignored (*.local) and never committed.                         */
/* ------------------------------------------------------------------ */

export function loadRealMailConfig(opts = {}) {
  const file = opts.mailConfigFile ?? path.join(ROOT, 'demo-mail.local.json');
  const mailFromName = opts.mailFromName || 'Nakhla Dental DEMO';
  try {
    if (!fs.existsSync(file)) return { enabled: false, reason: 'NO_CONFIG' };
    const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!cfg?.host || !cfg?.user || !cfg?.pass) {
      return { enabled: false, reason: 'INCOMPLETE_CONFIG (host/user/pass)' };
    }
    const nodemailer = require('nodemailer'); // throws a clear reason if absent
    const transport = nodemailer.createTransport({
      host: cfg.host,
      port: Number(cfg.port) || 465,
      secure: cfg.secure !== false,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    return {
      enabled: true,
      transport,
      user: cfg.user,
      from: cfg.from || `${mailFromName} <${cfg.user}>`,
    };
  } catch (err) {
    return { enabled: false, reason: String(err?.message || err) };
  }
}

/** Startup self-check: verify the SMTP login so a wrong app password or
 * host is reported in the banner immediately — before the first booking. */
export function verifyRealMail(realMail, log) {
  if (!realMail?.enabled || !realMail.transport) return;
  realMail.transport
    .verify()
    .then(() => log && log(`  ✓ اتصال SMTP سليم — الرسائل ستُسلَّم فعلياً من ${realMail.user}`))
    .catch((err) => log && log(`  ✗ فشل التحقق من SMTP: ${String(err?.message || err)} — راجع demo-mail.local.json (تأكد من كلمة مرور التطبيقات)`));
}

/* ------------------------------------------------------------------ */
/* External_v1 simulator — the real .gs files in a fake Google runtime */
/* ------------------------------------------------------------------ */

function externalSimulator(allowed, realMail, externalPath = EXTERNAL) {
  // A LIVE clock: the sim's "now" tracks real elapsed time from boot, so a
  // follow-up scheduled at +3 minutes fires 3 minutes after the BOOKING,
  // not 3 minutes after the server started.
  const boot = Date.now();
  let frozen = 0; // test hook: fixed offsets (advance) when set
  const nowMs = () => (frozen ? boot + frozen : Date.now());
  const mail = [];
  const properties = {
    DEMO_MODE: 'true',
    MAIL_MODE: 'EMAIL', // the local inbox is fake — safe to "send"
    PAUSED: 'false',
    DEMO_FAST: 'true', // follow-up due in 3 minutes, not 1 hour
    SPREADSHEET_ID: 'test-sheet',
    ALLOWED_EMAILS: allowed.join(','),
    REPLY_TO: realMail.enabled ? realMail.user : 'owner@example.com',
    INGEST_SECRET: SECRET,
    ADMIN_SECRET: ADMIN,
  };
  const sheets = {};
  function sheet(name) {
    return (
      sheets[name] ||
      (sheets[name] = {
        data: [],
        getLastRow() { return this.data.length; },
        getRange(row, col, n = 1, m = 1) {
          const self = this;
          return {
            getValues() {
              return Array.from({ length: n }, (_, i) =>
                Array.from({ length: m }, (_, j) => self.data[row - 1 + i]?.[col - 1 + j] ?? ''));
            },
            setValues(v) {
              v.forEach((x, i) => {
                self.data[row - 1 + i] ||= [];
                x.forEach((cell, j) => { self.data[row - 1 + i][col - 1 + j] = cell; });
              });
              return this;
            },
          };
        },
        appendRow(v) { this.data.push([...v]); },
        clearContents() { this.data = []; },
        setFrozenRows() {},
      })
    );
  }
  const book = {
    getId: () => 'test-sheet',
    getSheetByName: (n) => sheets[n] || null,
    insertSheet: sheet,
    setSpreadsheetTimeZone() {},
    getSpreadsheetTimeZone: () => 'Asia/Riyadh',
  };
  const triggers = [];
  const logLines = [];
  const context = {
    Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : [nowMs()])); }
      static now() { return nowMs(); }
    },
    console: { log() {}, error(x) { logLines.push(String(x)); } },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperties: () => ({ ...properties }),
        getProperty: (k) => properties[k] ?? null,
        setProperty: (k, v) => { properties[k] = v; },
      }),
    },
    SpreadsheetApp: { getActiveSpreadsheet: () => book, openById: () => book, flush() {} },
    LockService: {
      getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }),
    },
    Session: { getScriptTimeZone: () => 'Asia/Riyadh' },
    ScriptApp: {
      getProjectTriggers: () => triggers,
      newTrigger: (name) => ({
        timeBased() { return this; },
        everyMinutes() { return this; },
        create() { triggers.push({}); },
      }),
    },
    MailApp: {
      getRemainingDailyQuota: () => 1000,
      sendEmail(m) {
        const entry = {
          ...m,
          sent_at: new Date(nowMs()).toISOString(),
          real_status: realMail.enabled ? 'SENDING' : 'FAKE_INBOX',
        };
        mail.push(entry);
        if (!realMail.enabled) return;
        // Fire-and-forget real delivery to the address the visitor typed;
        // the vm call stays synchronous and a failure never breaks the flow.
        realMail.transport
          .sendMail({
            from: realMail.from,
            to: m.to,
            replyTo: m.replyTo || undefined,
            subject: m.subject,
            text: m.body,
          })
          .then(() => { entry.real_status = 'SENT'; })
          .catch((err) => {
            entry.real_status = 'ERROR';
            entry.real_error = String(err?.message || err);
            logLines.push(`REAL_MAIL_ERROR (${m.to}): ${entry.real_error}`);
          });
      },
    },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (s) => ({ text: s, setMimeType() { return this; } }),
    },
    Utilities: {
      Charset: { UTF_8: 'utf8' },
      DigestAlgorithm: { SHA_256: 'sha256' },
      computeDigest: (_, s) => Array.from(crypto.createHash('sha256').update(s, 'utf8').digest()),
      computeHmacSha256Signature: (s, k) =>
        Array.from(crypto.createHmac('sha256', k).update(s, 'utf8').digest()),
      getUuid: () => crypto.randomUUID(),
      formatDate: (d, tz, format) => {
        const p = new Intl.DateTimeFormat('en-GB', {
          timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
        }).formatToParts(d);
        const o = Object.fromEntries(p.map((x) => [x.type, x.value]));
        return format === 'H' ? o.hour : `${o.year}-${o.month}-${o.day} ${o.hour}:${o.minute}`;
      },
    },
  };
  vm.createContext(context);
  for (const f of ['Config.gs', 'Domain.gs', 'Storage.gs', 'Api.gs', 'Worker.gs', 'Admin.gs']) {
    vm.runInContext(fs.readFileSync(path.join(externalPath, 'apps-script', f), 'utf8'), context, { filename: f });
  }
  context.setupDemo();

  return {
    /** The /exec surface the sender POSTs to (parsed JSON object). */
    exec(contents) {
      const out = context.doPost({ postData: { contents } });
      return JSON.parse(out.text);
    },
    record(id) {
      return context.all_(context.cfg_()).find((x) => x.state.id === id)?.state;
    },
    allState() { return context.all_(context.cfg_()).map((x) => x.state); },
    mail,
    logLines,
    runWorker() { return context.runWorker(); },
    refreshViews() { context.refreshViews_(); },
    /** Local-demo convenience: admit the visitor's email into the allowlist
     * so ANY address typed into the form works (the cfg_ cap is 5; the oldest
     * extras rotate out). Only well-formed addresses are admitted — anything
     * else leaves the list untouched for the external system to reject. */
    allowEmail(rawEnvelope) {
      try {
        const envelope = JSON.parse(rawEnvelope);
        const inner = JSON.parse(envelope.body);
        const email = inner?.data?.email;
        if (
          typeof email !== 'string' ||
          !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)
        ) return;
        const lower = email.toLowerCase();
        const list = String(properties.ALLOWED_EMAILS)
          .split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
        if (list.includes(lower)) return;
        list.push(lower);
        while (list.length > 5) list.shift();
        properties.ALLOWED_EMAILS = list.join(',');
      } catch { /* malformed envelopes leave the allowlist untouched */ }
    },
  };
}

/* ------------------------------------------------------------------ */
/* Bundle the real netlify function once, bridge fetch → simulator     */
/* ------------------------------------------------------------------ */

/**
 * Creates the local runtime. `opts.functionPath` lets another site in this
 * workspace (e.g. the Nakhla folder) run ITS OWN copy of the booking
 * function against the same simulator; it defaults to this project's
 * netlify/functions/booking.ts so every existing caller is unaffected.
 */
export function createDemoRuntime(opts = {}) {
  const allowed = allowedEmails();
  const realMail = loadRealMailConfig(opts);
  const sim = externalSimulator(allowed, realMail, opts.externalPath);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nakhla-demo-'));
  const outFile = path.join(tmpDir, 'booking.cjs');
  buildSync({
    entryPoints: [opts.functionPath ?? path.join(ROOT, 'netlify', 'functions', 'booking.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: outFile,
  });
  // CJS bundle → load via require (its default export is the handler).
  const fn = require(outFile).default;

  process.env.NAKHLA_EXEC_URL = EXEC_URL;
  process.env.NAKHLA_INGEST_SECRET = SECRET;
  delete process.env.FALLBACK_INTAKE_URL;

  const realFetch = globalThis.fetch;
  // Bridge ONLY the external /exec URL; every other fetch passes through.
  // After every signed event we drain the worker immediately, so the instant
  // RECEIPT email lands in the demo inbox the moment a booking is accepted
  // (the visitor's demo shows "immediate confirmation" without waiting for
  // the 10s tick).
  const drain = () => {
    try {
      for (let i = 0; i < 3; i++) {
        const result = sim.runWorker();
        if (result !== 'PROCESSED') break;
      }
      sim.refreshViews();
    } catch { /* worker errors keep the booking flow alive */ }
  };
  globalThis.fetch = async (url, init) => {
    if (String(url) === EXEC_URL) {
      // Any email the visitor types works in the local demo: admit it into
      // the simulator's allowlist before the event is validated.
      sim.allowEmail(init.body);
      const response = sim.exec(init.body);
      drain();
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return realFetch(url, init);
  };

  return {
    handler: fn,
    sim,
    EXEC_URL,
    allowedEmails: allowed,
    realMail: {
      enabled: realMail.enabled,
      user: realMail.user || '',
      reason: realMail.reason || '',
    },
  };
}

/** Every ~10s: run the worker (due emails → the local inbox) and refresh
 * the Sheets views, mimicking the Apps Script time trigger. Instant receipts
 * are already drained inline at booking time; this tick catches the 3-minute
 * follow-up and anything else that becomes due later. */
export function startWorker(sim, intervalMs = 10000) {
  const timer = setInterval(() => {
    try {
      const result = sim.runWorker();
      if (result && result !== 'EMPTY' && result !== undefined) sim.refreshViews();
    } catch { /* the worker logs internally; skip broken ticks */ }
  }, intervalMs);
  timer.unref?.();
  return timer;
}
