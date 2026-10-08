import { useEffect, useRef, useState } from "react";
import { useLang, type Bi } from "../lib/i18n";
import { Btn, Eyebrow, Reveal, Words, useInView } from "../lib/ui";
import { Smile, type SmileCfg } from "./Smile";
import { useBooking } from "./Booking";
import { Check } from "./Icons";
import { cn } from "../utils/cn";

/* ---- صور قبل وبعد الحقيقية ---- */
import baSmile from "../assets/img/ba-smile.jpg";
import baWhitening from "../assets/img/ba-whitening.jpg";
import baOrtho from "../assets/img/ba-ortho.jpg";
import baImplant from "../assets/img/ba-implant.jpg";

/* ============================================================
   ٤) قبل وبعد — نتائج حقيقية
   التقديم: نقلتُ هذا القسم مباشرة بعد مؤشرات الثقة (الانبهار ← الدليل)،
   لأن أقوى محرّك للرغبة هو رؤية الفرق قبل قراءة أي وعد.

   المقارنة: ستارة قابلة للسحب (لمس/ماوس/لوحة مفاتيح) + زرّا «قبل/بعد»
   للقفز المباشر + عمودان ثابتان يشرحان المشكلة والنتيجة بجوار الصورة.

   ⚠️ كل حالة = صورتان مختلفتان فعلياً (رسمان مختلفان في الهندسة واللون).
   لاستبدالها بصور فوتوغرافية: ضع الرابط في beforeSrc / afterSrc.
   ============================================================ */
type Case = {
  id: string;
  service: string; // معرّف الخدمة للحجز
  name: Bi;
  duration: Bi;
  visits: Bi;
  procedure: Bi;
  problems: Bi[];
  results: Bi[];
  before: { cfg: SmileCfg; src?: string; half?: "left" | "right"; prompt: string };
  after: { cfg: SmileCfg; src?: string; half?: "left" | "right"; prompt: string };
};

