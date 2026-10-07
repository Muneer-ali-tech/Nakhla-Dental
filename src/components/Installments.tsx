import { useState } from "react";
import { useLang } from "../lib/i18n";
import { Btn, Eyebrow, Reveal, Words } from "../lib/ui";
import { Check } from "./Icons";
import { useBooking } from "./Booking";
import { cn } from "../utils/cn";

/* ============================================================
   ١٢) التقسيط والتأمين + حاسبة التقسيط
   المتوقّع: جدول أسعار أو ٣ بطاقات باقات. المختار: «تذكرة» مثقوبة
   من الجانبين تحمل حاسبة حيّة: مبلغ العلاج ← دفعة أولى ← عدد الأشهر،
   ويظهر القسط الشهري بخط ضخم وشريط أشهر مرسوم بالمعيّنات.
   ============================================================ */
const MONTHS = [3, 6, 12, 18, 24];
const FEE: Record<number, number> = { 3: 0, 6: 0, 12: 0, 18: 0.04, 24: 0.07 };
const DOWN = [0, 10, 20, 30];
const PRESETS = [
  { v: 3500, l: { ar: "زرعة", en: "Implant" } },
  { v: 6900, l: { ar: "تقويم", en: "Aligners" } },
  { v: 14000, l: { ar: "ابتسامة", en: "Smile" } },
];
const INSURERS = [
  { ar: "بوبا", en: "Bupa" },
  { ar: "التعاونية", en: "Tawuniya" },
  { ar: "ميدغلف", en: "MedGulf" },
  { ar: "ملاذ", en: "Malath" },
  { ar: "أكسا", en: "AXA" },
  { ar: "والدعم", en: "Walaa" },
];

