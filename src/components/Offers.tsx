import { useEffect, useState } from "react";
import { useLang, toArDigits, type Bi } from "../lib/i18n";
import { Eyebrow, Reveal, Words } from "../lib/ui";
import { Arrow, Check, Copy } from "./Icons";
import { useBooking } from "./Booking";
import { cn } from "../utils/cn";

/* ============================================================
   ١٣) العروض الحصرية
   المتوقّع: ٣ بطاقات «خصم ٢٠٪» ببادج. المختار: «لوحة القائمة» —
   عرض الأسبوع الرئيسي بعدّاد تنازلي وعدد مقاعد، وبجانبه قائمة
   أسعار كقائمة مطعم فاخر: الاسم ثم خط نقطي ثم السعر القديم والجديد.
   ============================================================ */
const MENU: { n: Bi; note: Bi; old: number; now: number | 0; service: string; free?: boolean }[] = [
  { n: { ar: "تبييض بالضوء البارد", en: "Cold-light whitening" }, note: { ar: "جلسة واحدة · بلا حساسية", en: "One session · no sensitivity" }, old: 1800, now: 1200, service: "cosmetic" },
  { n: { ar: "تنظيف وتلميع + فحص شامل", en: "Scale, polish & full exam" }, note: { ar: "جميع الفروع", en: "All branches" }, old: 350, now: 249, service: "gums" },
  { n: { ar: "التقويم الشفاف: فحص ومحاكاة رقمية", en: "Clear aligners: scan & simulation" }, note: { ar: "ترى ابتسامتك قبل البدء", en: "See your smile before you start" }, old: 400, now: 0, service: "ortho", free: true },
  { n: { ar: "زرعة + تاج زركونيا", en: "Implant + zirconia crown" }, note: { ar: "ضمان مكتوب", en: "Written guarantee" }, old: 3900, now: 3500, service: "implant" },
];

