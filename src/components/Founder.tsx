import { useLang } from "../lib/i18n";
import { Eyebrow, Reveal, useInView } from "../lib/ui";
import founder from "../assets/img/dr1.jpg";

/* ============================================================
   ٧) كلمة المؤسس
   المتوقّع: صورة مستطيلة + اقتباس صغير. المختار: «رسالة مطبوعة» —
   صورة ضخمة في نافذة نجدية فوق كلمة «نخلة» محفورة بخط مفرّغ،
   ورسالة بخط كبير، وتوقيع يُكتب أمام القارئ.
   ============================================================ */
export function Founder() {
  const { tx } = useLang();
  const [ref, inView] = useInView<HTMLDivElement>(0.35);
  return (
    <section id="founder" className="sec overflow-hidden">
      <div className="wrap relative grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
        {/* الرسالة */}
        <div className="relative z-10 lg:col-span-7 lg:pe-12">
          <Reveal>
            <Eyebrow n="05">{tx({ ar: "كلمة المؤسس", en: "A word from the founder" })}</Eyebrow>
          </Reveal>

          <Reveal delay={100}>
            <blockquote className="mt-8">
              <span aria-hidden className="block font-head text-[6rem] font-black leading-[0.6] text-bronze/80 sm:text-[8rem]">“</span>
              <p className="t-h2 !text-[clamp(1.7rem,4.4vw,3.2rem)] text-palm">
                {tx({
                  ar: "لم أفتح عيادة. فتحتُ وعداً: ألّا يخرج مريضٌ من بابنا إلا وقد فهم ما سيُفعل به، وبكم، ولماذا.",
                  en: "I didn't open a clinic. I made a promise: no patient leaves our door without understanding what will be done, for how much, and why.",
                })}
              </p>
            </blockquote>
          </Reveal>

          <Reveal delay={200}>
            <div className="t-lead mt-9 max-w-2xl space-y-5 text-ink/80">
              <p>
                {tx({
                  ar: "بدأتُ في المدينة المنورة بكرسيٍّ واحد وقناعة بسيطة: أن الأسنان ليست علاجاً فحسب، بل هي الثقة التي يحملها الإنسان حين يضحك ويتكلم ويقف أمام الناس.",
                  en: "I began in Madinah with a single chair and one simple belief: teeth are not only a treatment — they are the confidence a person carries when they laugh, speak and stand before others.",
                })}
              </p>
              <p>
                {tx({
                  ar: "اليوم نخلة ثلاثة فروع وفريق من الاستشاريين، لكن ما زلتُ أقرأ كل خطة علاج بنفسي. لأن من يضع ثقته في أيدينا، يستحق أن نعامله كما نعامل أهلنا.",
                  en: "Today Nakhla has three branches and a team of consultants, yet I still read every treatment plan myself. Whoever places their trust in our hands deserves to be treated like family.",
                })}
              </p>
            </div>
          </Reveal>

          <div ref={ref} className="mt-10 flex flex-wrap items-end gap-x-10 gap-y-6">
            <div>
              <svg viewBox="0 0 220 70" className="h-16 w-52 text-palm" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path
                  d="M8 46c10-28 22-36 24-18 1 12-4 22 8 18 14-5 14-24 26-24 10 0 2 22 12 22 12 0 18-18 28-18 8 0 0 16 10 16 12 0 24-8 36-8 8 0 14 4 22 2M30 58c40-6 100-8 170-2"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={inView ? 0 : 1}
                  style={{ transition: "stroke-dashoffset 3s cubic-bezier(.4,.1,.2,1)" }}
                />
              </svg>
              <div className="font-head text-[1.1rem] font-extrabold text-palm">{tx({ ar: "د. عبدالرحمن الحربي", en: "Dr. Abdulrahman Al-Harbi" })}</div>
              <div className="text-[0.9rem] text-ink/65">{tx({ ar: "المؤسس · استشاري زراعة الأسنان والجراحة", en: "Founder · Consultant in implantology & oral surgery" })}</div>
            </div>
            <ul className="flex gap-6 border-s border-sand ps-6 text-[0.85rem]">
              <li>
                <b className="block font-head text-[1.6rem] font-black text-bronze">{tx({ ar: "٢٥", en: "25" })}</b>
                {tx({ ar: "عاماً خبرة", en: "years' practice" })}
              </li>
              <li>
                <b className="block font-head text-[1.6rem] font-black text-bronze">{tx({ ar: "+٦٬٨٠٠", en: "6,800+" })}</b>
                {tx({ ar: "زرعة", en: "implants" })}
              </li>
            </ul>
          </div>
        </div>

        {/* الصورة */}
        <div className="relative lg:col-span-5">
          <div className="pointer-events-none absolute -top-10 start-1/2 z-0 w-[130%] -translate-x-1/2 select-none text-center font-head font-black leading-none text-transparent" style={{ fontSize: "clamp(8rem, 24vw, 17rem)", WebkitTextStroke: "1.5px #C8B79A" }} aria-hidden>
            {tx({ ar: "نخلة", en: "Nakhla" })}
          </div>
          {/* PROMPT: Editorial studio portrait, waist-up, slightly left three-quarter angle: distinguished Saudi man ~56, trimmed silver-grey beard, warm kind eyes, white ghutra with black agal, deep palm-green (#1F3D2B) high-collar medical coat with bronze stitching; Najdi sandstone backdrop, soft window light, faint palm-frond shadow; vertical 3:4 */}
          <div className="relative z-10 mx-auto max-w-[460px] lg:max-w-none">
            <div className="najdi-window aspect-[3/4] overflow-hidden bg-sand">
              <img src={founder} alt={tx({ ar: "د. عبدالرحمن الحربي، مؤسس نخلة", en: "Dr. Abdulrahman Al-Harbi, founder of Nakhla" })} className="h-full w-full object-cover object-top" loading="lazy" />
            </div>
            <div className="cham absolute -bottom-4 start-4 bg-palm px-5 py-3 text-hajar">
              <div className="track font-head text-[0.7rem] font-bold text-sand">{tx({ ar: "منذ ٢٠١٣", en: "Since 2013" })}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