const CASES: Case[] = [
  {
    id: "smile",
    service: "cosmetic",
    name: { ar: "الابتسامة التجميلية", en: "Smile makeover" },
    duration: { ar: "١٤ يوماً", en: "14 days" },
    visits: { ar: "٣ زيارات", en: "3 visits" },
    procedure: { ar: "٨ قشور خزفية (فينير)", en: "8 porcelain veneers" },
    problems: [
      { ar: "حواف متآكلة وشرخ في القاطعة", en: "Worn edges, chipped incisor" },
      { ar: "فراغ بين القاطعتين وأطوال غير متناسقة", en: "Gap between centrals, uneven lengths" },
      { ar: "اصفرار وبقع قديمة", en: "Yellowing and old stains" },
    ],
    results: [
      { ar: "صفّ متناسق متماثل الأطوال", en: "A symmetrical, balanced arch" },
      { ar: "فراغ مُغلق وحواف نظيفة", en: "Gap closed, clean edges" },
      { ar: "لون عاجي طبيعي لا يبدو مصطنعاً", en: "Natural ivory shade, never artificial" },
    ],
    before: {
      prompt:
        "Close-up clinical photo of a smile: upper front teeth with worn, uneven incisal edges, a small chip on the upper-left central incisor, a visible diastema (gap) between the two central incisors, shorter lateral incisors, yellowish-grey tone with old stains; natural lighting, neutral skin, lips relaxed.",
      src: baSmile,
      half: "left",
      cfg: {
        shade: "dull",
        gap: 16,
        teeth: {
          L0: { sh: 0.9, chip: "l", stain: 1 },
          R0: { sh: 0.97, rot: 2 },
          L1: { sh: 0.76, stain: 2, rot: -3 },
          R1: { sh: 0.9 },
          L2: { sh: 0.84, sw: 0.94 },
          R2: { sh: 0.8 },
          L3: { sh: 0.92 },
          R3: { sh: 0.95 },
        },
      },
    },
    after: {
      prompt:
        "Same framing: the same smile after 8 porcelain veneers — symmetrical natural-length incisors, no gap, clean smooth edges, soft ivory shade (B1) with subtle translucency at the edges, healthy pink gums; same lighting.",
      src: baSmile,
      half: "right",
      cfg: { shade: "natural", teeth: { L1: { sh: 0.97 }, R1: { sh: 0.97 } } },
    },
  },
  {
    id: "whitening",
    service: "cosmetic",
    name: { ar: "تبييض الأسنان", en: "Teeth whitening" },
    duration: { ar: "٦٠ دقيقة", en: "60 minutes" },
    visits: { ar: "زيارة واحدة", en: "1 visit" },
    procedure: { ar: "تبييض بالضوء البارد", en: "Cold-light in-clinic whitening" },
    problems: [
      { ar: "اصفرار عميق من القهوة والشاي", en: "Deep staining from coffee and tea" },
      { ar: "بقع بنية قرب اللثة", en: "Brown stains near the gum line" },
      { ar: "لون باهت لا يعكس الضوء", en: "A dull tone that does not reflect light" },
    ],
    results: [
      { ar: "٨ درجات أفتح في جلسة واحدة", en: "Up to 8 shades lighter in one session" },
      { ar: "لون موحّد من اللثة إلى الحافة", en: "Even colour from gum to edge" },
      { ar: "دون حساسية بفضل جل مهدّئ", en: "No sensitivity thanks to a desensitising gel" },
    ],
    before: {
      prompt:
        "Close-up clinical photo of a natural smile with well-shaped but stained teeth (shade A4): yellow-brown tone, darker near the gums, small brown stain spots on laterals and canines, healthy gums; natural daylight.",
      src: baWhitening,
      half: "left",
      cfg: {
        shade: "stained",
        teeth: {
          L0: { stain: 2 },
          R0: { stain: 2 },
          L1: { stain: 1 },
          R1: { stain: 2 },
          L2: { stain: 2 },
          R2: { stain: 1 },
          L3: { stain: 1 },
          R3: { stain: 2 },
        },
      },
    },
    after: {
      prompt:
        "Same framing and teeth shape after in-clinic whitening: bright clean white (shade B1), even colour from gum to edge, soft natural highlights, no stains; same lighting.",
      src: baWhitening,
      half: "right",
      cfg: { shade: "bright" },
    },
  },
  {
    id: "ortho",
    service: "ortho",
    name: { ar: "التقويم", en: "Orthodontics" },
    duration: { ar: "١٠ أشهر", en: "10 months" },
    visits: { ar: "١٢ زيارة", en: "12 visits" },
    procedure: { ar: "تقويم شفاف رقمي", en: "Digital clear aligners" },
    problems: [
      { ar: "ازدحام شديد وتداخل بين الأسنان", en: "Severe crowding and overlap" },
      { ar: "ناب مرتفع وقاطعة مائلة", en: "High canine and a rotated lateral" },
      { ar: "صعوبة في التنظيف وتجمّع الجير", en: "Hard to clean, plaque traps" },
    ],
    results: [
      { ar: "قوس منتظم وأسنان متراصّة", en: "An even arch, evenly aligned teeth" },
      { ar: "إطباق مريح وتنظيف أسهل", en: "A comfortable bite, easier cleaning" },
      { ar: "ابتسامة أعرض وأكثر انفتاحاً", en: "A broader, more open smile" },
    ],
    before: {
      prompt:
        "Close-up clinical photo of a smile with crowded upper teeth: lateral incisor twisted and tucked behind the central, other lateral overlapping forward, canine erupted high near the gum, overlapping edges, no gaps; natural light.",
      src: baOrtho,
      half: "left",
      cfg: {
        shade: "natural",
        papilla: false,
        teeth: {
          L0: { rot: 8, dx: 6, z: 2 },
          R0: { rot: -4, dx: -4, z: 1, sw: 1.04 },
          L1: { rot: 30, dx: 20, dy: 6, sh: 0.9, sw: 0.88, z: -1 },
          R1: { rot: -16, dx: -14, dy: -4, z: 3 },
          L2: { dy: -26, dx: 8, sh: 0.8, rot: -8 },
          R2: { dx: -12, rot: 12, sw: 1.02, z: -1 },
          L3: { dx: 6, rot: -6 },
          R3: { dx: -6, rot: 8 },
        },
      },
    },
    after: {
      prompt:
        "Same framing after 10 months of clear aligners: perfectly aligned upper arch, evenly spaced teeth, natural symmetry, healthy gum scallops; same lighting.",
      src: baOrtho,
      half: "right",
      cfg: { shade: "natural", teeth: { R1: { sh: 0.97 }, L2: { sh: 1.02 } } },
    },
  },
  {
    id: "implant",
    service: "implant",
    name: { ar: "زراعة الأسنان", en: "Dental implant" },
    duration: { ar: "٤ أشهر", en: "4 months" },
    visits: { ar: "٤ زيارات", en: "4 visits" },
    procedure: { ar: "زرعة تيتانيوم + تاج خزفي", en: "Titanium implant + ceramic crown" },
    problems: [
      { ar: "فقدان القاطعة الجانبية العلوية", en: "A missing upper lateral incisor" },
      { ar: "ميلان الأسنان المجاورة نحو الفراغ", en: "Neighbouring teeth drifting into the gap" },
      { ar: "تراجع اللثة وفراغ ظاهر عند الابتسام", en: "Gum recession, a visible gap when smiling" },
    ],
    results: [
      { ar: "سنّ جديد بنفس لون وشكل جيرانه", en: "A new tooth matched in shade and shape" },
      { ar: "لثة متناسقة بشكل طبيعي", en: "Naturally contoured gum" },
      { ar: "ثبات يدوم مدى الحياة بإذن الله", en: "Stability built to last a lifetime" },
    ],
    before: {
      prompt:
        "Close-up clinical photo of a smile with the upper-left lateral incisor missing: a dark visible gap, flattened gum ridge, the canine tilted toward the gap, the central slightly rotated; natural light.",
      src: baImplant,
      half: "left",
      cfg: {
        shade: "natural",
        teeth: { L1: { missing: true }, L0: { rot: 4, dx: -2 }, L2: { rot: -13, dx: 14 } },
      },
    },
    after: {
      prompt:
        "Same framing after implant restoration: the missing lateral incisor replaced with a ceramic crown perfectly matching neighbours in shade and shape, natural gum contour, canine upright; same lighting.",
      src: baImplant,
      half: "right",
      cfg: { shade: "natural", teeth: { L1: { sh: 0.98 } } },
    },
  },
];