function useCountdown() {
  const [target] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(23, 59, 59, 0);
    return d.getTime();
  });
  const [left, setLeft] = useState(target - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(t);
  }, [target]);
  const s = Math.floor(left / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

export function Offers() {
  const { tx, isAr, num } = useLang();
  const { open } = useBooking();
  const cd = useCountdown();
  const [copied, setCopied] = useState(false);
  const cur = isAr ? "ر.س" : "SAR";

  const copy = () => {
    navigator.clipboard?.writeText("NAKHLA-FIRST").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const unit = (v: number, l: Bi) => (
    <div className="min-w-[64px] text-center">
      <div className="font-head text-[clamp(1.9rem,6vw,3rem)] font-black leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>
        {isAr ? toArDigits(v < 10 ? `0${v}` : `${v}`) : v < 10 ? `0${v}` : `${v}`}
      </div>
      <div className="mt-1 text-[0.72rem] text-hajar/85">{tx(l)}</div>
    </div>
  );

  return (
    <section id="offers" className="on-dark grain-l sec overflow-hidden bg-bronze text-hajar">
      <div className="wrap">
        <Reveal>
          <Eyebrow n="11" light className="!text-hajar">
            {tx({ ar: "العروض الحصرية", en: "Exclusive offers" })}
          </Eyebrow>
        </Reveal>

        <div className="mt-8 grid gap-14 lg:grid-cols-12 lg:gap-16">
          {/* عرض الأسبوع */}
          <div className="lg:col-span-5">
            <h2 className="t-h2">
              <Words text={tx({ ar: "الزيارة الأولى، على حسابنا.", en: "Your first visit is on us." })} />
            </h2>
            <Reveal delay={100}>
              <p className="t-lead mt-5 text-hajar/90">
                {tx({ ar: "فحص شامل + أشعة بانورامية + خطة علاج مكتوبة. لا تدفع شيئاً، ولا نطلب منك قراراً.", en: "A full exam, a panoramic X-ray and a written treatment plan. You pay nothing, and we ask for no decision." })}
              </p>
            </Reveal>

            <Reveal delay={200}>
              <div className="mt-8">
                <div className="mb-3 text-[0.8rem] font-bold text-hajar/90">{tx({ ar: "ينتهي العرض بعد", en: "Offer ends in" })}</div>
                <div className="flex items-start gap-1 sm:gap-3">
                  {unit(cd.d, { ar: "يوم", en: "days" })}
                  <span className="pt-1 font-head text-3xl font-black opacity-50">:</span>
                  {unit(cd.h, { ar: "ساعة", en: "hours" })}
                  <span className="pt-1 font-head text-3xl font-black opacity-50">:</span>
                  {unit(cd.m, { ar: "دقيقة", en: "min" })}
                  <span className="pt-1 font-head text-3xl font-black opacity-50">:</span>
                  {unit(cd.s, { ar: "ثانية", en: "sec" })}
                </div>

                {/* المقاعد */}
                <div className="mt-8">
                  <div className="mb-2 flex justify-between text-[0.82rem] font-bold">
                    <span>{tx({ ar: "المقاعد المتبقية هذا الأسبوع", en: "Seats left this week" })}</span>
                    <span>{tx({ ar: "٧ من ٢٠", en: "7 of 20" })}</span>
                  </div>
                  <div className="h-2 bg-palm-deep/40">
                    <div className="h-full bg-hajar" style={{ width: "65%" }} />
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button onClick={() => open()} className="cham group flex min-h-[54px] items-center justify-center gap-3 bg-palm px-7 font-head text-[0.92rem] font-bold text-hajar transition-colors hover:bg-palm-deep">
                    {tx({ ar: "احجز زيارتي المجانية", en: "Book my free visit" })}
                    <Arrow className="h-4 w-4" />
                  </button>
                  <button onClick={copy} className="cham flex min-h-[54px] items-center justify-center gap-3 border border-hajar/60 px-6 font-head text-[0.85rem] font-bold transition-colors hover:bg-hajar hover:text-bronze" aria-live="polite">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? tx({ ar: "تم النسخ", en: "Copied" }) : <span dir="ltr">NAKHLA-FIRST</span>}
                  </button>
                </div>
              </div>
            </Reveal>
          </div>

          {/* لوحة القائمة */}
          <div className="lg:col-span-7">
            <div className="cham-lg relative bg-palm p-6 sm:p-10">
              <div className="mb-2 flex items-baseline justify-between border-b border-hajar/25 pb-5">
                <h3 className="font-head text-[1.3rem] font-extrabold sm:text-[1.6rem]">{tx({ ar: "قائمة العروض", en: "The Offers Menu" })}</h3>
                <span className="track font-head text-[0.7rem] font-bold text-sand">{tx({ ar: "حتى نهاية الشهر", en: "Until month-end" })}</span>
              </div>
              <ul>
                {MENU.map((m, i) => (
                  <li key={i}>
                    <button
                      onClick={() => open({ service: m.service })}
                      className="group grid w-full grid-cols-[1fr_auto] items-center gap-4 border-b border-hajar/15 py-5 text-start last:border-0"
                    >
                      <span>
                        <span className="flex items-baseline gap-3">
                          <span className="font-head text-[1rem] font-extrabold sm:text-[1.15rem]">{tx(m.n)}</span>
                          <span className="hidden min-w-[30px] flex-1 translate-y-[-4px] border-b-2 border-dotted border-hajar/30 sm:block" />
                        </span>
                        <span className="mt-0.5 block text-[0.85rem] text-hajar/70">{tx(m.note)}</span>
                      </span>
                      <span className="flex items-center gap-4">
                        <span className="text-end">
                          <span className="block text-[0.8rem] text-hajar/55 line-through">
                            {num(m.old)} {cur}
                          </span>
                          <span className={cn("block font-head text-[1.2rem] font-black", m.free ? "text-bronze-soft" : "text-hajar")}>{m.free ? tx({ ar: "مجاناً", en: "Free" }) : `${num(m.now)} ${cur}`}</span>
                        </span>
                        <span className="grid h-11 w-11 place-items-center border border-hajar/30 transition-colors group-hover:bg-bronze">
                          <Arrow className="h-4 w-4" />
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.78rem] text-hajar/55">{tx({ ar: "العروض لا تُجمع مع بعضها ولا مع التأمين. الأسعار شاملة الضريبة.", en: "Offers cannot be combined with each other or with insurance. Prices include VAT." })}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
