import { useLang, type Bi } from "../lib/i18n";
import { Count, Eyebrow, Reveal, Words, useInView } from "../lib/ui";
import { cn } from "../utils/cn";
import techImg from "../assets/img/tech.jpg";

/* ============================================================
   ١٠) التقنيات والتعقيم
   المتوقّع: شعارات أجهزة + «نعقّم بأحدث الأجهزة». المختار: صورة ثابتة
   يمرّ عليها خط مسح برونزي، وبجوارها خمس تقنيات بلغة المريض،
   ثم مقياس حيّ للتعقيم بالبخار (134° م) وبروتوكول من أربع خطوات
   ينتهي بفتح الأداة أمامك.
   ============================================================ */
const TECH: { t: Bi; d: Bi }[] = [
  { t: { ar: "مسح رقمي ثلاثي الأبعاد", en: "3D intraoral scanning" }, d: { ar: "ثوانٍ من المسح بدل قوالب الحشو المزعجة، بدقّة تتجاوز اليد.", en: "Seconds of scanning in place of messy impressions — with accuracy beyond the human hand." } },
  { t: { ar: "أشعة مقطعية CBCT", en: "CBCT cone-beam imaging" }, d: { ar: "ترى العظم والأعصاب بوضوح قبل الجراحة، بجرعة إشعاع منخفضة.", en: "See bone and nerves clearly before surgery, at a low radiation dose." } },
  { t: { ar: "المجهر الجراحي", en: "Surgical microscope" }, d: { ar: "تكبير حتى ٢٥ ضعفاً لعلاج عصب دقيق وجلسة أقصر.", en: "Up to 25× magnification for precise root-canal work and shorter sessions." } },
  { t: { ar: "الليزر الطبي", en: "Medical laser" }, d: { ar: "علاج اللثة وتجميلها دون مشرط ودون خياطة تقريباً.", en: "Gum treatment and contouring with no scalpel and almost no stitches." } },
  { t: { ar: "تصميم الابتسامة الرقمي", en: "Digital Smile Design" }, d: { ar: "نرسم ابتسامتك على صورتك قبل أن نبدأ، لتوافق عليها بعينك.", en: "We draw your smile on your own photo before starting, so you approve it with your own eyes." } },
];

const STEPS: { t: Bi; m: Bi }[] = [
  { t: { ar: "غسل بالموجات فوق الصوتية", en: "Ultrasonic wash" }, m: { ar: "١٥ دقيقة", en: "15 min" } },
  { t: { ar: "تعقيم بالبخار المضغوط", en: "Pressurised steam sterilisation" }, m: { ar: "٤ دقائق عند ١٣٤°", en: "4 min at 134°" } },
  { t: { ar: "ختم في كيس بمؤشر كيميائي", en: "Sealed in an indicator pouch" }, m: { ar: "يُختم ويُؤرَّخ", en: "Sealed & dated" } },
  { t: { ar: "يُفتح أمامك في غرفة العلاج", en: "Opened in front of you" }, m: { ar: "بعينك أنت", en: "With your own eyes" } },
];