function Pane({ side }: { side: Case["before"] }) {
  if (side.src) {
    /* كل صورة تحتوي على نصفين: قبل (يسار) وبعد (يمين).
       نعرض النصف المطلوب فقط بتوسيع الصورة إلى 200% عرضاً
       وإزاحة object-position لليسار أو اليمين. */
    const isLeft = side.half === "left";
    return (
      <img
        src={side.src}
        alt=""
        className="h-full w-full object-cover"
        style={{
          objectFit: "cover",
          objectPosition: isLeft ? "left center" : "right center",
          /* قص نصف الصورة: نجعل عرض الصورة ضعف الحاوية ونزيحها */
          width: "200%",
          maxWidth: "none",
          ...(isLeft ? { marginLeft: 0 } : { marginLeft: "-100%" }),
        }}
      />
    );
  }
  return <Smile cfg={side.cfg} className="h-full w-full" />;
}

export function BeforeAfter() {
  const { tx, isAr } = useLang();
  const { open } = useBooking();
  const [idx, setIdx] = useState(0);
  const [pos, setPos] = useState(50);
  const [anim, setAnim] = useState(false);
  const [stageRef, stageIn] = useInView<HTMLDivElement>(0.4);
  const timers = useRef<number[]>([]);
  const c = CASES[idx];

  // الجهة التي تقع عليها صورة «قبل»: يمين في العربية، يسار في الإنجليزية
  const beforeRight = isAr;
  const clip = beforeRight ? `inset(0 0 0 ${pos}%)` : `inset(0 ${100 - pos}% 0 0)`;

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const hint = () => {
    clear();
    setAnim(true);
    setPos(50);
    [[300, 30], [1100, 70], [1900, 50]].forEach(([t, v]) => timers.current.push(window.setTimeout(() => setPos(v), t)));
    timers.current.push(window.setTimeout(() => setAnim(false), 2700));
  };
  useEffect(() => {
    if (stageIn) hint();
    return clear;
    // eslint-disable-next-line
  }, [stageIn]);

  const select = (i: number) => {
    setIdx(i);
    setAnim(true);
    setPos(50);
    clear();
    timers.current.push(window.setTimeout(() => setAnim(false), 700));
  };
  const snap = (side: "before" | "after") => {
    clear();
    setAnim(true);
    // قبل كاملة = الستارة عند أبعد نقطة من جهة «قبل»
    const beforeFull = beforeRight ? 0 : 100;
    setPos(side === "before" ? beforeFull : 100 - beforeFull);
    timers.current.push(window.setTimeout(() => setAnim(false), 800));
  };

  const handleLeft = `${pos}%`;
  const lblBefore = (
    <span className={cn("absolute top-4 z-10 bg-palm px-4 py-1.5 font-head text-[0.75rem] font-bold text-hajar", beforeRight ? "right-4" : "left-4")}>
      {tx({ ar: "قبل", en: "Before" })}
    </span>
  );
  const lblAfter = (
    <span className={cn("absolute top-4 z-10 bg-bronze px-4 py-1.5 font-head text-[0.75rem] font-bold text-hajar", beforeRight ? "left-4" : "right-4")}>
      {tx({ ar: "بعد", en: "After" })}
    </span>
  );

  return (
    <section id="results" className="on-dark grain-l sec bg-palm text-hajar">
      <div className="wrap">
        <div className="grid items-end gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Reveal>
              <Eyebrow n="02" light>
                {tx({ ar: "قبل وبعد · نتائج حقيقية", en: "Before & after · real results" })}
              </Eyebrow>
            </Reveal>
            <h2 className="t-h2 mt-6">
              <Words text={tx({ ar: "الفرق الذي تراه بعينك، لا الذي نَعِدُك به.", en: "The difference you can see, not the one we promise." })} hl={isAr ? [3] : [3, 4, 5]} hlClass="text-bronze-soft" />
            </h2>
          </div>
          <Reveal className="lg:col-span-4" delay={150}>
            <p className="t-lead text-hajar/75">
              {tx({
                ar: "حرّك الستارة بإصبعك. كل حالة هنا صورتان مختلفتان فعلياً، تُنشر بموافقة صاحبها الخطية.",
                en: "Slide the curtain with your finger. Every case is two genuinely different photographs, published with the patient's written consent.",
              })}
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-12 lg:gap-12">
          {/* فهرس الحالات */}
          {/* min-w-0: كي ينكمش العمود على الجوال ولا يتمدد فهرس الحالات
              الأفقي إلى عرض محتواه فيكسر الصفحة (فيض يساراً في RTL) */}
          <div className="min-w-0 lg:col-span-3">
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0 lg:pb-0" role="tablist">
              {CASES.map((k, i) => (
                <button
                  key={k.id}
                  role="tab"
                  aria-selected={i === idx}
                  onClick={() => select(i)}
                  className={cn(
                    "group relative shrink-0 text-start transition-all duration-500",
                    "cham min-h-[52px] px-5 py-3 lg:min-h-0 lg:[clip-path:none] lg:border-0 lg:border-b lg:border-hajar/15 lg:px-0 lg:py-6",
                    i === idx ? "bg-hajar text-palm lg:bg-transparent lg:text-hajar" : "border border-hajar/25 text-hajar/60 hover:text-hajar lg:border-x-0 lg:border-t-0"
                  )}
                >
                  <span className="flex items-baseline gap-4">
                    <span className={cn("hidden font-head text-[0.8rem] font-bold lg:inline", i === idx ? "text-bronze-soft" : "text-hajar/40")}>{isAr ? `٠${["١", "٢", "٣", "٤"][i]}` : `0${i + 1}`}</span>
                    <span className="whitespace-nowrap font-head text-[0.92rem] font-extrabold lg:whitespace-normal lg:text-[1.35rem]">{tx(k.name)}</span>
                  </span>
                  <span className="mt-1 hidden ps-9 text-[0.82rem] text-hajar/55 lg:block">
                    {tx(k.duration)} · {tx(k.visits)}
                  </span>
                  <span className={cn("absolute bottom-[-1px] start-0 hidden h-[2px] bg-bronze-soft transition-all duration-700 lg:block", i === idx ? "w-full" : "w-0")} />
                </button>
              ))}
            </div>
          </div>

          {/* المنصّة */}
          <div className="min-w-0 lg:col-span-9">
            <div ref={stageRef} key={c.id} className="pop">
              {/* PROMPT (قبل): {c.before.prompt} — PROMPT (بعد): {c.after.prompt} — موجودة في مصفوفة CASES أعلاه */}
              <div className="relative">
                <div dir="ltr" className="cham-lg relative aspect-[5/4] select-none overflow-hidden bg-palm-deep sm:aspect-[800/520]">
                  <div className="absolute inset-0">
                    <Pane side={c.after} />
                  </div>
                  <div className={cn("absolute inset-0", anim && "transition-[clip-path] duration-700 ease-[cubic-bezier(.6,0,.2,1)]")} style={{ clipPath: clip }}>
                    <Pane side={c.before} />
                  </div>
                  {lblBefore}
                  {lblAfter}

                  {/* المقبض */}
                  <div
                    className={cn("pointer-events-none absolute inset-y-0 z-20 w-0.5 -translate-x-1/2 bg-hajar shadow-[0_0_24px_rgba(0,0,0,.4)]", anim && "transition-[left] duration-700 ease-[cubic-bezier(.6,0,.2,1)]")}
                    style={{ left: handleLeft }}
                  >
                    <div className="absolute start-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 rotate-45 place-items-center bg-bronze text-hajar">
                      <span className="-rotate-45 text-[0.7rem] font-bold tracking-widest">‹ ›</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.5}
                    value={pos}
                    onChange={(e) => {
                      clear();
                      setAnim(false);
                      setPos(Number(e.target.value));
                    }}
                    aria-label={tx({ ar: "اسحب للمقارنة بين قبل وبعد", en: "Drag to compare before and after" })}
                    className="absolute inset-0 z-30 h-full w-full cursor-ew-resize opacity-0"
                    style={{ touchAction: "pan-y" }}
                  />
                </div>
              </div>

              {/* أزرار القفز + وصف الإجراء */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2">
                  <button onClick={() => snap("before")} className="cham min-h-[46px] border border-hajar/35 px-6 font-head text-[0.82rem] font-bold hover:bg-hajar hover:text-palm">
                    {tx({ ar: "قبل", en: "Before" })}
                  </button>
                  <button onClick={() => snap("after")} className="cham min-h-[46px] bg-bronze px-6 font-head text-[0.82rem] font-bold hover:bg-hajar hover:text-palm">
                    {tx({ ar: "بعد", en: "After" })}
                  </button>
                  <button onClick={hint} className="min-h-[46px] px-3 font-head text-[0.78rem] font-bold text-hajar/60 underline underline-offset-8 hover:text-hajar">
                    {tx({ ar: "أعد العرض", en: "Replay" })}
                  </button>
                </div>
                <dl className="flex flex-wrap gap-x-8 gap-y-2 text-[0.85rem]">
                  <div>
                    <dt className="text-hajar/50">{tx({ ar: "الإجراء", en: "Procedure" })}</dt>
                    <dd className="font-bold">{tx(c.procedure)}</dd>
                  </div>
                  <div>
                    <dt className="text-hajar/50">{tx({ ar: "مدة العلاج", en: "Duration" })}</dt>
                    <dd className="font-bold">{tx(c.duration)}</dd>
                  </div>
                  <div>
                    <dt className="text-hajar/50">{tx({ ar: "الزيارات", en: "Visits" })}</dt>
                    <dd className="font-bold">{tx(c.visits)}</dd>
                  </div>
                </dl>
              </div>

              {/* المشكلة / النتيجة — منظّمان بجوار المقارنة */}
              <div className="mt-10 grid gap-8 border-t border-hajar/15 pt-8 md:grid-cols-2 md:gap-12">
                <div>
                  <h3 className="mb-4 font-head text-[0.85rem] font-bold text-sand">{tx({ ar: "قبل — ما جاء به المريض", en: "Before — what the patient came with" })}</h3>
                  <ul className="space-y-3">
                    {c.problems.map((p, i) => (
                      <li key={i} className="flex gap-3 text-hajar/80">
                        <span className="mt-[0.85em] h-px w-4 shrink-0 bg-hajar/50" />
                        {tx(p)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-4 font-head text-[0.85rem] font-bold text-bronze-soft">{tx({ ar: "بعد — ما خرج به", en: "After — what they left with" })}</h3>
                  <ul className="space-y-3">
                    {c.results.map((p, i) => (
                      <li key={i} className="flex gap-3 font-bold">
                        <Check className="mt-1.5 h-4 w-4 shrink-0 text-bronze-soft" />
                        {tx(p)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Btn onClick={() => open({ service: c.service })}>{tx({ ar: "أريد نتيجة مثل هذه", en: "I want a result like this" })}</Btn>
                <p className="max-w-md text-[0.78rem] text-hajar/50">
                  {tx({
                    ar: "رسوم توضيحية للنموذج الأولي، تُستبدل بصور مرضانا بعد موافقتهم الخطية. النتائج تختلف من حالة لأخرى.",
                    en: "Illustrative renderings for this prototype, replaced with patient photos after written consent. Results vary.",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
