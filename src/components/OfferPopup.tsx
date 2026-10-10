import { useEffect, useRef, useState } from "react";
import { useLang, type Bi } from "../lib/i18n";
import { useBooking } from "./Booking";
import { Check, Close, LogoMark, Arrow } from "./Icons";
import { cn } from "../utils/cn";

/* ============================================================
   نظام العرض الذكي (عقد مستقل، بهوية نخلة)
   — سطح المكتب: نافذة عرض تظهر عند بلوغ التمرير ٣٠٪ من الصفحة
     أو عندما يتجه المؤشر نحو مغادرة الصفحة (Exit Intent) —
     مرة واحدة لكل جلسة (sessionStorage).
   — الجوال: شريط صغير فوق شريط الجوال السفلي (Dock) يظهر عند
     بلوغ التمرير ٣٠٪، بجسمٍ واحد وزرَّي «حجز العرض» و«إغلاق»،
     ولا يعيق التصفح أبداً — لا نوافذ مقاطعة على الجوال.
   العرض المعروض هو عرض الموقع نفسه: الزيارة الأولى مجاناً
   (فحص شامل + أشعة بانورامية + خطة مكتوبة) بكود NAKHLA-FIRST.
   ============================================================ */

const FLAG = "nakhla-offer-shown";
/** حدّ التفعيل: ٣٠٪ من تمرير الصفحة */
const TRIGGER = 0.3;
/** حدّ سطح المكتب — نفس حدّ شريط الجوال في Dock (md) */
const DESKTOP = "(min-width: 768px)";

const T = {
  badge: { ar: "عرض خاص لزوار الموقع", en: "Exclusive for website visitors" } as Bi,
  title: { ar: "قبل أن تغادر… زيارتك الأولى في نخلة مجانية", en: "Before you leave — your first visit at Nakhla is free" } as Bi,
  sub: {
    ar: "فحص شامل + أشعة بانورامية + خطة علاج مكتوبة، بدون أي رسم وبدون أي التزام. سجّل موعدك الآن وثبّت العرض باسمك.",
    en: "A full exam, panoramic X-ray and a written treatment plan — no fees, no commitment. Book now and the offer stays yours.",
  } as Bi,
  perks: [
    { ar: "فحص شامل مع استشاري", en: "Full consultant exam" },
    { ar: "أشعة بانورامية رقمية", en: "Digital panoramic X-ray" },
    { ar: "خطة علاج مكتوبة", en: "Written treatment plan" },
    { ar: "كود خصم NAKHLA-FIRST", en: "Code NAKHLA-FIRST" },
  ] as Bi[],
  cta: { ar: "احجز زيارتي المجانية", en: "Book my free visit" } as Bi,
  dismiss: { ar: "لا شكراً، أرغب بتصفح الموقع فقط", en: "No thanks, I'd rather keep browsing" } as Bi,
  code: { ar: "كود العرض:", en: "Offer code:" } as Bi,
  ribbon: { ar: "عرض الموقع: زيارتك الأولى مجاناً", en: "Website offer: first visit free" } as Bi,
  ribbonCta: { ar: "احجز العرض", en: "Claim offer" } as Bi,
  close: { ar: "إغلاق", en: "Close" } as Bi,
};

const seen = () => {
  try { return sessionStorage.getItem(FLAG) === "1"; } catch { return false; }
};
const mark = () => {
  try { sessionStorage.setItem(FLAG, "1"); } catch { /* ignore */ }
};