export function Technology() {
  const { tx, isAr } = useLang();
  const [gRef, gIn] = useInView<HTMLDivElement>(0.4);
  const nums = ["١", "٢", "٣", "٤", "٥"];
  const R = 88;
  const C = 2 * Math.PI * R;
  return (
    <section id="tech" className="bg-hajar-soft">
      <div className="sec wrap">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* PROMPT: Still-life of a sleek 3D intraoral dental scanner on a honed beige stone tray beside sealed sterilization pouches and a small brass instrument holder, deep palm-green ceramic tile wall behind, soft daylight with faint palm-frond shadow, no people, no frightening tools; landscape 4:3 */}
          <div className="relative lg:col-span-6">
            <div className="cham-lg relative aspect-[4/3.4] overflow-hidden bg-sand">
              <img src={techImg} alt={tx({ ar: "ماسح رقمي ثلاثي الأبعاد وأكياس تعقيم مختومة", en: "A 3D intraoral scanner and sealed sterilisation pouches" })} className="h-full w-full object-cover" loading="lazy" />
              <div className="scan pointer-events-none absolute inset-y-0 w-px bg-bronze-soft shadow-[0_0_30px_6px_rgba(178,124,70,.55)]" />
            </div>
            <div className="cham absolute -bottom-5 start-5 bg-palm px-5 py-3 text-hajar">
              <div className="track font-head text-[0.7rem] font-bold text-sand">{tx({ ar: "مسح رقمي · بلا قوالب", en: "Digital scan · No impressions" })}</div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <Reveal>
              <Eyebrow n="08">{tx({ ar: "التقنيات", en: "Technology" })}</Eyebrow>
            </Reveal>
            <h2 className="t-h2 mt-6">
              <Words text={tx({ ar: "التقنية عندنا تخدم الراحة، لا الاستعراض.", en: "Our technology serves comfort, not show." })} />
            </h2>
            <ol className="mt-8">
              {TECH.map((t, i) => (
                <Reveal key={i} delay={i * 70}>
                  <li className="grid grid-cols-[auto_1fr] gap-5 border-t border-sand py-5">
                    <span className="font-head text-[0.85rem] font-bold text-bronze">{isAr ? `٠${nums[i]}` : `0${i + 1}`}</span>
                    <div>
                      <h3 className="font-head text-[1.1rem] font-extrabold text-palm">{tx(t.t)}</h3>
                      <p className="mt-1 text-ink/70">{tx(t.d)}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* بروتوكول التعقيم */}
      <div className="relative">
        <div className="najdi-top" style={{ ["--c" as string]: "#1F3D2B" }} />
        <div className="on-dark grain-l bg-palm py-16 text-hajar lg:py-24">
          <div className="wrap grid items-center gap-12 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-5">
              <div className="track mb-4 font-head text-[0.75rem] font-bold text-sand">{tx({ ar: "بروتوكول التعقيم", en: "Sterilisation protocol" })}</div>
              <h3 className="t-h2 !text-[clamp(1.8rem,4.6vw,3rem)]">{tx({ ar: "تعقيمٌ تراه بعينك.", en: "Sterilisation you can see." })}</h3>
              <p className="t-lead mt-4 text-hajar/75">{tx({ ar: "كل أداة تدخل فمك تُفتح أمامك من كيسها المختوم. هذا ليس شعاراً، بل خطوة رابعة في كل زيارة.", en: "Every instrument that enters your mouth is opened in front of you from its sealed pouch. That isn't a slogan — it is step four of every visit." })}</p>

              {/* المقياس */}
              <div ref={gRef} className="mt-10 flex items-center gap-8">
                <div className="relative h-[200px] w-[200px] shrink-0">
                  <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden>
                    <circle cx="100" cy="100" r={R} fill="none" stroke="#C8B79A" strokeOpacity=".2" strokeWidth="6" strokeDasharray="1 6" strokeLinecap="round" />
                    <circle cx="100" cy="100" r={R} fill="none" stroke="#B27C46" strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={gIn ? C * 0.12 : C} style={{ transition: "stroke-dashoffset 2.4s cubic-bezier(.3,.7,.2,1)" }} />
                  </svg>
                  <div className="absolute inset-0 grid place-items-center text-center">
                    <div>
                      <div className="font-head text-[2.6rem] font-black leading-none">
                        <Count to={134} />°
                      </div>
                      <div className="mt-1 text-[0.75rem] text-sand">{tx({ ar: "درجة مئوية", en: "degrees Celsius" })}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 text-[0.9rem]">
                  <div>
                    <div className="text-hajar/55">{tx({ ar: "الضغط", en: "Pressure" })}</div>
                    <div className="font-head font-extrabold">{tx({ ar: "٢٫١ بار", en: "2.1 bar" })}</div>
                  </div>
                  <div>
                    <div className="text-hajar/55">{tx({ ar: "السجل", en: "Log" })}</div>
                    <div className="font-head font-extrabold">{tx({ ar: "يُوثَّق لكل دورة", en: "Recorded per cycle" })}</div>
                  </div>
                </div>
              </div>
            </div>

            <ol className="relative lg:col-span-7">
              <span className="absolute bottom-6 top-6 start-[19px] w-px bg-hajar/20" aria-hidden />
              {STEPS.map((s, i) => (
                <Reveal key={i} delay={i * 120}>
                  <li className="relative flex items-center gap-6 py-5">
                    <span className={cn("relative z-10 grid h-10 w-10 shrink-0 place-items-center rotate-45", i === 3 ? "bg-bronze" : "border border-sand bg-palm")}>
                      <span className="-rotate-45 font-head text-[0.85rem] font-bold">{isAr ? nums[i] : i + 1}</span>
                    </span>
                    <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-6 border-b border-hajar/15 pb-5">
                      <span className="font-head text-[1.05rem] font-extrabold sm:text-[1.25rem]">{tx(s.t)}</span>
                      <span className="text-[0.88rem] text-sand">{tx(s.m)}</span>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
