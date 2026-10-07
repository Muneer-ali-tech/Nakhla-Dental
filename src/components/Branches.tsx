import { useState } from "react";
import { useLang } from "../lib/i18n";
import { BRANCHES, isOpen, WA_NUMBER } from "../lib/data";
import { Btn, Eyebrow, Reveal, Words } from "../lib/ui";
import { Clock, Phone, Pin, WhatsApp, Arrow } from "./Icons";
import { useBooking } from "./Booking";
import { cn } from "../utils/cn";

/* ============================================================
   ١٤) الفروع والتواصل
   المتوقّع: ٣ بطاقات عناوين + خريطة جوجل مضمّنة. المختار: «خريطة
   الطريق» — لوحة تخطيطية بدبابيس بحجم لمس كامل، تربط المدينة (فرعان
   متجاوران) بحائل بخطّ منقّط، ولوح تفاصيل حيّ بحالة «مفتوح الآن».
   ============================================================ */
const PINS = [
  { id: "qiblatain", x: 24, y: 66 },
  { id: "aziziyah", x: 36, y: 80 },
  { id: "hail", x: 70, y: 24 },
];

export function Branches() {
  const { tx, isAr } = useLang();
  const { open } = useBooking();
  const [sel, setSel] = useState("qiblatain");
  const b = BRANCHES.find((x) => x.id === sel)!;
  const openNow = isOpen(b);
  const nums = ["١", "٢", "٣"];

  return (
    <section id="branches" className="sec">
      <div className="wrap">
        <Reveal>
          <Eyebrow n="12">{tx({ ar: "الفروع والتواصل", en: "Branches & contact" })}</Eyebrow>
        </Reveal>
        <h2 className="t-h2 mt-6 max-w-3xl">
          <Words text={tx({ ar: "ثلاثة أبواب مفتوحة، وأقربها إليك.", en: "Three open doors, and one near you." })} />
        </h2>

        <div className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-12 lg:gap-12">
          {/* الخريطة التخطيطية */}
          <div className="on-dark lg:col-span-7">
            <div className="cham-lg grain-l relative aspect-[5/4.6] overflow-hidden bg-palm sm:aspect-[6/5] lg:aspect-auto lg:h-full lg:min-h-[560px]">
              <svg viewBox="0 0 600 520" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
                <defs>
                  <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1.2" fill="#C8B79A" opacity=".28" />
                  </pattern>
                </defs>
                <rect width="600" height="520" fill="url(#dots)" />
                {/* خطوط كنتورية */}
                <g fill="none" stroke="#C8B79A" strokeOpacity=".13" strokeWidth="1">
                  {[60, 100, 140, 180, 220, 260].map((r, i) => (
                    <ellipse key={i} cx="410" cy="150" rx={r * 1.5} ry={r} transform={`rotate(${-18 + i * 3} 410 150)`} />
                  ))}
                  {[50, 90, 130, 170].map((r, i) => (
                    <ellipse key={i} cx="150" cy="400" rx={r * 1.4} ry={r} transform={`rotate(${22 - i * 4} 150 400)`} />
                  ))}
                </g>
                {/* طريق المدينة ← حائل */}
                <path d="M150 380 C 200 300, 260 330, 300 260 S 380 190, 420 125" fill="none" stroke="#B27C46" strokeWidth="2.5" strokeDasharray="3 9" strokeLinecap="round" />
                <text x="300" y="305" fill="#C8B79A" fontSize="13" fontFamily="Hanken Grotesk, sans-serif" textAnchor="middle" letterSpacing="2">
                  ≈ 500 KM
                </text>
                {/* بوصلة */}
                <g transform="translate(540 60)" stroke="#C8B79A" strokeOpacity=".6" fill="none">
                  <circle r="20" />
                  <path d="M0 -14 L5 4 L0 0 L-5 4Z" fill="#C8B79A" />
                  <text y="-26" textAnchor="middle" fill="#C8B79A" stroke="none" fontSize="11" fontFamily="Sora, sans-serif">N</text>
                </g>
              </svg>

              {/* أسماء المدن */}
              <div className="pointer-events-none absolute font-head text-[0.7rem] font-bold text-sand" style={{ left: "10%", top: "88%" }}>
                <span className="track">{tx({ ar: "المدينة المنورة", en: "Madinah" })}</span>
              </div>
              <div className="pointer-events-none absolute font-head text-[0.7rem] font-bold text-sand" style={{ left: "62%", top: "12%" }}>
                <span className="track">{tx({ ar: "حائل", en: "Ha'il" })}</span>
              </div>

              {/* الدبابيس */}
              {PINS.map((p, i) => {
                const br = BRANCHES.find((x) => x.id === p.id)!;
                const on = sel === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSel(p.id)}
                    aria-label={tx(br.name)}
                    aria-pressed={on}
                    className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  >
                    <span className={cn("relative grid h-12 w-12 rotate-45 place-items-center border-2 transition-all duration-500", on ? "scale-110 border-hajar bg-bronze text-hajar" : "border-sand bg-palm text-sand group-hover:bg-bronze/60")}>
                      {on && <span className="ring absolute inset-0 rotate-0 text-bronze-soft" />}
                      <span className="-rotate-45 font-head text-sm font-extrabold">{isAr ? nums[i] : i + 1}</span>
                    </span>
                    <span className={cn("absolute top-1/2 mt-[-14px] ms-9 hidden whitespace-nowrap font-head text-[0.78rem] font-bold sm:block", on ? "text-hajar" : "text-sand/80", p.x > 50 ? "end-full me-2 ms-0" : "start-full")}>{tx(br.name)}</span>
                  </button>
                );
              })}

              <div className="absolute bottom-4 end-4 text-[0.7rem] text-sand/60">{tx({ ar: "خريطة تخطيطية", en: "Schematic map" })}</div>
            </div>
          </div>

          {/* لوح التفاصيل */}
          <div className="lg:col-span-5">
            <div className="mb-6 flex border-b border-sand" role="tablist">
              {BRANCHES.map((x) => (
                <button
                  key={x.id}
                  role="tab"
                  aria-selected={x.id === sel}
                  onClick={() => setSel(x.id)}
                  className={cn("relative min-h-[52px] flex-1 px-2 font-head text-[0.82rem] font-extrabold transition-colors", x.id === sel ? "text-palm" : "text-ink/45 hover:text-ink")}
                >
                  {tx(x.name)}
                  <span className={cn("absolute inset-x-0 -bottom-px h-[3px] bg-bronze transition-transform duration-500", x.id === sel ? "scale-x-100" : "scale-x-0")} />
                </button>
              ))}
            </div>

            <div key={b.id} className="pop">
              <div className="flex items-center justify-between gap-4">
                <div className="track font-head text-[0.74rem] font-bold text-bronze">{tx(b.city)}</div>
                <span className={cn("inline-flex items-center gap-2 px-3 py-1 font-head text-[0.75rem] font-bold", openNow ? "bg-palm text-hajar" : "bg-ink/10 text-ink")}>
                  <span className={cn("h-2 w-2 rounded-full", openNow ? "bg-[#7fd39a]" : "bg-bronze")} />
                  {openNow ? tx({ ar: "مفتوح الآن", en: "Open now" }) : tx({ ar: "مغلق الآن", en: "Closed now" })}
                </span>
              </div>
              <h3 className="mt-3 font-head font-black text-palm" style={{ fontSize: "clamp(2rem,5vw,3rem)", lineHeight: 1.3 }}>
                {tx(b.name)}
              </h3>

              <ul className="mt-6 space-y-4">
                <li className="flex gap-4">
                  <Pin className="mt-1 h-5 w-5 shrink-0 text-bronze" />
                  <span>{tx(b.addr)}</span>
                </li>
                <li className="flex gap-4">
                  <Clock className="mt-1 h-5 w-5 shrink-0 text-bronze" />
                  <span>{tx(b.hoursText)}</span>
                </li>
                <li className="flex gap-4">
                  <Phone className="mt-1 h-5 w-5 shrink-0 text-bronze" />
                  <a href={`tel:${b.phone.replace(/\s/g, "")}`} dir="ltr" className="font-bold underline-offset-4 hover:underline">
                    {b.phone}
                  </a>
                </li>
              </ul>

              <div className="cham mt-6 inline-block bg-bronze/12 px-4 py-2 font-head text-[0.82rem] font-bold text-bronze">{tx(b.slot)}</div>

              <div className="mt-8 grid grid-cols-3 gap-2">
                <a href={`tel:${b.phone.replace(/\s/g, "")}`} className="cham flex min-h-[52px] items-center justify-center gap-2 border border-ink/30 font-head text-[0.8rem] font-bold hover:bg-ink hover:text-hajar">
                  <Phone className="h-4 w-4" /> {tx({ ar: "اتصال", en: "Call" })}
                </a>
                <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener" className="cham flex min-h-[52px] items-center justify-center gap-2 border border-ink/30 font-head text-[0.8rem] font-bold hover:bg-ink hover:text-hajar">
                  <WhatsApp className="h-4 w-4" /> {tx({ ar: "واتساب", en: "WhatsApp" })}
                </a>
                <a href={b.map} target="_blank" rel="noopener" className="cham flex min-h-[52px] items-center justify-center gap-2 border border-ink/30 font-head text-[0.8rem] font-bold hover:bg-ink hover:text-hajar">
                  <Arrow className="h-4 w-4" /> {tx({ ar: "الاتجاهات", en: "Directions" })}
                </a>
              </div>
              <Btn className="mt-3 w-full" onClick={() => open({ branch: b.id })}>
                {tx({ ar: "احجز في هذا الفرع", en: "Book at this branch" })}
              </Btn>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
