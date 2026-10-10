/* Nakhla Dental external DEMO backend. No patient data. V1.0.0 (forked from Tabah Dent External_v1) */
function fail_(code, retryable) {
  var e = new Error(code); e.publicCode = code;
  e.retryable = !!retryable; throw e;
}
function assert_(condition, code) { if (!condition) fail_(code, false); }
function props_() { return PropertiesService.getScriptProperties(); }
function cfg_() {
  var p = props_().getProperties();
  assert_(p.DEMO_MODE === 'true', 'DEMO_ONLY');
  assert_(p.SPREADSHEET_ID, 'CONFIG_SPREADSHEET');
  assert_(['DRY_RUN', 'EMAIL'].indexOf(p.MAIL_MODE) >= 0, 'CONFIG_MAIL_MODE');
  assert_(['true', 'false'].indexOf(p.PAUSED) >= 0, 'CONFIG_PAUSED');
  assert_(['true', 'false'].indexOf(p.DEMO_FAST) >= 0, 'CONFIG_DEMO_FAST');
  var allowed = (p.ALLOWED_EMAILS || '').split(',').map(function(x) {
    return x.trim().toLowerCase();
  }).filter(Boolean);
  /* قائمة فارغة = قبول بريد أي زائر (وضع العيادة الحقيقي).
     قائمة غير فارغة = حصر الرسائل بها فقط (وضع العرض التجريبي، ≤٥). */
  assert_(allowed.length <= 5, 'CONFIG_ALLOWLIST');
  allowed.forEach(email_);
  if (p.MAIL_MODE === 'EMAIL') email_(p.REPLY_TO);
  assert_(/^[A-Za-z0-9_-]{43,128}$/.test(p.INGEST_SECRET || ''), 'CONFIG_INGEST_SECRET');
  assert_(/^[A-Za-z0-9_-]{43,128}$/.test(p.ADMIN_SECRET || ''), 'CONFIG_ADMIN_SECRET');
  assert_(p.INGEST_SECRET !== p.ADMIN_SECRET, 'CONFIG_SEPARATE_KEYS');
  return {sheetId:p.SPREADSHEET_ID, mode:p.MAIL_MODE, paused:p.PAUSED === 'true',
    fast:p.DEMO_FAST === 'true', allowed:allowed, replyTo:p.REPLY_TO || '',
    ingestSecret:p.INGEST_SECRET, adminSecret:p.ADMIN_SECRET,
    maxRecords:100, maxEvents:60, maxJobs:30, maxStateChars:35000,
    timezone:'Asia/Riyadh'};
}
function email_(x) {
  assert_(typeof x === 'string' && x.length <= 120 &&
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(x),
    'INVALID_EMAIL');
  return x.toLowerCase();
}
function text_(x,max,code) {
  assert_(typeof x === 'string' && x.trim().length > 0 && x.length <= max &&
    !/[-\u001f\u007f]/.test(x), code); return x.trim();
}
function phone_(x) {
  assert_(typeof x === 'string' && /^\+?[0-9]{9,15}$/.test(x), 'INVALID_PHONE');
  return x;
}
function id_(x) {
  assert_(typeof x === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{7,79}$/.test(x),
    'INVALID_ID'); return x;
}
function obj_(x) {
  assert_(x && typeof x === 'object' && !Array.isArray(x), 'INVALID_OBJECT'); return x;
}
function keys_(x,allowed) {
  obj_(x); Object.keys(x).forEach(function(k) {
    assert_(allowed.indexOf(k) >= 0, 'UNEXPECTED_FIELD');
  });
}
function date_(x) {
  assert_(typeof x === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/.test(x),
    'INVALID_DATE');
  var n = Date.parse(x); assert_(Number.isFinite(n), 'INVALID_DATE');
  var d=x.slice(0,10).split('-').map(Number);
  var check=new Date(Date.UTC(d[0],d[1]-1,d[2]));
  assert_(check.getUTCFullYear()===d[0] && check.getUTCMonth()===d[1]-1 &&
    check.getUTCDate()===d[2], 'INVALID_DATE');
  assert_(Number(x.slice(11,13))<24 && Number(x.slice(14,16))<60 &&
    Number(x.slice(17,19))<60, 'INVALID_DATE'); return n;
}
function iso_(n) { return new Date(n).toISOString(); }
function copy_(x) { return JSON.parse(JSON.stringify(x)); }
function locked_(f) {
  var lock=LockService.getScriptLock();
  if (!lock.tryLock(5000)) fail_('BUSY',true);
  try { return f(); } finally { lock.releaseLock(); }
}
function hex_(bytes) {
  return bytes.map(function(b) {
    return ('0'+((b+256)%256).toString(16)).slice(-2);
  }).join('');
}
function hash_(s) {
  return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
    s,Utilities.Charset.UTF_8));
}
function mac_(s,key) {
  return hex_(Utilities.computeHmacSha256Signature(s,key,Utilities.Charset.UTF_8));
}
function equal_(a,b) {
  if (typeof a !== 'string' || a.length !== b.length) return false;
  var n=0; for(var i=0;i<a.length;i++) n |= a.charCodeAt(i)^b.charCodeAt(i);
  return n===0;
}
