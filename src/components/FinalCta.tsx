import { useEffect, useState } from "react";
import { useLang } from "../lib/i18n";
import { BookingForm } from "./Booking";
import { Eyebrow, useInView, Words } from "../lib/ui";
import { PalmShadow } from "./Palm";
import { Phone, WhatsApp } from "./Icons";
import { MAIN_PHONE, WA_NUMBER } from "../lib/data";

/* ============================================================
   ١٦) الدعوة النهائية للحجز
   المتوقّع: شريط ملوّن بعنوان وزر «احجز الآن». المختار: «الباب
   النجدي يُفتح» — مصراعان مرصّعان بمسامير برونزية ينفتحان عند وصولك
   ليكشفا نموذج الحجز نفسه، فيصبح قرار الحجز فعلاً لا رابطاً.
   ============================================================ */
function Leaf({ side, open }: { side: "left" | "right"; open: boolean }) {
  return (
    <div
      className={`absolute inset-y-0 z-20 w-1/2 bg-palm transition-transform duration-[2200ms] ease-[cubic-bezier(.7,0,.2,1)] ${side === "left" ? "left-0" : "right-0"}`}
      style={{ transform: open ? `translateX(${side === "left" ? "-102%" : "102%"})` : "none", pointerEvents: open ? "none" : "auto" }}
      aria-hidden
    >
      <div className="grain-l absolute inset-0" />
      <div className="absolute inset-4 border border-bronze-soft/60 sm:inset-6" />
      <div className="door-studs absolute inset-8 opacity-70 sm:inset-10" />
      {/* زخرفة مثلثية مركزية */}
      <div className="absolute inset-x-0 top-1/2 mx-auto h-24 w-24 -translate-y-1/2 rotate-45 border border-bronze-soft/70 bg-palm sm:h-32 sm:w-32" style={{ [side === "left" ? "marginRight" : "marginLeft"]: "-3rem" }} />
      <span className={`absolute top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border-2 border-bronze-soft bg-palm ${side === "left" ? "right-4" : "left-4"}`} />
    </div>
  );
}

export function FinalCta() {
  const { tx } = useLang();
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setOpen(true), 500);
    return () => clearTimeout(t);
  }, [inView]);

  return (
    <section id="book" className="on-dark grain-l sec relative overflow-hidden bg-palm-deep text-hajar">
      <div className="pointer-events-none absolute inset-0 text-hajar" style={{ opacity: 0.07 }}>
        <PalmShadow variant="c" className="-top-[10%] start-[-10%] h-[110vmax] w-[110vmax] max-w-none lg:h-[70vmax] lg:w-[70vmax]" blur={2} />
      </div>

      <div className="wrap relative">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow n="14" light className="justify-center">
            {tx({ ar: "الخطوة الأولى", en: "The first step" })}
          </Eyebrow>
          <h2 className="t-display mt-7" style={{ fontSize: "clamp(2.4rem, 8.6vw, 5.4rem)" }}>
            <Words text={tx({ ar: "افتح الباب. ابتسامتك على بعد خطوة.", en: "Open the door. Your smile is one step away." })} hl={[2, 3]} hlClass="text-bronze-soft" />
          </h2>
          <p className="t-lead mx-auto mt-6 max-w-xl text-hajar/75">{tx({ ar: "استشارتك الأولى مجانية، ونردّ عليك خلال ١٥ دقيقة في ساعات العمل.", en: "Your first consultation is free, and we reply within 15 minutes during opening hours." })}</p>
        </div>

        {/* الباب */}
        <div ref={ref} className="relative mx-auto mt-14 max-w-4xl lg:mt-20">
          <div className="najdi-top" style={{ ["--c" as string]: "#EAE3D6" }} />
          <div className="relative overflow-hidden bg-hajar text-ink">
            <div className="p-6 sm:p-12">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-ink/15 pb-6">
                <div>
                  <div className="track font-head text-[0.74rem] font-bold text-bronze">{tx({ ar: "احجز موعدك", en: "Book your visit" })}</div>
                  <div className="mt-1 font-head text-[1.5rem] font-black text-palm sm:text-[2rem]">{tx({ ar: "٣٠ ثانية وننهي الباقي", en: "Thirty seconds — we handle the rest" })}</div>
                </div>
              </div>
              <BookingForm />
            </div>
            <Leaf side="left" open={open} />
            <Leaf side="right" open={open} />
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-4xl flex-col items-stretch justify-center gap-3 sm:flex-row">
          <a href={`tel:${MAIN_PHONE.replace(/\s/g, "")}`} className="cham flex min-h-[54px] flex-1 items-center justify-center gap-3 border border-hajar/35 font-head text-[0.9rem] font-bold hover:bg-hajar hover:text-palm">
            <Phone className="h-5 w-5" />
            <span>{tx({ ar: "أو اتصل بنا", en: "Or call us" })}</span>
            <span dir="ltr" className="opacity-80">{MAIN_PHONE}</span>
          </a>
          <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener" className="cham flex min-h-[54px] flex-1 items-center justify-center gap-3 border border-hajar/35 font-head text-[0.9rem] font-bold hover:bg-hajar hover:text-palm">
            <WhatsApp className="h-5 w-5" />
            {tx({ ar: "راسلنا على واتساب", en: "Message us on WhatsApp" })}
          </a>
        </div>
      </div>
    </section>
  );
}