export function OfferPopup() {
  const { tx } = useLang();
  const { open } = useBooking();
  const [isDesktop, setDesktop] = useState(() =>
    typeof window !== "undefined" && window.matchMedia(DESKTOP).matches,
  );
  const [progress, setProgress] = useState(0);
  const [shown, setShown] = useState(false); // نافذة سطح المكتب
  const [ribbon, setRibbon] = useState(false); // شريط الجوال
  const [dismissed, setDismissed] = useState(false);

  /* سطح مكتب أم جوال — يتبع حدّ md نفسه المستخدم في Dock */
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const on = () => setDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  /* تقدّم تمرير الصفحة كاملة ٠..١ */
  useEffect(() => {
    let raf = 0;
    const calc = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress((old) => {
        const c = h > 0 ? Math.min(window.scrollY / h, 1) : 0;
        return Math.abs(old - c) > 0.003 ? c : old;
      });
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(calc);
    };
    calc();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* — سطح المكتب: تمرير ٣٠٪ — مرة واحدة لكل جلسة — */
  useEffect(() => {
    if (!isDesktop || shown || seen()) return;
    if (progress >= TRIGGER) {
      mark();
      setShown(true);
    }
  }, [isDesktop, progress, shown]);

  /* — سطح المكتب: نية المغادرة (المؤشر يخرج من الحافة العليا) — */
  useEffect(() => {
    if (!isDesktop) return;
    const onLeave = (e: MouseEvent) => {
      if (e.clientY > 0 || seen()) return;
      mark();
      setShown(true);
    };
    document.addEventListener("mouseleave", onLeave);
    return () => document.removeEventListener("mouseleave", onLeave);
  }, [isDesktop]);

  /* — الجوال: الشريط يتبع عتبة ٣٠٪ ويختفي عند العودة أعلى الصفحة — */
  useEffect(() => {
    if (isDesktop || dismissed) {
      setRibbon(false);
      return;
    }
    setRibbon(progress >= TRIGGER);
  }, [isDesktop, dismissed, progress]);

  /* — الجوال: شريط العرض يرفع زر المساعد فوقه (ارتفاع الشريط + 12px عبر
     --offer-h على :root) ويُعيده بمكانته عند الاختفاء. ResizeObserver يبقي
     القيمة دقيقة إن تغيّر ارتفاع الشريط (التفاف النص، تغيّر اللغة…) — */
  const ribbonRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ribbonRef.current;
    if (!ribbon || isDesktop || !el) return;
    const apply = () =>
      document.documentElement.style.setProperty("--offer-h", `${el.offsetHeight + 12}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty("--offer-h");
    };
  }, [ribbon, isDesktop]);

  /* Escape يغلق نافذة سطح المكتب */
  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShown(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown]);

  const bookNow = () => {
    setShown(false);
    setDismissed(true);
    open();
  };

  /* ——— نافذة سطح المكتب ——— */
  if (isDesktop && shown) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
        <button
          className="absolute inset-0 bg-palm-deep/75"
          onClick={() => setShown(false)}
          aria-label={tx(T.close)}
        />
        <div
          role="dialog"
          aria-modal="true"
          className="sheet cham-lg relative w-[560px] max-w-full bg-hajar text-ink shadow-[0_40px_90px_-20px_rgba(20,42,29,0.55)]"
        >
          {/* شرفات نجدية أعلى النافذة */}
          <div className="najdi-top" />
          {/* z-10 ضروري: حاوية المحتوى «relative» تأتي بعده في DOM
              فترسم فوقه وتبتلع نقراته بدون رفع طبقة الزر */}
          <button
            onClick={() => setShown(false)}
            className="absolute end-4 top-4 z-10 grid h-11 w-11 place-items-center border border-ink/25 transition-colors hover:bg-ink hover:text-hajar"
            aria-label={tx(T.close)}
          >
            <Close className="h-4.5 w-4.5" />
          </button>

          <div className="relative p-8 sm:p-10">
            {/* الشعار + الشارة */}
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center bg-palm text-bronze-soft">
                <LogoMark className="h-8 w-8" />
              </span>
              <div>
                <div className="track font-head text-[0.72rem] font-bold text-bronze">{tx(T.badge)}</div>
                <h2 className="t-h3 mt-1 !text-[clamp(1.3rem,2.4vw,1.7rem)]">{tx(T.title)}</h2>
              </div>
            </div>

            <p className="mt-4 text-[0.92rem] leading-[1.9] opacity-80">{tx(T.sub)}</p>

            {/* المزايا */}
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {T.perks.map((p, i) => (
                <span key={i} className="flex items-center gap-2.5 border border-ink/15 px-3.5 py-2.5 text-[0.82rem]">
                  <Check className="h-4 w-4 shrink-0 text-bronze" />
                  {tx(p)}
                </span>
              ))}
            </div>

            {/* الكود */}
            <p className="mt-5 text-[0.8rem] opacity-70">
              {tx(T.code)} <b className="font-head" dir="ltr">NAKHLA-FIRST</b>
            </p>

            {/* الإجراءات */}
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={bookNow}
                className="cham group flex min-h-[52px] items-center justify-center gap-3 bg-bronze px-8 font-head text-[0.92rem] font-bold text-hajar transition-colors hover:bg-palm"
              >
                {tx(T.cta)}
                <Arrow className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => setShown(false)}
                className="min-h-[40px] font-head text-[0.8rem] font-bold underline underline-offset-8 opacity-60 transition-opacity hover:opacity-100"
              >
                {tx(T.dismiss)}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ——— شريط الجوال ——— */
  if (!isDesktop && ribbon) {
    return (
      <div
        ref={ribbonRef}
        role="status"
        className={cn(
          "pop fixed inset-x-3 z-[56] flex items-center justify-between gap-2 bg-palm px-3 py-2 text-hajar",
          "shadow-[0_18px_40px_-12px_rgba(20,42,29,0.55)]",
        )}
        style={{ bottom: "calc(var(--dock-h) + 12px)" }}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <LogoMark className="h-7 w-7 shrink-0 text-bronze-soft" />
          <span className="truncate font-head text-[0.78rem] font-bold leading-snug">{tx(T.ribbon)}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => { setDismissed(true); open(); }}
            className="cham flex min-h-[38px] items-center gap-1.5 bg-bronze px-4 font-head text-[0.75rem] font-bold text-hajar transition-colors hover:bg-bronze-soft"
          >
            {tx(T.ribbonCta)}
            <Arrow className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="grid h-9 w-9 shrink-0 place-items-center text-hajar/70 transition-colors hover:text-hajar"
            aria-label={tx(T.close)}
          >
            <Close className="h-4 w-4" />
          </button>
        </span>
      </div>
    );
  }

  return null;
}
