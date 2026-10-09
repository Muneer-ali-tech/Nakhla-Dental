import { useState } from "react";
import { useLang } from "../lib/i18n";
import { Btn, Eyebrow, Reveal, Words } from "../lib/ui";
import { DOCTORS } from "../lib/data";
import { useBooking } from "./Booking";
import { cn } from "../utils/cn";

/* ============================================================
   ٨) فريق الأطباء والاستشاريين (٧)
   المتوقّع: بطاقات (صورة + اسم + تخصص). المختار: «المصاريع» —
   سبعة مصاريع نجدية عمودية بقمم مثلثية، يتمدّد المختار منها ليكشف
   الطبيب كاملاً بسيرته وحجزه، وتبقى البقية شرائح ضيّقة بأسمائها.
   الجوال: تتحول المصاريع إلى صفوف أفقية تتمدّد رأسياً بلمسة.

   توجيه الصور الموحّد: نصف جسم، زاوية ثلاثة أرباع يساراً عند مستوى
   العين، معطف طبي أخضر نخيلي #1F3D2B بياقة عالية وخياطة برونزية،
   خلفية حجر نجدي دافئ بظل سعف خافت، إضاءة نافذة ناعمة، عدسة 85mm.
   ============================================================ */

export function Doctors() {
  const { tx, isAr } = useLang();
  const { open } = useBooking();
  const [a, setA] = useState(0);
  const nums = ["١", "٢", "٣", "٤", "٥", "٦", "٧"];

  return (
    <section id="doctors" className="on-dark grain-l sec overflow-hidden bg-palm text-hajar">
      <div className="wrap">
        <div className="grid items-end gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Reveal>
              <Eyebrow n="06" light>{tx({ ar: "فريق الأطباء والاستشاريين", en: "Doctors & consultants" })}</Eyebrow>
            </Reveal>
            <h2 className="t-h2 mt-6">
              <Words text={tx({ ar: "سبعة أطباء. وقلبٌ واحد يهتم بك.", en: "Seven doctors. One heart that cares for you." })} hl={isAr ? [3, 4] : [4, 5, 6, 7]} hlClass="text-bronze-soft" />
            </h2>
          </div>
          <Reveal className="lg:col-span-4" delay={120}>
            <p className="text-hajar/70">{tx({ ar: "اختر مِصراعاً لتتعرّف على الطبيب. كلٌّ منهم اختصاصي في مجاله، ويعمل بروح فريق واحد.", en: "Open a shutter to meet the doctor. Each is a specialist in their field, working in the spirit of a single team." })}</p>
          </Reveal>
        </div>

        <div className="mt-12 flex flex-col gap-2 lg:mt-16 lg:h-[680px] lg:flex-row" role="list">
          {DOCTORS.map((d, i) => {
            const on = i === a;
            return (
              <div
                key={d.id}
                role="listitem"
                className={cn(
                  "slat-top relative overflow-hidden bg-palm-deep transition-[height,flex-grow] duration-[900ms] ease-[cubic-bezier(.7,0,.2,1)]",
                  on ? "h-[560px] lg:h-auto lg:flex-[8_1_0%]" : "h-[84px] lg:h-auto lg:flex-[1_1_0%]"
                )}
              >
                <img
                  src={d.img}
                  alt={tx(d.name)}
                  loading="lazy"
                  className={cn("absolute inset-0 h-full w-full object-cover transition-all duration-[900ms]", on ? "scale-100 grayscale-0" : "scale-[1.15] grayscale-[.65] brightness-[.55]")}
                  style={{ objectPosition: on ? "50% 8%" : "50% 24%" }}
                />
                <div className={cn("absolute inset-0 transition-opacity duration-700", on ? "opacity-100" : "opacity-60")} style={{ background: on ? "linear-gradient(to top, rgba(20,42,29,.96) 0%, rgba(20,42,29,.78) 32%, rgba(20,42,29,0) 62%)" : "linear-gradient(to top, rgba(20,42,29,.9), rgba(20,42,29,.2))" }} />

                {/* الرقم */}
                <span className="absolute start-4 top-4 z-10 font-head text-[0.72rem] font-bold text-hajar/80 lg:top-8">{isAr ? `٠${nums[i]}` : `0${i + 1}`}</span>

                {/* منطقة الضغط (غير نشط) */}
                <button
                  onClick={() => setA(i)}
                  aria-label={tx(d.name)}
                  aria-pressed={on}
                  className="absolute inset-0 z-10"
                  style={{ pointerEvents: on ? "none" : "auto" }}
                />

                {/* تسمية الشريحة المغلقة */}
                <div className={cn("pointer-events-none absolute z-20 transition-opacity duration-500", on ? "opacity-0" : "opacity-100 delay-300",
                  "inset-y-0 start-14 flex flex-col justify-center lg:inset-x-0 lg:bottom-0 lg:top-auto lg:start-0 lg:block lg:py-0 lg:pb-8 lg:text-center")}>
                  <span className="block font-head text-[0.98rem] font-extrabold lg:hidden">{tx(d.name)}</span>
                  <span className="block text-[0.8rem] text-hajar/70 lg:hidden">{tx(d.spec)}</span>
                  <span className="hidden font-head text-[1rem] font-extrabold lg:inline-block" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                    {tx(d.name)}
                  </span>
                </div>

                {/* تفاصيل الطبيب */}
                <div className={cn("absolute inset-x-0 bottom-0 z-20 p-6 transition-all duration-700 lg:p-10", on ? "translate-y-0 opacity-100 delay-500" : "pointer-events-none translate-y-6 opacity-0")}>
                  <div className="track font-head text-[0.74rem] font-bold text-bronze-soft">{tx(d.spec)}</div>
                  <h3 className="mt-1 font-head text-[1.55rem] font-extrabold leading-snug lg:text-[2.2rem]">{tx(d.name)}</h3>
                  <p className="text-hajar/80">{tx(d.role)}</p>
                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[0.85rem] text-hajar/70">
                    <span>
                      <b className="font-head text-hajar">{isAr ? d.years.toString().replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]) : d.years}</b> {tx({ ar: "عاماً من الخبرة", en: "years' experience" })}
                    </span>
                    <span>{tx({ ar: "الفرع:", en: "Branch:" })} <b className="text-hajar">{tx(d.branch)}</b></span>
                  </div>
                  <p className="mt-4 hidden max-w-xl text-hajar/80 sm:block">{tx(d.bio)}</p>
                  <Btn className="mt-5 !min-h-[48px] w-full sm:w-auto" onClick={() => open({ doctor: tx(d.name) })}>
                    {tx({ ar: "احجز موعدي مع الدكتور", en: "Book my visit with the doctor" })}
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
