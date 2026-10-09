import { useEffect, useRef, useState } from "react";
import { useLang, type Bi } from "../lib/i18n";
import { Eyebrow, Reveal, Words, useScrollProgress } from "../lib/ui";
import { cn } from "../utils/cn";

/* ============================================================
   ٩) رحلة المريض
   المتوقّع: خطوات ١-٢-٣-٤ في أيقونات متراصّة. المختار: «طريق القافلة» —
   مسار متعرّج يُرسم بالبرونز أثناء تمريرك، وتضيء محطاته الخمس
   الواحدة تلو الأخرى. على الجوال يتحول إلى خيط رأسي هادئ.
   ============================================================ */
const STEPS: { t: Bi; d: Bi; when: Bi }[] = [
  {
    t: { ar: "استشارة وتصوير رقمي", en: "Consultation & digital scan" },
    d: { ar: "٤٥ دقيقة نستمع فيها إليك ونفحصك ونصوّر أسنانك بمسح ثلاثي الأبعاد. بلا دفع وبلا التزام.", en: "Forty-five minutes of listening, examining and scanning your teeth in 3D. No payment, no obligation." },
    when: { ar: "اليوم الأول", en: "Day one" },
  },
  {
    t: { ar: "خطتك مكتوبة وسعرك ثابت", en: "Your plan, written. Your price, fixed." },
    d: { ar: "نريك محاكاة النتيجة، ونسلّمك الخطة والجدول والتكلفة مطبوعة، لتقرّر على مهلك.", en: "We show you a simulation of the result and hand you the plan, schedule and cost in print — so you decide at your own pace." },
    when: { ar: "خلال ٢٤ ساعة", en: "Within 24 hours" },
  },
  {
    t: { ar: "العلاج بيدٍ واحدة", en: "Treatment, by one pair of hands" },
    d: { ar: "يتولّى طبيبك المسؤول علاجك في زيارات قصيرة تُحدَّد على وقتك أنت، لا على وقت العيادة.", en: "Your responsible doctor treats you in short visits scheduled around your time, not the clinic's." },
    when: { ar: "حسب الخطة", en: "As planned" },
  },
  {
    t: { ar: "متابعتك على واتساب", en: "Follow-up on WhatsApp" },
    d: { ar: "بعد كل زيارة رسالة تطمئن عليك، وجوابٌ خلال ساعة عن أي سؤال، ليلاً أو نهاراً.", en: "After every visit, a message to check on you — and an answer within the hour to any question, day or night." },
    when: { ar: "بعد كل زيارة", en: "After each visit" },
  },
  {
    t: { ar: "ضمانٌ ومراجعة دورية", en: "Guarantee & regular reviews" },
    d: { ar: "وثيقة ضمان مكتوبة، وتذكير بمراجعتك كل ستة أشهر دون أن تطلب. رحلتك لا تنتهي عند الباب.", en: "A written guarantee and a reminder for your six-monthly review before you ask. Your journey doesn't end at the door." },
    when: { ar: "كل ٦ أشهر", en: "Every 6 months" },
  },
];

function buildPath(w: number, h: number) {
  const rowH = h / STEPS.length;
  const pts: [number, number][] = [[w / 2, 0]];
  STEPS.forEach((_, i) => pts.push([w / 2 + (i % 2 === 0 ? 1 : -1) * w * 0.035, rowH * (i + 0.5)]));
  pts.push([w / 2, h]);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const ym = (y0 + y1) / 2;
    d += ` C${x0} ${ym} ${x1} ${ym} ${x1} ${y1}`;
  }
  return { d, pts };
}

