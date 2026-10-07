import { useLang, type Bi } from "../lib/i18n";
import { Eyebrow, Reveal, Words, useInView } from "../lib/ui";
import { LogoMark } from "./Icons";
import { cn } from "../utils/cn";
import interior from "../assets/img/interior.jpg";

/* ============================================================
   ٦) لماذا نحن
   المتوقّع: ٤ أيقونات + عنوان قصير. المختار: «ميثاق نخلة» —
   وثيقة مطبوعة على ورق حجري بأربعة بنود وختم برونزي، تُعامل
   كعقد حقيقي يوقّعه الفريق: هذا أقوى وعد في السوق السعودي.
   ============================================================ */
const CLAUSES: { t: Bi; d: Bi }[] = [
  {
    t: { ar: "سعرٌ واحد، مكتوب، قبل أن نبدأ", en: "One price, in writing, before we begin" },
    d: { ar: "تتسلّم خطة علاجك مطبوعة بكل بند وسعره. لا إضافات مفاجئة ولا «سنرى أثناء العلاج».", en: "You receive your treatment plan printed, every line priced. No surprises, no “we'll see during treatment.”" },
  },
  {
    t: { ar: "طبيبٌ واحد يعرفك باسمك", en: "One doctor who knows your name" },
    d: { ar: "من الفحص الأول حتى آخر متابعة طبيبٌ مسؤول واحد، لا يتبدّل بتبدّل الجدول.", en: "From first check-up to last follow-up, one responsible doctor — not whoever the rota offers." },
  },
  {
    t: { ar: "ضمانٌ خطّي على كل علاج", en: "A written guarantee on every treatment" },
    d: { ar: "على الزراعة والتيجان والقشور، بمدة محددة وشروط واضحة، لا بكلام شفهي.", en: "On implants, crowns and veneers — with a stated term and clear conditions, never a verbal promise." },
  },
  {
    t: { ar: "وقتك أمانة", en: "Your time is a trust" },
    d: { ar: "موعدك هو موعدك. إن تأخّرنا أكثر من ١٥ دقيقة فعلينا فنجان قهوة وخصمٌ على زيارتك.", en: "Your appointment is your appointment. If we run over 15 minutes, coffee is on us — and so is a discount." },
  },
];

export function WhyUs() {
  const { tx, isAr } = useLang();
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const nums = ["١", "٢", "٣", "٤"];
  return (
    <section id="why" className="sec bg-sand/40">
      <div className="wrap grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
        {/* الصورة */}
        <div className="lg:col-span-5">
          <Reveal>
            <Eyebrow n="04">{tx({ ar: "لماذا نخلة", en: "Why Nakhla" })}</Eyebrow>
          </Reveal>
          <h2 className="t-h2 mt-6 mb-10">
            <Words text={tx({ ar: "أربعة التزامات نوقّع عليها قبل أن نعالجك.", en: "Four commitments we sign before we treat you." })} />
          </h2>
          {/* PROMPT: Architectural interior of a luxurious dental clinic reception lounge inspired by contemporary Najdi architecture — rammed-earth sand walls, a tall triangular Najdi window cut-out with sunbeams and palm-frond shadows, low sculptural deep-green bench, bronze lantern, honed stone floor; no people; vertical 4:5; palette #EAE3D6 #1F3D2B #8C5A2B */}
          <div className="relative">
            <div className="najdi-window aspect-[4/4.6] overflow-hidden bg-sand lg:aspect-[4/5]">
              <img src={interior} alt={tx({ ar: "ردهة استقبال نخلة", en: "Nakhla reception lounge" })} className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div className="cham absolute -bottom-5 end-3 hidden bg-palm px-5 py-3 text-hajar sm:block">
              <div className="track font-head text-[0.7rem] font-bold text-sand">{tx({ ar: "ردهة القبلتين", en: "Qiblatain lounge" })}</div>
            </div>
          </div>
        </div>

        {/* الميثاق */}
        <div className="lg:col-span-7 lg:pt-24">
          <Reveal>
            <div ref={ref} className="cham-lg relative bg-hajar-soft p-7 shadow-[0_40px_80px_-50px_rgba(22,32,26,.6)] sm:p-12">
              <div className="pointer-events-none absolute inset-3 border border-dashed border-sand sm:inset-4" style={{ clipPath: "inherit" }} />
              <div className="relative">
                <div className="flex items-center justify-between border-b border-ink/15 pb-6">
                  <div>
                    <div className="track font-head text-[0.72rem] font-bold text-bronze">{tx({ ar: "وثيقة التزام", en: "Charter of commitment" })}</div>
                    <div className="mt-1 font-head text-[1.6rem] font-black text-palm sm:text-[2rem]">{tx({ ar: "ميثاق نخلة", en: "The Nakhla Charter" })}</div>
                  </div>
                  <LogoMark className="h-12 w-12 text-palm" style={{ ["--logo-in" as string]: "#F3EEE4" }} />
                </div>

                <ol className="divide-y divide-ink/10">
                  {CLAUSES.map((c, i) => (
                    <li key={i} className="grid grid-cols-[auto_1fr] gap-5 py-6 sm:gap-8 sm:py-8">
                      <span className="font-head text-[2.6rem] font-black leading-none text-bronze/90 sm:text-[3.4rem]">{isAr ? nums[i] : i + 1}</span>
                      <div>
                        <h3 className="font-head text-[1.1rem] font-extrabold text-palm sm:text-[1.35rem]">{tx(c.t)}</h3>
                        <p className="mt-2 text-ink/75">{tx(c.d)}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                {/* التوقيع والختم */}
                {/* flex-wrap: على الجوال لا يتسع سطر التوقيع + الختم معاً
                    (محتواه الأدنى ٣٥٢px) فيكسر عرض العمود كاملاً */}
                <div className="mt-4 flex flex-wrap items-end justify-between gap-6 border-t border-ink/15 pt-8">
                  <div>
                    <svg viewBox="0 0 200 60" className="h-14 w-44 text-palm" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                      <path
                        d="M6 40c18-30 30-34 28-14-2 18 8 20 20-6 4-9 10-12 8-2-2 10 4 12 16 2 10-8 14-8 12 2 18-14 30-16 42-6 8 6 18 2 26-4"
                        pathLength={1}
                        strokeDasharray={1}
                        strokeDashoffset={inView ? 0 : 1}
                        style={{ transition: "stroke-dashoffset 2.4s cubic-bezier(.4,.1,.2,1) .4s" }}
                      />
                    </svg>
                    <div className="mt-1 text-[0.85rem] text-ink/65">{tx({ ar: "إدارة عيادات نخلة", en: "Nakhla Clinics Management" })}</div>
                  </div>
                  <div
                    className={cn("grid h-24 w-24 shrink-0 place-items-center rounded-full border-2 border-bronze text-center font-head text-[0.62rem] font-extrabold leading-tight text-bronze transition-all duration-700 delay-[1600ms]", inView ? "rotate-[-10deg] scale-100 opacity-100" : "rotate-[20deg] scale-150 opacity-0")}
                  >
                    <span>
                      {tx({ ar: "ختم", en: "SEALED" })}
                      <br />
                      {tx({ ar: "الالتزام", en: "& SIGNED" })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
