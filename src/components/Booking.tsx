import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLang, toArDigits, type Bi } from "../lib/i18n";
import { BRANCHES, SERVICES, DOCTORS, WA_NUMBER, type Doctor } from "../lib/data";
import { SLOT_24H, getAttemptId, saveStartState, clearAttemptId, submitBooking } from "../lib/booking";
import { Check, Close, WhatsApp, Clock, Arrow, SpecIcons } from "./Icons";
import { cn } from "../utils/cn";

/* ============================================================
   نظام الحجز — مسار «الاستعادة والاستكمال» (نفس عقد طابة دنت)
   نافذة سفلية (جوال) / مركزية (مكتب) + نموذج مشترك بأربع خطوات:
   ١) الاسم + الجوال + البريد   ← «التالي» يرسل request.create
      بحالة INCOMPLETE فيُحفظ العميل المحتمل وتُجدول رسالة متابعة
      واحدة (≈٣ دقائق في وضع FAST) إن غادر الزائر قبل الإكمال.
   ٢) الفرع + الخدمة.
   ٣) الطبيب (أو «أقرب طبيب متاح»).
   ٤) اليوم + الوقت + ملاحظات   ← «إرسال» يرسل request.complete
      بنفس معرّف الطلب فتُلغى رسالة المتابعة ويُسجَّل الطلب مكتملًا،
      ويصل الزائر بريد تأكيد الاستلام.
   ============================================================ */
export type Pref = { service?: string; branch?: string; doctor?: string };
type Ctx = { open: (p?: Pref) => void; close: () => void };
const BookingCtx = createContext<Ctx>({ open: () => {}, close: () => {} });
export const useBooking = () => useContext(BookingCtx);

const DRAFT_KEY = "nakhla-booking-draft";

type Draft = {
  name: string; phone: string; email: string; branch: string;
  service: string; doctor: string; date: string; time: string; notes: string;
};
const EMPTY: Draft = { name: "", phone: "", email: "", branch: "", service: "", doctor: "", date: "", time: "", notes: "" };

function loadDraft(): Draft {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Draft>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

const isSaudiPhone = (v: string) => /^05\d{8}$/.test(v.trim());
const toSaudiDigits = (v: string) => v.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const MORNING = ["9:00", "10:00", "11:00", "12:00", "1:00"];
const EVENING = ["4:00", "5:00", "6:00", "7:00", "8:00", "9:00"];

function buildDays(isAr: boolean) {
  const out: { iso: string; label: string; month: string; num: number }[] = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const locale = isAr ? "ar-EG" : "en-US";
    out.push({
      iso: d.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat(locale, { weekday: "long" }).format(d),
      month: new Intl.DateTimeFormat(locale, { month: "long" }).format(d),
      num: d.getDate(),
    });
  }
  return out;
}

const STEPS: Bi[] = [
  { ar: "بياناتك", en: "Details" },
  { ar: "الفرع والخدمة", en: "Branch & service" },
  { ar: "الطبيب", en: "Doctor" },
  { ar: "الموعد", en: "Appointment" },
];

