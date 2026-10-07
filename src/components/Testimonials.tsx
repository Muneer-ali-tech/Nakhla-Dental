import { useLang, type Bi } from "../lib/i18n";
import { Eyebrow, Reveal, Words } from "../lib/ui";
import { Star } from "./Icons";
import { cn } from "../utils/cn";

/* ============================================================
   ١١) آراء المرضى
   المتوقّع: سلايدر بطاقات بصور دائرية ونجوم. المختار: «أعمدة تحريرية»
   — شهادات بأحجام نصّ متفاوتة وخطوط رفيعة كصفحة مجلة، يتوسطها تقييم
   ضخم. على الجوال: شريط أفقي بالسحب مع التقاط تلقائي.
   ============================================================ */
type Q = { q: Bi; name: Bi; meta: Bi; big?: boolean };
const QS: Q[] = [
  {
    big: true,
    q: { ar: "دخلتُ العيادة خائفاً وخرجتُ أسأل متى موعدي القادم. شرحوا لي كل خطوة بالصور قبل أن يلمسوا سنّاً واحداً، وبقي السعر نفسه المكتوب في الورقة حتى آخر زيارة.", en: "I walked in afraid and walked out asking when my next appointment was. They explained every step with images before touching a single tooth — and the price stayed exactly what was written on the paper until the last visit." },
    name: { ar: "عبدالله المحمدي", en: "Abdullah Al-Muhammadi" },
    meta: { ar: "زراعة ٣ أسنان · المدينة المنورة", en: "3 implants · Madinah" },
  },
  {
    q: { ar: "ابنتي ذات الخمس سنوات صارت تطلب زيارة د. لمى بنفسها! لم أتخيّل أن يحدث هذا يوماً.", en: "My five-year-old now asks to visit Dr. Lama on her own! I never imagined this would happen." },
    name: { ar: "أم لجين", en: "Umm Lujain" },
    meta: { ar: "أسنان الأطفال · القبلتين", en: "Pediatric · Al-Qiblatain" },
  },
  {
    q: { ar: "التقويم الشفاف غيّر طريقتي في الضحك أمام طلابي. وأنهيتُ العلاج قبل الموعد المتوقع بشهرين.", en: "Clear aligners changed how I laugh in front of my students — and I finished two months ahead of schedule." },
    name: { ar: "سارة الحربي", en: "Sarah Al-Harbi" },
    meta: { ar: "تقويم شفاف · حائل", en: "Clear aligners · Ha'il" },
  },
  {
    q: { ar: "جرّبتُ ثلاث عيادات قبلهم. الفرق أنني هنا أعرف اسم طبيبي ويعرف اسمي.", en: "I tried three clinics before them. The difference is that here I know my doctor's name, and he knows mine." },
    name: { ar: "فهد العنزي", en: "Fahad Al-Anazi" },
    meta: { ar: "تيجان زركونيا · العزيزية", en: "Zirconia crowns · Al-Aziziyah" },
  },
  {
    big: true,
    q: { ar: "قيل لي إن الضرس يُخلع، وقالت د. ريم: سننقذه. أنقذته في جلسة واحدة لم تتجاوز الساعة.", en: "I was told the molar had to go. Dr. Reem said, “we'll save it” — and she did, in a single session under an hour." },
    name: { ar: "تركي الشمري", en: "Turki Al-Shammari" },
    meta: { ar: "علاج عصب · العزيزية", en: "Root canal · Al-Aziziyah" },
  },
  {
    q: { ar: "تبييضٌ بلا حساسية، وأسناني تبدو طبيعية لا بيضاء مصطنعة. هذا بالضبط ما أردته.", en: "Whitening with no sensitivity, and my teeth look natural — not artificially white. Exactly what I wanted." },
    name: { ar: "لولوة الجهني", en: "Lulwa Al-Juhani" },
    meta: { ar: "تبييض · القبلتين", en: "Whitening · Al-Qiblatain" },
  },
];

export function Testimonials() {
  const { tx, isAr, num } = useLang();
  return (
    <section id="reviews" className="sec bg-sand/40">
      <div className="wrap grid gap-12 lg:grid-cols-12 lg:gap-16">
        {/* التقييم */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <Eyebrow n="09">{tx({ ar: "آراء المرضى", en: "Patient voices" })}</Eyebrow>
            </Reveal>
            <div className="mt-8 flex items-end gap-4">
              <span className="font-head font-black leading-[0.8] text-palm" style={{ fontSize: "clamp(6rem,17vw,10rem)" }}>
                {num(4.9, 1)}
              </span>
              <div className="pb-2">
                <div className="flex gap-0.5 text-bronze">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-5 w-5" />
                  ))}
                </div>
                <div className="mt-1 text-[0.9rem] text-ink/70">{tx({ ar: "من ٥ على جوجل", en: "out of 5 on Google" })}</div>
              </div>
            </div>
            <h2 className="t-h3 mt-6">
              <Words text={tx({ ar: "١٬٢٨٠ تقييماً موثّقاً، وكلٌّ منها يحكي نتيجة لا وعداً.", en: "1,280 verified reviews — each one tells a result, not a promise." })} />
            </h2>
            <p className="mt-4 text-[0.85rem] text-ink/60 lg:hidden">{tx({ ar: "اسحب لقراءة المزيد ←", en: "Swipe to read more →" })}</p>
          </div>
        </div>

        {/* الشهادات */}
        {/* min-w-0: بدونها لا ينكمش عمود الشبكة على الجوال فيتمدد شريط
            البطاقات إلى عرض محتواه (≈١٠٥٠px) ويفيض يساراً في اتجاه RTL */}
        <div className="min-w-0 lg:col-span-8">
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-x-16 lg:gap-y-0 lg:overflow-visible lg:px-0 lg:pb-0">
            {QS.map((q, i) => (
              <figure
                key={i}
                className={cn(
                  "cham w-[86%] shrink-0 snap-start bg-hajar-soft p-6 sm:w-[60%] lg:w-auto lg:[clip-path:none] lg:bg-transparent lg:p-0",
                  "lg:border-t lg:border-ink/25 lg:pb-14 lg:pt-8",
                  q.big && "lg:col-span-2",
                  i % 2 === 1 && !q.big && "lg:mt-20"
                )}
              >
                <span aria-hidden className="block font-head text-[3.5rem] font-black leading-[0.7] text-bronze">“</span>
                <blockquote
                  className={cn("mt-3 text-ink", q.big ? "font-head font-bold lg:text-[clamp(1.5rem,2.6vw,2.2rem)]" : "text-[1.02rem] lg:text-[1.15rem]")}
                  style={{ lineHeight: isAr ? 1.9 : 1.55 }}
                >
                  {tx(q.q)}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center bg-palm font-head text-sm font-extrabold text-hajar najdi-window">{tx(q.name).trim().charAt(0)}</span>
                  <span>
                    <span className="block font-head text-[0.95rem] font-extrabold text-palm">{tx(q.name)}</span>
                    <span className="block text-[0.82rem] text-bronze">{tx(q.meta)}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