export function Journey() {
  const { tx, isAr } = useLang();
  const [ref, p] = useScrollProgress<HTMLDivElement>(0.62);
  const box = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [size, setSize] = useState({ w: 1000, h: 1200 });
  /* مواضع الماسات وأطوالها تُقاس من المسار المرسوم نفسه: لكل خطوة نبحث
     ثنائياً عن نقطة المسار التي يوافق ارتفاعها مركز كتلة الخطوة، فتجلس
     الماسة على الخط بدقة، وطولها L هو نفسه عتبة تفعيلها حتى يصل رأس
     الخط إليها في اللحظة نفسها التي تتلوّن فيها (مصدر واحد: p). */
  const [marks, setMarks] = useState<{ x: number; y: number; f: number; fm: number }[]>([]);
  const [md, setMd] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const u = () => setMd(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);
  useEffect(() => {
    const calc = () => {
      const el = box.current;
      const path = pathRef.current;
      if (!el || !path) return;
      const total = path.getTotalLength();
      const H = el.clientHeight;
      const next = [...el.querySelectorAll<HTMLElement>("ol > li")].map((li) => {
        const cy = li.offsetTop + li.offsetHeight / 2;
        let lo = 0;
        let hi = total;
        for (let k = 0; k < 24; k++) {
          const mid = (lo + hi) / 2;
          if (path.getPointAtLength(mid).y < cy) lo = mid;
          else hi = mid;
        }
        const pt = path.getPointAtLength((lo + hi) / 2);
        /* fm: عتبة الجوال على الخيط الرأسي (مركز نقطته) */
        return { x: pt.x, y: pt.y, f: (lo + hi) / 2 / total, fm: (li.offsetTop + 16) / H };
      });
      setMarks(next);
    };
    calc();
    const t = setTimeout(calc, 350);
    document.fonts?.ready.then(calc).catch(() => {});
    return () => clearTimeout(t);
  }, [size]);
  const { d } = buildPath(size.w, size.h);
  const nums = ["١", "٢", "٣", "٤", "٥"];
  const reached = (i: number) => !!marks[i] && p >= (md ? marks[i].f : marks[i].fm);

  return (
    <section id="journey" className="sec">
      <div className="wrap">
        <div className="max-w-3xl">
          <Reveal>
            <Eyebrow n="07">{tx({ ar: "رحلة المريض", en: "The patient journey" })}</Eyebrow>
          </Reveal>
          <h2 className="t-h2 mt-6">
            <Words text={tx({ ar: "من أول مكالمة إلى آخر ضحكة: طريق واضح، لا مفاجآت فيه.", en: "From the first call to the last laugh: a clear road with no surprises." })} />
          </h2>
        </div>

        <div ref={ref} className="mt-14 lg:mt-24">
          <div ref={box} className="relative">
            {/* المسار المتعرّج (شاشات متوسطة فأكبر) */}
            <svg className="pointer-events-none absolute inset-0 hidden h-full w-full md:block" width={size.w} height={size.h} aria-hidden>
              <path ref={pathRef} d={d} fill="none" stroke="#C8B79A" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" />
              <path d={d} fill="none" stroke="#8C5A2B" strokeWidth="3" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
              {/* ماسات المحطات: مرسومة داخل الـ SVG عند نقاط مقاسة من المسار */}
              {marks.map((m, i) => {
                const on = p >= m.f;
                return (
                  <g key={i} transform={`translate(${m.x} ${m.y}) rotate(45)`}>
                    <g className="journey-mark" style={{ transform: on ? "scale(1.1)" : "scale(1)" }}>
                      <rect x={-14} y={-14} width={28} height={28} strokeWidth={2} className={cn("transition-all duration-700", on ? "fill-bronze stroke-bronze" : "fill-hajar stroke-sand")} />
                    </g>
                  </g>
                );
              })}
            </svg>
            {/* الخيط الرأسي (جوال) */}
            <div className="absolute bottom-0 top-0 start-[9px] w-px bg-sand md:hidden">
              <div className="absolute inset-x-0 top-0 h-full origin-top bg-bronze" style={{ transform: `scaleY(${p})` }} />
            </div>

            <ol>
              {STEPS.map((s, i) => {
                const left = i % 2 === 0;
                const on = reached(i);
                return (
                  <li key={i} className="relative pb-14 ps-12 last:pb-0 md:flex md:h-[250px] md:items-center md:p-0">
                    {/* نقطة المحطة (جوال) */}
                    <span
                      className={cn("absolute start-0 top-1.5 z-10 grid h-5 w-5 place-items-center rotate-45 border-2 transition-all duration-700 md:hidden", on ? "border-bronze bg-bronze" : "border-sand bg-hajar")}
                    />
                    <div className={cn("md:w-1/2 transition-all duration-700", on ? "opacity-100" : "opacity-45", left ? "md:pe-20" : "md:ms-auto md:ps-20", isAr && "")}>
                      <div className="flex items-baseline gap-4">
                        <span className="font-head text-[3.4rem] font-black leading-none text-transparent md:text-[4.6rem]" style={{ WebkitTextStroke: "1.5px #8C5A2B" }}>
                          {isAr ? nums[i] : i + 1}
                        </span>
                        <span className="track font-head text-[0.72rem] font-bold text-bronze">{tx(s.when)}</span>
                      </div>
                      <h3 className="t-h3 mt-2 text-palm">{tx(s.t)}</h3>
                      <p className="mt-2 max-w-md text-ink/75">{tx(s.d)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
