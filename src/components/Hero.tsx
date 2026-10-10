import { useEffect, useState } from "react";
import { useLang } from "../lib/i18n";
import { Btn, Words, useInView } from "../lib/ui";
import { useBooking } from "./Booking";
import { LogoMark, Star } from "./Icons";
import { PalmShadow } from "./Palm";
import { BRANCHES, isOpen } from "../lib/data";
import { cn } from "../utils/cn";
import heroImg from "../assets/img/hero.jpg";

/* ============================================================
   ٢) الواجهة الرئيسية (Hero)
   بدائل العنوان المقترحة:
   ١. «ابتسامةٌ تستظلّ بها ثقتك»  ← المعتمد (يحمل رمز النخلة والظل)
   ٢. «أتقنّا الابتسامة كما أتقن النجديون العمارة»
   ٣. «حيث تستعيد ابتسامتك طمأنينتها»
   EN: "A smile your confidence can shelter in."
   ============================================================ */
const H1 = {
  ar: { t: "ابتسامةٌ تستظلّ بها ثقتك", hl: [3] },
  en: { t: "A smile your confidence can shelter in.", hl: [3] },
};

export function Hero() {
  const { tx, lang, isAr } = useLang();
  const { open } = useBooking();
  const [imgRef, imgIn] = useInView<HTMLDivElement>(0.1);
  const [openNow, setOpenNow] = useState(true);
  useEffect(() => setOpenNow(isOpen(BRANCHES[0])), []);
  const h = H1[lang];

  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-[104px] lg:min-h-[100svh] lg:pb-20 lg:pt-[120px] desk-hero">
      {/* سعف أخضر خفيف يلوّن ضوء القسم */}
      <div className="pointer-events-none absolute inset-0 text-palm mix-blend-multiply" style={{ opacity: 0.1 }}>
        <PalmShadow variant="c" className="start-[10%] -top-[22%] h-[90vmax] w-[90vmax] max-w-none lg:h-[56vmax] lg:w-[56vmax]" blur={2} />
      </div>

      <div className="wrap relative grid items-center gap-12 lg:min-h-[calc(100svh-160px)] lg:grid-cols-12 lg:gap-6">
        {/* النص */}
        <div className="lg:col-span-7 lg:pe-10">
          <div className="rv in track mb-7 flex items-center gap-3 font-head text-[0.74rem] font-bold text-bronze" style={{ ["--d" as string]: "100ms" }}>
            <span className="h-px w-10 bg-bronze" />
            {tx({ ar: "عيادات نخلة · المدينة المنورة · حائل", en: "Nakhla Clinics · Madinah · Ha'il" })}
          </div>

          {/* العنوان الرئيسي: تظهر الكلمات من خلف قناع */}
          <h1 className="t-display text-palm" style={{ fontSize: "clamp(2.7rem, 9.6vw, 6.4rem)" }}>
            <Words key={lang} text={h.t} hl={h.hl} delay={250} step={110} />
          </h1>

          <p className="rv in t-lead mt-7 max-w-xl text-ink/80" style={{ ["--d" as string]: "900ms" }}>
            {tx({
              ar: "نصمّم ابتسامتك بصبرٍ وإتقان، ونُريك النتيجة قبل أن نبدأ. خطة مكتوبة، سعر ثابت، وطبيب واحد يرافقك من الفحص إلى آخر زيارة.",
              en: "We design your smile with patience and precision — and show you the result before we begin. A written plan, a fixed price, one doctor beside you from first visit to last.",
            })}
          </p>

          <div className="rv in mt-9 flex flex-col gap-3 sm:flex-row" style={{ ["--d" as string]: "1100ms" }}>
            <Btn onClick={() => open()} className="sm:min-w-[260px]">
              {tx({ ar: "احجز استشارتي المجانية", en: "Book my free consultation" })}
            </Btn>
            <Btn variant="ghost" href="#results" arrow={false}>
              {tx({ ar: "شاهد النتائج الحقيقية", en: "See real results" })}
            </Btn>
          </div>

          <div className="rv in mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[0.9rem]" style={{ ["--d" as string]: "1300ms" }}>
            <span className="inline-flex items-center gap-2.5 font-bold">
              <span className="relative h-2.5 w-2.5 rounded-full text-palm ring">
                <span className={cn("absolute inset-0 rounded-full", openNow ? "bg-palm" : "bg-bronze")} />
              </span>
              {openNow ? tx({ ar: "مفتوح الآن", en: "Open now" }) : tx({ ar: "مغلق حالياً", en: "Closed now" })}
              <span className="font-normal text-ink/60">· {tx(BRANCHES[0].name)}</span>
            </span>
            <span className="text-ink/70">{tx(BRANCHES[0].slot)}</span>
          </div>
        </div>

        {/* الصورة: نافذة نجدية بقمة مثلثية */}
        <div className="relative lg:col-span-5">
          <div
            ref={imgRef}
            className={cn("relative mx-auto w-full max-w-[440px] transition-all duration-[1600ms] ease-[cubic-bezier(.2,.8,.15,1)] lg:max-w-none", imgIn ? "opacity-100" : "opacity-0")}
            style={{ transform: imgIn ? "none" : "translateY(60px)" }}
          >
            {/* PROMPT: Editorial fashion-grade portrait of a Saudi woman in her early thirties, calm confident natural soft smile, cream silk abaya with fine bronze embroidery and sage-green headscarf, warm Najdi sand-colored mud-brick wall, dappled date-palm frond shadows across face and wall, golden morning light, palette #EAE3D6 #1F3D2B #8C5A2B, 85mm, shallow DOF, vertical 4:5 */}
            <div className="najdi-window relative aspect-[4/5] overflow-hidden bg-sand">
              <img
                src={heroImg}
                alt={tx({ ar: "مريضة تبتسم بثقة في عيادات نخلة", en: "A patient smiling with quiet confidence at Nakhla" })}
                className="h-full w-full object-cover transition-transform duration-[2800ms] ease-out"
                style={{ transform: imgIn ? "scale(1)" : "scale(1.14)" }}
                fetchPriority="high"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-palm/45 to-transparent" />
            </div>

            {/* ختم دوّار */}
            <div className="absolute -bottom-9 start-[-14px] grid h-[132px] w-[132px] place-items-center rounded-full bg-palm text-hajar sm:-start-8 sm:h-[150px] sm:w-[150px]">
              <svg viewBox="0 0 150 150" className="spin-slow absolute inset-0 h-full w-full" aria-hidden>
                <defs>
                  <path id="seal" d="M75 75 m-56 0 a56 56 0 1 1 112 0 a56 56 0 1 1 -112 0" />
                </defs>
                {/* نص دائري عربي: بلا letter-spacing (يفصل الحروف المتصلة)، اتجاه rtl،
                    والحروف تُرسم بترتيبها البصري الصحيح على المسار نفسه */}
                {isAr ? (
                  <text fill="#C8B79A" fontSize="12" fontFamily="'Noto Kufi Arabic', sans-serif" fontWeight="600" direction="rtl" unicodeBidi="plaintext" style={{ letterSpacing: 0 }}>
                    <textPath href="#seal">نخلة لطب الأسنان · المدينة المنورة · ابتسامة تستظل بها ثقتك</textPath>
                  </text>
                ) : (
                  <text fill="#C8B79A" fontSize="11.5" fontFamily="Sora, sans-serif" fontWeight="600" letterSpacing="3.2">
                    <textPath href="#seal">NAKHLA · DENTAL ATELIER · MADINAH · HA'IL ·</textPath>
                  </text>
                )}
              </svg>
              <LogoMark className="h-10 w-10 text-hajar" style={{ ["--logo-in" as string]: "#1F3D2B" }} />
            </div>

            {/* بطاقة التقييم */}
            <div className="cham absolute -end-1 bottom-8 hidden bg-hajar px-5 py-4 shadow-[0_20px_40px_-20px_rgba(22,32,26,.5)] sm:block lg:-end-6">
              <div className="flex items-center gap-1 text-bronze">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-4 w-4" />
                ))}
              </div>
              <div className="mt-1 font-head text-lg font-extrabold text-palm">{tx({ ar: "٤٫٩ من ٥", en: "4.9 / 5" })}</div>
              <div className="text-[0.78rem] text-ink/65">{tx({ ar: "١٬٢٨٠ تقييماً موثّقاً", en: "1,280 verified reviews" })}</div>
            </div>
          </div>
        </div>
      </div>

      {/* مؤشّر التمرير */}
      <a href="#trust" className="absolute bottom-6 start-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.7rem] font-bold text-ink/60 lg:flex" aria-label="scroll">
        <span className="track font-head">{tx({ ar: "اكتشف", en: "Scroll" })}</span>
        <span className="relative h-10 w-px overflow-hidden bg-ink/20">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[sway_2s_ease-in-out_infinite] bg-bronze" />
        </span>
      </a>
      <span className="hidden">{String(isAr)}</span>
    </section>
  );
}