export function BookingForm({ pref }: { pref?: Pref }) {
  const { tx, isAr } = useLang();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [fail, setFail] = useState("");
  const [ref, setRef] = useState("");
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  // Step-1 INCOMPLETE send in flight (button shows a spinner while saving).
  const startInFlight = useRef(false);
  const days = useMemo(() => buildDays(isAr), [isAr]);

  // Seed from the persisted draft + any prefill (service/branch/doctor).
  useEffect(() => {
    const base = loadDraft();
    const next: Draft = { ...base };
    if (pref?.branch) next.branch = pref.branch;
    if (pref?.service) next.service = pref.service;
    if (pref?.doctor) {
      const d = DOCTORS.find((x) => tx(x.name) === pref.doctor || x.name.ar === pref.doctor || x.name.en === pref.doctor);
      if (d) next.doctor = d.id;
    }
    setDraft(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* ignore */ }
  }, [draft]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  // إذا غيّر الزائر الفرع أو الخدمة ولم يعد الطبيب المختار متاحاً، أعد الاختيار
  const setBranch = (v: string) =>
    setDraft((d) => {
      const doc = d.doctor && DOCTORS.find((x) => x.id === d.doctor);
      const keep = doc && doc.branches.includes(v) && (!d.service || doc.svc === d.service);
      return { ...d, branch: v, doctor: keep ? d.doctor : "" };
    });
  const setService = (v: string) =>
    setDraft((d) => {
      const doc = d.doctor && DOCTORS.find((x) => x.id === d.doctor);
      const keep = doc && doc.svc === v && (!d.branch || doc.branches.includes(d.branch));
      return { ...d, service: v, doctor: keep ? d.doctor : "" };
    });

  const validate = () => {
    if (step === 1) {
      if (draft.name.trim().length < 3) { setError(tx({ ar: "فضلاً أدخل اسمك الكريم كاملاً.", en: "Please enter your full name." })); return false; }
      if (!isSaudiPhone(toSaudiDigits(draft.phone))) { setError(tx({ ar: "رقم الجوال يجب أن يبدأ بـ ٠٥ ويتكون من ١٠ أرقام (05XXXXXXXX).", en: "Mobile must start with 05 and be 10 digits (05XXXXXXXX)." })); return false; }
      if (!EMAIL_RE.test(draft.email.trim())) { setError(tx({ ar: "أدخل بريداً إلكترونياً صحيحاً — سنرسل إليك تأكيد الحجز واستكماله.", en: "Enter a valid email — your booking confirmation goes there." })); return false; }
    }
    if (step === 2) {
      if (!draft.branch) { setError(tx({ ar: "اختر الفرع الذي تفضل زيارته.", en: "Please choose your preferred branch." })); return false; }
      if (!draft.service) { setError(tx({ ar: "حدد الخدمة المطلوبة.", en: "Please pick a service." })); return false; }
    }
    if (step === 3 && !draft.doctor) { setError(tx({ ar: "اختر طبيباً أو خيار «أقرب طبيب متاح».", en: "Choose a doctor or “first available doctor”." })); return false; }
    if (step === 4) {
      if (!draft.date) { setError(tx({ ar: "اختر اليوم المناسب لزيارتك.", en: "Please choose a day." })); return false; }
      if (!draft.time) { setError(tx({ ar: "حدد الوقت المناسب صباحاً أو مساءً.", en: "Please pick a morning or evening time." })); return false; }
    }
    setError("");
    return true;
  };

  const failText = (reason: string, field?: string) => {
    if (reason === "NOT_CONFIGURED") return tx({ ar: "الموقع غير مربوط بجدول الاستقبال بعد — راجع دليل الإعداد ثم أعد المحاولة.", en: "The site is not connected to the intake sheet yet — check the setup guide and retry." });
    if (reason === "OPENED_AS_FILE") return tx({ ar: "فتحتَ الصفحة كملف مباشر من القرص، والحجز يحتاج خادم الموقع. شغّل الخادم (npm run dev أو npm run demo) ثم أعد المحاولة.", en: "This page was opened as a file from disk; booking needs the site server. Start the dev server, then retry." });
    if (reason === "UNCONFIRMED") return tx({ ar: "لم نتأكد من تسجيل طلبك بعد — اضغط الزر مرة أخرى لاستكمال نفس الطلب، ولن يُسجَّل طلب مكرر.", en: "We could not confirm your request yet — press the button again to complete the same request; no duplicate will be created." });
    if (reason === "EMAIL_NOT_ALLOWED" || reason === "EMAIL_SUPPRESSED") return tx({ ar: "تعذّر قبول الطلب لهذا البريد الإلكتروني — استخدم بريداً آخر أو تواصل معنا مباشرة.", en: "This email could not be accepted — use another address or contact us directly." });
    if (reason === "CONSENT_REQUIRED" || reason === "FOLLOWUP_CONSENT_REQUIRED") return tx({ ar: "تعذّر إرسال الطلب. راجع بياناتك ثم أعد المحاولة.", en: "The request could not be sent. Check your details and retry." });
    if (reason === "STATUS_CONFLICT") return tx({ ar: "تعذّر إتمام هذا الطلب لأن حالته تغيّرت لدى الاستقبال — سيتواصل معك الفريق لتحديث موعدك.", en: "This request changed state at the front desk — the team will contact you to update your appointment." });
    if (reason === "RATE_LIMITED") return tx({ ar: "أرسلت عدة طلبات متقاربة — انتظر قليلاً ثم أعد المحاولة.", en: "Too many requests in a short window — wait a moment and retry." });
    if (reason === "VALIDATION" && field === "email") return tx({ ar: "أدخل بريداً إلكترونياً صحيحاً ثم أعد المحاولة.", en: "Enter a valid email address, then retry." });
    if (reason === "VALIDATION" || reason === "DEMO_LIMIT") return tx({ ar: "تعذّر إرسال الطلب. راجع بياناتك ثم أعد المحاولة.", en: "The request could not be sent. Check your details and retry." });
    return tx({ ar: "تعذّر الإرسال بسبب مشكلة اتصال — لم يُسجَّل أي طلب مكرر، اضغط الزر مرة أخرى.", en: "A connection problem stopped the request — no duplicate was created; press the button again." });
  };

  /**
   * الخطوة ١ ← «التالي»: يرسل request.create بحالة INCOMPLETE (بلا فرع/
   * موعد). الضغط على الزر هو قرار الموافقة الصريح (خدمة + متابعة) —
   * مثبت في سطر التنبيه أعلاه؛ يحفظ الخادم الاسم والبريد والجوال فوراً،
   * ويجدول النظام الخارجي رسالة المتابعة الوحيدة التي تُلغى عند الإكمال.
   */
  const sendStart = async () => {
    if (startInFlight.current) return;
    startInFlight.current = true;
    setStarting(true);
    setFail("");
    const res = await submitBooking({
      action: "start",
      requestId: getAttemptId(),
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: toSaudiDigits(draft.phone).trim(),
      consent: { service: true, followup: true, review: false },
      lang: isAr ? "ar" : "en",
    });
    startInFlight.current = false;
    setStarting(false);
    if (res.ok) {
      saveStartState({ requestId: res.requestId, version: 1, reference: res.reference });
      setStep(2);
      return;
    }
    setFail(failText(res.reason, res.field));
  };

  /**
   * الخطوة الأخيرة ← «إرسال»: يرسل request.complete بنفس معرّف الطلب
   * الذي بدأته الخطوة الأولى (expected_version 1). لا يُنشأ طلب جديد
   * أبداً؛ رسالة المتابعة المعلّقة تُلغى لدى القبول ويصل بريد التأكيد.
   */
  const sendComplete = async () => {
    if (sending) return;
    setSending(true);
    setFail("");
    const res = await submitBooking({
      action: "complete",
      requestId: getAttemptId(),
      name: draft.name.trim(),
      email: draft.email.trim(),
      date: draft.date,
      timeSlot: SLOT_24H[draft.time] ?? "",
      consent: { service: true, followup: true, review: false },
      phone: toSaudiDigits(draft.phone).trim(),
      branch: draft.branch,
      department: draft.service,
      doctor: draft.doctor,
      notes: draft.notes.trim(),
      lang: isAr ? "ar" : "en",
    });
    setSending(false);
    if (res.ok) {
      setRef(res.reference);
      setDone(true);
      // تأكيد النجاح: حرّر معرّف المحاولة ليبدأ الحجز التالي بمعرّف جديد.
      clearAttemptId();
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      return;
    }
    setFail(failText(res.reason, res.field));
  };

  const next = () => {
    if (starting || sending) return;
    if (!validate()) return;
    if (step === 1) { void sendStart(); return; }
    if (step < 4) { setStep(step + 1); return; }
    void sendComplete();
  };

  const reset = () => {
    setDraft(EMPTY);
    setStep(1);
    setDone(false);
    setError("");
    setFail("");
  };

  const chosenBranch = BRANCHES.find((b) => b.id === draft.branch);
  const chosenService = SERVICES.find((s) => s.id === draft.service);
  const chosenDoctor = DOCTORS.find((d) => d.id === draft.doctor);

  const docList: Doctor[] = useMemo(() => {
    const strict = DOCTORS.filter(
      (d) => (!draft.service || d.svc === draft.service) && (!draft.branch || d.branches.includes(draft.branch)),
    );
    if (strict.length) return strict;
    return DOCTORS.filter((d) => !draft.branch || d.branches.includes(draft.branch));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.service, draft.branch]);

  const am = isAr ? "صباحاً" : "AM";
  const pm = isAr ? "مساءً" : "PM";
  const slotLabel = (h: string, suffix: string) => (isAr ? `${toArDigits(h)} ${suffix}` : `${h} ${suffix}`);

  const waText = encodeURIComponent(
    isAr
      ? `السلام عليكم، هذا ملخص طلب الحجز في عيادات نخلة.\nالاسم: ${draft.name}\nالمرجع: ${ref}\nالفرع: ${chosenBranch?.name.ar ?? "-"}\nالخدمة: ${chosenService?.name.ar ?? "-"}\nالطبيب: ${chosenDoctor?.name.ar ?? "أقرب طبيب متاح"}\nالموعد المفضل: ${draft.date} • ${draft.time}`
      : `Hello, this is my Nakhla Dental booking summary.\nName: ${draft.name}\nReference: ${ref}\nBranch: ${chosenBranch?.name.en ?? "-"}\nService: ${chosenService?.name.en ?? "-"}\nDoctor: ${chosenDoctor?.name.en ?? "First available doctor"}\nPreferred slot: ${draft.date} • ${draft.time}`,
  );

  /* — عناصر التصميم المشتركة (هندسة حجر نخلة) — */
  const lab = cn("mb-2 block font-head text-[0.78rem] font-bold text-bronze");
  const chip = (on: boolean) =>
    cn(
      "cham min-h-[46px] px-4 font-head text-[0.82rem] font-bold transition-colors",
      on ? "bg-bronze text-hajar" : "border border-ink/25 text-ink hover:bg-ink/5",
    );
  const card = (on: boolean) =>
    cn(
      "cham border p-4 text-start transition-colors",
      on ? "border-bronze bg-palm text-hajar" : "border-ink/25 hover:border-bronze/60",
    );
  const stepBtn =
    "cham inline-flex min-h-[52px] items-center justify-center gap-2.5 bg-bronze px-8 font-head text-[0.9rem] font-bold text-hajar transition-colors hover:bg-palm disabled:cursor-wait disabled:opacity-70";

  const errBox =
    "cham border border-bronze bg-bronze/10 px-4 py-3 text-[0.82rem] font-bold text-bronze-soft";

  if (done)
    return (
      <div className="pop py-6 text-center">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center bg-bronze text-hajar cham">
          <Check className="h-8 w-8" />
        </div>
        <h3 className="t-h3">{tx({ ar: "وصلنا طلبك، شكراً لثقتك", en: "We've got your request — thank you" })}</h3>
        <p className="mx-auto mt-3 max-w-md text-[0.92rem] leading-[1.9] opacity-80">
          {tx({ ar: "رقم المرجع:", en: "Reference:" })} <b className="font-head" dir="ltr">{isAr ? toArDigits(ref) : ref}</b>
          {" — "}
          {tx({
            ar: "وصلتك رسالة تأكيد على بريدك، وسيتواصل معك منسّق المواعيد خلال ١٥ دقيقة في ساعات العمل لتأكيد موعدك.",
            en: "A confirmation email is on its way to you, and our coordinator will confirm your appointment within 15 minutes during opening hours.",
          })}
        </p>
        <div className="mx-auto mt-6 grid max-w-md gap-2 border border-ink/15 p-5 text-start text-[0.85rem]">
          {[
            [tx({ ar: "الفرع", en: "Branch" }), chosenBranch ? `${tx(chosenBranch.name)} — ${tx(chosenBranch.city)}` : "—"],
            [tx({ ar: "الخدمة", en: "Service" }), chosenService ? tx(chosenService.name) : "—"],
            [tx({ ar: "الطبيب", en: "Doctor" }), chosenDoctor ? tx(chosenDoctor.name) : tx({ ar: "أقرب طبيب متاح", en: "First available doctor" })],
            [tx({ ar: "الموعد", en: "Appointment" }), `${draft.date} • ${draft.time}`],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3">
              <span className="opacity-60">{k}</span>
              <span className="font-head font-bold">{v}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
          <a href={`https://wa.me/${WA_NUMBER}?text=${waText}`} target="_blank" rel="noopener" className={cn(stepBtn, "border !bg-transparent !text-ink hover:!bg-ink hover:!text-hajar")}>
            <WhatsApp className="h-5 w-5" />
            {tx({ ar: "أرسل التفاصيل إلى واتساب", en: "Send details to WhatsApp" })}
          </a>
          <button type="button" onClick={reset} className="cham min-h-[52px] px-6 font-head text-[0.88rem] font-bold underline underline-offset-8">
            {tx({ ar: "حجز آخر", en: "Book another" })}
          </button>
        </div>
      </div>
    );

  return (
    <div className="space-y-7">
      {/* مؤشر الخطوات: ماسات نجدية + شريط تقدّم */}
      <div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {STEPS.map((s, i) => (
            <span key={i} className={cn("flex items-center gap-2 font-head text-[0.74rem] font-bold transition-colors", i + 1 === step ? "text-palm" : i + 1 < step ? "text-bronze" : "text-ink/40")}>
              <span className={cn("cham grid h-6 w-6 place-items-center text-[0.68rem]", i + 1 < step ? "bg-bronze text-hajar" : i + 1 === step ? "bg-palm text-hajar" : "border border-ink/25")}>
                {i + 1 < step ? <Check className="h-3 w-3" /> : isAr ? toArDigits(String(i + 1)) : i + 1}
              </span>
              <span>{tx(s)}</span>
            </span>
          ))}
          <span className="ms-auto font-head text-[0.75rem] font-bold text-bronze">{isAr ? toArDigits(String(step)) : step}/٤</span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {STEPS.map((_, i) => (
            <span key={i} className={cn("cham h-1.5 flex-1 transition-colors", i < step ? "bg-bronze" : "bg-ink/15")} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <p className="text-[0.88rem] opacity-70">{tx({ ar: "الخطوة الأولى من ٤ — بيانات التواصل الأساسية.", en: "Step 1 of 4 — your basic contact details." })}</p>
          <label className="block">
            <span className={lab}>{tx({ ar: "الاسم الكريم", en: "Full name" })} <span className="text-bronze-soft">*</span></span>
            <input className="field" value={draft.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" placeholder={tx({ ar: "مثال: عبدالله العتيبي", en: "e.g. Abdullah Al-Otaibi" })} />
          </label>
          <div className="grid gap-6 sm:grid-cols-2">
            <label>
              <span className={lab}>{tx({ ar: "رقم الجوال", en: "Mobile number" })} <span className="text-bronze-soft">*</span></span>
              <input className="field" dir="ltr" style={{ textAlign: isAr ? "right" : "left" }} value={draft.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" autoComplete="tel" placeholder="05X XXX XXXX" />
            </label>
            <label>
              <span className={lab}>{tx({ ar: "البريد الإلكتروني", en: "Email" })} <span className="text-bronze-soft">*</span></span>
              <input className="field" dir="ltr" style={{ textAlign: isAr ? "right" : "left" }} type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" placeholder="name@email.com" />
            </label>
          </div>
          {/* سطر الموافقة: الضغط على «التالي» هو القرار الصريح */}
          <p className="cham border border-bronze/30 bg-bronze/10 px-4 py-3 text-[0.78rem] leading-[1.9] opacity-85">
            {tx({
              ar: "بالضغط على «التالي» أوافق على أن تتواصل معي العيادة عبر البريد لإتمام حجزي، بما فيها رسالة واحدة لاستكمال الطلب إذا تركت الصفحة قبل إكماله.",
              en: "By pressing “Next” I agree the clinic may contact me by email to complete my booking, including one continuation message if I leave before finishing.",
            })}
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <p className="text-[0.88rem] opacity-70">{tx({ ar: "الخطوة الثانية من ٤ — اختر الفرع والخدمة.", en: "Step 2 of 4 — choose the branch and service." })}</p>
          <div>
            <span className={lab}>{tx({ ar: "الفرع", en: "Branch" })} <span className="text-bronze-soft">*</span></span>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {BRANCHES.map((b) => (
                <button type="button" key={b.id} onClick={() => setBranch(b.id)} className={card(draft.branch === b.id)} aria-pressed={draft.branch === b.id}>
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-head text-[0.9rem] font-bold">{tx(b.name)}</span>
                    <span className={cn("cham grid h-5 w-5 place-items-center border", draft.branch === b.id ? "border-hajar bg-hajar text-palm" : "border-ink/25")}>
                      {draft.branch === b.id && <Check className="h-3 w-3" />}
                    </span>
                  </span>
                  <span className="mt-1 block text-[0.78rem] opacity-70">{tx(b.city)}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className={lab}>{tx({ ar: "الخدمة", en: "Service" })} <span className="text-bronze-soft">*</span></span>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map((s) => (
                <button type="button" key={s.id} onClick={() => setService(s.id)} className={chip(draft.service === s.id)} aria-pressed={draft.service === s.id}>
                  <span className="flex items-center gap-2">
                    {SpecIcons[s.id] && <span className="opacity-80">{SpecIcons[s.id]({ className: "h-4 w-4" })}</span>}
                    {tx(s.name)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <p className="text-[0.88rem] opacity-70">
            {tx({ ar: "الخطوة الثالثة من ٤ — الأطباء المتاحون وفق اختيارك", en: "Step 3 of 4 — doctors available for your choice" })}
            {chosenBranch ? ` ${tx({ ar: "في", en: "at" })} ${tx(chosenBranch.name)}.` : "."}
          </p>
          <button type="button" onClick={() => set("doctor", "any")} className={cn(card(draft.doctor === "any"), "flex w-full items-center gap-4")}>
            <span className="cham grid h-12 w-12 shrink-0 place-items-center bg-palm text-hajar">
              <Check className="h-5 w-5" />
            </span>
            <span className="min-w-0 text-start">
              <span className="block font-head text-[0.95rem] font-bold">{tx({ ar: "أقرب طبيب متاح", en: "First available doctor" })}</span>
              <span className="mt-0.5 block text-[0.78rem] opacity-70">{tx({ ar: "نرتب لك أقرب موعد مع الكادر المناسب لحالتك.", en: "We arrange the earliest slot with the right clinician for you." })}</span>
            </span>
          </button>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {docList.map((d) => (
              <button type="button" key={d.id} onClick={() => set("doctor", d.id)} className={cn(card(draft.doctor === d.id), "flex items-center gap-3.5")} aria-pressed={draft.doctor === d.id}>
                <img src={d.img} alt="" loading="lazy" className="cham h-12 w-12 shrink-0 object-cover" style={{ objectPosition: "50% 12%" }} />
                <span className="min-w-0 text-start">
                  <span className="block truncate font-head text-[0.9rem] font-bold">{tx(d.name)}</span>
                  <span className="mt-0.5 block truncate text-[0.76rem] opacity-70">{tx(d.spec)}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-[0.72rem] opacity-60">
                    <Clock className="h-3 w-3" />
                    {isAr ? `${toArDigits(String(d.years))} ${tx({ ar: "عاماً من الخبرة", en: "years' experience" })}` : `${d.years} years' experience`}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <p className="text-[0.88rem] opacity-70">{tx({ ar: "الخطوة الرابعة من ٤ — اختر اليوم والوقت المناسبين.", en: "Step 4 of 4 — pick a day and time that suit you." })}</p>
          <div>
            <span className={lab}>{tx({ ar: "اليوم المناسب", en: "Preferred day" })} <span className="text-bronze-soft">*</span></span>
            <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-2">
              {days.map((d) => (
                <button
                  type="button"
                  key={d.iso}
                  onClick={() => set("date", d.iso)}
                  className={cn("cham flex w-[76px] shrink-0 flex-col items-center py-3 transition-colors", draft.date === d.iso ? "bg-bronze text-hajar" : "border border-ink/25 hover:border-bronze/60")}
                >
                  <span className="text-[0.72rem] opacity-75">{d.label}</span>
                  <span className="mt-0.5 font-head text-[1.15rem] font-extrabold">{isAr ? toArDigits(String(d.num)) : d.num}</span>
                  <span className="text-[0.68rem] opacity-70">{d.month}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { title: tx({ ar: "الفترة الصباحية (٩ ص — ١ م)", en: "Morning (9am – 1pm)" }), arr: MORNING, suffix: am },
              { title: tx({ ar: "الفترة المسائية (٤ م — ١٠ م)", en: "Evening (4pm – 10pm)" }), arr: EVENING, suffix: pm },
            ].map((g) => (
              <div key={g.title}>
                <span className={lab}>{g.title}</span>
                <div className="flex flex-wrap gap-2">
                  {g.arr.map((h) => {
                    const key = `${h} ${g.suffix}`;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => set("time", key)}
                        className={cn(chip(draft.time === key), "min-h-[44px] px-5")}
                        aria-pressed={draft.time === key}
                      >
                        {slotLabel(h, g.suffix)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <label className="block">
            <span className={lab}>
              {tx({ ar: "ملاحظات", en: "Notes" })} <span className="font-body font-normal opacity-50">({tx({ ar: "اختياري", en: "optional" })})</span>
            </span>
            <textarea
              className="field resize-none"
              rows={3}
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder={tx({ ar: "أعراض، حساسية دوائية، أو تفاصيل تود إخبار الطبيب بها...", en: "Symptoms, drug allergies, or anything the doctor should know..." })}
            />
          </label>
        </div>
      )}

      {(error || fail) && <p className={errBox}>{error || fail}</p>}

      {/* أزرار التنقل */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => { setStep((s) => Math.max(1, s - 1)); setFail(""); }}
          disabled={step === 1 || sending || starting}
          className="cham min-h-[48px] border border-ink/25 px-6 font-head text-[0.85rem] font-bold transition-colors hover:bg-ink hover:text-hajar disabled:cursor-not-allowed disabled:opacity-40"
        >
          {tx({ ar: "السابق", en: "Back" })}
        </button>
        <span className="hidden text-[0.75rem] opacity-50 sm:block">{tx({ ar: "بياناتك محفوظة تلقائياً ولن تُفقد عند الإغلاق الخاطئ", en: "Your details are saved automatically — nothing is lost on accidental close" })}</span>
        <button type="button" onClick={next} disabled={sending || starting} className={stepBtn}>
          {starting || sending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-hajar/40 border-t-hajar" aria-hidden />
              {starting ? tx({ ar: "جارٍ حفظ بياناتك...", en: "Saving your details..." }) : tx({ ar: "جارٍ إرسال الطلب...", en: "Sending request..." })}
            </>
          ) : step === 4 ? (
            <>
              <Check className="h-4.5 w-4.5" />
              {tx({ ar: "إرسال طلب الحجز", en: "Send booking request" })}
            </>
          ) : (
            <>
              {tx({ ar: "التالي", en: "Next" })}
              <Arrow className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
      <p className="text-center text-[0.78rem] opacity-60">
        {tx({ ar: "الاستشارة الأولى مجانية · لا حاجة لدفع مقدّم", en: "First consultation is free · no deposit required" })}
      </p>
    </div>
  );
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const { tx } = useLang();
  const [isOpen, setOpen] = useState(false);
  const [pref, setPref] = useState<Pref | undefined>();
  const [k, setK] = useState(0);
  const [guard, setGuard] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  const open = useCallback((p?: Pref) => {
    setPref(p);
    setK((x) => x + 1);
    setOpen(true);
  }, []);
  const close = useCallback(() => { setOpen(false); setGuard(false); }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key !== "Tab" || !panel.current) return;
      const f = panel.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  return (
    <BookingCtx.Provider value={{ open, close }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={tx({ ar: "حجز موعد", en: "Book an appointment" })}>
          <button className="absolute inset-0 bg-palm-deep/75" onClick={() => setGuard(true)} aria-label="close" />
          <div ref={panel} className="sheet relative max-h-[94svh] w-full overflow-y-auto bg-hajar text-ink md:max-w-2xl" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            <div className="najdi-top" style={{ ["--c" as string]: "#1F3D2B" }} />
            <div className="p-6 sm:p-10">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <div className="track font-head text-[0.75rem] font-bold text-bronze">{tx({ ar: "حجز موعد", en: "Book a visit" })}</div>
                  <h2 className="t-h2 mt-2 !text-[clamp(1.6rem,5vw,2.4rem)]">{tx({ ar: "خطوة نحو ابتسامتك", en: "One step to your smile" })}</h2>
                </div>
                <button onClick={close} className="grid h-12 w-12 shrink-0 place-items-center border border-ink/25 hover:bg-ink hover:text-hajar" aria-label="close">
                  <Close className="h-5 w-5" />
                </button>
              </div>
              <BookingForm key={k} pref={pref} />
            </div>
          </div>

          {guard && (
            <div role="status" className="cham absolute inset-x-6 bottom-24 z-10 flex items-center gap-3 bg-palm px-5 py-4 text-hajar shadow-2xl md:inset-x-auto md:bottom-auto md:end-10 md:top-10 md:max-w-sm">
              <span className="text-[0.82rem] leading-relaxed">
                {tx({ ar: "لا تقلق، بياناتك محفوظة بالكامل. استخدم زر الإغلاق أعلى النافذة إن أردت الخروج.", en: "Don't worry — your details are fully saved. Use the close button above to leave." })}
              </span>
              <button type="button" onClick={() => setGuard(false)} aria-label="Dismiss" className="grid h-7 w-7 shrink-0 place-items-center border border-hajar/30">
                <Close className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </BookingCtx.Provider>
  );
}