export function Installments() {
  const { tx, isAr, num } = useLang();
  const { open } = useBooking();
  const [amount, setAmount] = useState(8000);
  const [down, setDown] = useState(10);
  const [months, setMonths] = useState(12);
  const [ins, setIns] = useState(0);

  const first = (amount * down) / 100;
  const financed = amount - first;
  const total = financed * (1 + FEE[months]);
  const monthly = total / months;
  const cur = isAr ? "ر.س" : "SAR";
  const pct = ((amount - 1000) / (60000 - 1000)) * 100;
  const track = `linear-gradient(to ${isAr ? "left" : "right"}, #B27C46 ${pct}%, rgba(234,227,214,.22) ${pct}%)`;

  const chip = (on: boolean) =>
    cn("cham min-h-[46px] px-4 font-head text-[0.82rem] font-bold transition-colors", on ? "bg-bronze text-hajar" : "border border-hajar/30 text-hajar hover:bg-hajar/10");

  return (
    <section id="pricing" className="sec">
      <div className="wrap grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
        {/* النص والتأمين */}
        <div className="lg:col-span-5">
          <Reveal>
            <Eyebrow n="10">{tx({ ar: "التقسيط والتأمين", en: "Instalments & insurance" })}</Eyebrow>
          </Reveal>
          <h2 className="t-h2 mt-6">
            <Words text={tx({ ar: "ابتسم الآن، وادفع على مهلك.", en: "Smile now, pay at your own pace." })} hl={isAr ? [1, 2] : [3, 4, 5, 6]} />
          </h2>
          <Reveal delay={100}>
            <p className="t-lead mt-6 text-ink/75">
              {tx({
                ar: "تقسيط بدون فوائد حتى ١٢ شهراً عبر شركائنا، ولا رسوم خفيّة. اضبط المبلغ فترى قسطك في ثوانٍ، ثم نثبّته لك مكتوباً.",
                en: "Interest-free instalments up to 12 months through our partners, with no hidden fees. Set the amount, see your payment in seconds — then we lock it in writing.",
              })}
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-10 border-t border-sand pt-8">
              <div className="mb-4 font-head text-[0.8rem] font-bold text-bronze">{tx({ ar: "شركات التأمين المقبولة", en: "Accepted insurers" })}</div>
              <div className="flex flex-wrap gap-2">
                {INSURERS.map((x, i) => (
                  <button
                    key={i}
                    onClick={() => setIns(i)}
                    aria-pressed={ins === i}
                    className={cn("cham min-h-[46px] px-5 font-head text-[0.88rem] font-extrabold transition-colors", ins === i ? "bg-palm text-hajar" : "border border-ink/25 hover:bg-ink/5")}
                  >
                    {tx(x)}
                  </button>
                ))}
              </div>
              <p key={ins} className="pop mt-5 flex gap-3 text-ink/80">
                <Check className="mt-1.5 h-4 w-4 shrink-0 text-bronze" />
                <span>
                  {tx({ ar: `نقبل وثائق ${INSURERS[ins].ar}. نتحقق من تغطيتك قبل موعدك بيوم عمل، والتغطية الشائعة حتى 70% للحشوات والعصب.`, en: `We accept ${INSURERS[ins].en} policies. We verify your cover one working day before your visit — typical cover is up to 70% for fillings and root canals.` })}
                </span>
              </p>
            </div>
          </Reveal>
        </div>

        {/* التذكرة: الحاسبة */}
        <Reveal className="lg:col-span-7" delay={150}>
          <div className="on-dark relative text-hajar drop-shadow-[0_40px_50px_rgba(22,32,26,.28)]">
            <div className="cham-lg grain-l relative bg-palm">


              <div className="p-6 pb-10 sm:p-10 sm:pb-12">
                <div className="flex items-center justify-between">
                  <span className="track font-head text-[0.72rem] font-bold text-sand">{tx({ ar: "حاسبة التقسيط", en: "Instalment calculator" })}</span>
                  <span className="track font-head text-[0.72rem] font-bold text-sand">N° 0{months}</span>
                </div>

                {/* المبلغ */}
                <div className="mt-6">
                  <label htmlFor="amt" className="text-[0.85rem] text-hajar/70">
                    {tx({ ar: "قيمة العلاج", en: "Treatment value" })}
                  </label>
                  <div className="font-head font-black leading-none" style={{ fontSize: "clamp(2.4rem,7vw,4rem)" }}>
                    {num(amount)} <span className="text-[0.4em] font-bold text-sand">{cur}</span>
                  </div>
                  <input id="amt" type="range" className="nj mt-2" min={1000} max={60000} step={500} value={amount} onChange={(e) => setAmount(+e.target.value)} style={{ ["--bg" as string]: track }} />
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((p) => (
                      <button key={p.v} onClick={() => setAmount(p.v)} className="min-h-[40px] border-b border-hajar/30 px-1 pe-4 text-[0.82rem] text-hajar/80 hover:border-bronze-soft hover:text-hajar">
                        {tx(p.l)} · {num(p.v)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* الدفعة الأولى والمدة */}
                <div className="mt-8 grid gap-7 sm:grid-cols-2">
                  <div>
                    <div className="mb-3 text-[0.85rem] text-hajar/70">{tx({ ar: "الدفعة الأولى", en: "Down payment" })}</div>
                    <div className="flex flex-wrap gap-2">
                      {DOWN.map((d) => (
                        <button key={d} onClick={() => setDown(d)} aria-pressed={down === d} className={chip(down === d)}>
                          {num(d)}{isAr ? "٪" : "%"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-3 text-[0.85rem] text-hajar/70">{tx({ ar: "عدد الأشهر", en: "Months" })}</div>
                    <div className="flex flex-wrap gap-2">
                      {MONTHS.map((m) => (
                        <button key={m} onClick={() => setMonths(m)} aria-pressed={months === m} className={chip(months === m)}>
                          {num(m)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* خط التمزيق مع ثقبي الجانبين */}
              <div className="relative h-0">
                <span className="absolute -start-4 top-0 h-8 w-8 -translate-y-1/2 rounded-full bg-hajar" />
                <span className="absolute -end-4 top-0 h-8 w-8 -translate-y-1/2 rounded-full bg-hajar" />
                <div className="mx-8 border-t-2 border-dashed border-hajar/30 sm:mx-10" />
              </div>

              {/* النتيجة */}
              <div className="p-6 pt-8 sm:p-10 sm:pt-10">
                <div className="flex flex-wrap items-end justify-between gap-6">
                  <div>
                    <div className="text-[0.85rem] text-hajar/70">{tx({ ar: "قسطك الشهري", en: "Your monthly payment" })}</div>
                    <div className="font-head font-black leading-none text-bronze-soft" style={{ fontSize: "clamp(3rem,10vw,5.6rem)" }}>
                      {num(monthly)} <span className="text-[0.32em] font-bold text-sand">{cur}</span>
                    </div>
                  </div>
                  <dl className="space-y-1.5 text-[0.88rem]">
                    <div className="flex justify-between gap-8">
                      <dt className="text-hajar/65">{tx({ ar: "الدفعة الأولى", en: "Due today" })}</dt>
                      <dd className="font-bold">{num(first)} {cur}</dd>
                    </div>
                    <div className="flex justify-between gap-8">
                      <dt className="text-hajar/65">{tx({ ar: "رسوم الخدمة", en: "Service fee" })}</dt>
                      <dd className="font-bold">{FEE[months] ? `${num(FEE[months] * 100)}${isAr ? "٪" : "%"}` : tx({ ar: "٠ — بدون فوائد", en: "0 — interest-free" })}</dd>
                    </div>
                    <div className="flex justify-between gap-8">
                      <dt className="text-hajar/65">{tx({ ar: "الإجمالي", en: "Total" })}</dt>
                      <dd className="font-bold">{num(first + total)} {cur}</dd>
                    </div>
                  </dl>
                </div>

                {/* شريط الأشهر */}
                <div className="mt-7 flex flex-wrap gap-1.5" aria-hidden>
                  {Array.from({ length: months }).map((_, i) => (
                    <span key={i} className="h-3 w-3 rotate-45 bg-bronze-soft transition-all" style={{ opacity: 0.35 + (i / months) * 0.65 }} />
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Btn onClick={() => open()} className="w-full sm:w-auto">
                    {tx({ ar: "اطلب خطة التقسيط", en: "Request this plan" })}
                  </Btn>
                  <span className="text-[0.78rem] text-hajar/55">{tx({ ar: "تقديرية، وتُثبَّت كتابةً بعد الفحص.", en: "Indicative — confirmed in writing after your check-up." })}</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
