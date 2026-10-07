import { useState } from "react";
import { useLang, type Bi } from "../lib/i18n";
import { Btn, Eyebrow, Reveal, Words } from "../lib/ui";
import { SpecIcons, Check } from "./Icons";
import { PalmShadow } from "./Palm";
import { useBooking } from "./Booking";
import { cn } from "../utils/cn";

/* ============================================================
   ٥) التخصصات السبعة
   المتوقّع: شبكة بطاقات بأيقونات. البديل المرفوض: قائمة منسدلة مكرّرة.
   المختار: «دليل نجدي» — فهرس طباعي ضخم + لوح تفصيلي ثابت (Sticky)
   تُرسم أيقونته الخطية أمام العين عند كل اختيار.
   الجوال: الفهرس نفسه يتحول إلى أكورديون سلس مع اللوح داخل الصف.
   ============================================================ */
type Spec = {
  id: string;
  name: Bi;
  tag: Bi;
  desc: Bi;
  inc: Bi[];
  dur: Bi;
  from: Bi;
};

const SPECS: Spec[] = [
  {
    id: "implant",
    name: { ar: "زراعة الأسنان", en: "Dental Implants" },
    tag: { ar: "سنٌّ جديد يشبه سنّك تماماً", en: "A new tooth, indistinguishable from yours" },
    desc: {
      ar: "نخطّط الزراعة رقمياً على أشعة ثلاثية الأبعاد قبل أن نلمس الفم، فتأتي الزرعة في موضعها الدقيق، بألمٍ أقل والتئامٍ أسرع.",
      en: "We plan every implant digitally on a 3D scan before we touch the mouth — so it lands exactly where it should, with less discomfort and faster healing.",
    },
    inc: [
      { ar: "تخطيط رقمي بأشعة CBCT", en: "Digital planning on CBCT" },
      { ar: "جراحة موجَّهة بدليل مطبوع", en: "Guided surgery with a printed guide" },
      { ar: "ضمان مكتوب على الزرعة والتاج", en: "Written guarantee on implant and crown" },
    ],
    dur: { ar: "٣ – ٦ أشهر", en: "3–6 months" },
    from: { ar: "3,500 ر.س", en: "SAR 3,500" },
  },
  {
    id: "ortho",
    name: { ar: "التقويم", en: "Orthodontics" },
    tag: { ar: "ابتسامة منتظمة، بلا أسلاك ظاهرة", en: "An even smile, no visible wires" },
    desc: {
      ar: "تقويم شفاف ومعدني وخزفي بحسب حالتك وعمرك. نريك محاكاة رقمية لشكل أسنانك النهائي منذ الزيارة الأولى.",
      en: "Clear, metal or ceramic — chosen for your case and age. From the first visit we show you a digital simulation of your finished smile.",
    },
    inc: [
      { ar: "محاكاة ثلاثية الأبعاد للنتيجة", en: "3D simulation of the result" },
      { ar: "تقويم شفاف للبالغين والمراهقين", en: "Clear aligners for adults and teens" },
      { ar: "مثبّتات مجانية بعد انتهاء العلاج", en: "Free retainers after treatment" },
    ],
    dur: { ar: "٦ – ٢٤ شهراً", en: "6–24 months" },
    from: { ar: "6,900 ر.س", en: "SAR 6,900" },
  },
  {
    id: "cosmetic",
    name: { ar: "تجميل الأسنان والابتسامة", en: "Cosmetic & Smile Design" },
    tag: { ar: "ابتسامة تُشبهك أنت، لا نموذجاً جاهزاً", en: "A smile that looks like you, not a template" },
    desc: {
      ar: "نصمّم الابتسامة على وجهك أنت: نسب الأسنان، لونها، وخطّ الشفة. ثم نجرّبها عليك مؤقتاً قبل أي تحضير نهائي.",
      en: "We design the smile around your face — proportions, shade, lip line — and let you try it on temporarily before any final preparation.",
    },
    inc: [
      { ar: "تصميم الابتسامة الرقمي (DSD)", en: "Digital Smile Design (DSD)" },
      { ar: "قشور خزفية رقيقة جداً", en: "Ultra-thin porcelain veneers" },
      { ar: "تبييض بالضوء البارد", en: "Cold-light whitening" },
    ],
    dur: { ar: "٧ – ١٤ يوماً", en: "7–14 days" },
    from: { ar: "1,200 ر.س", en: "SAR 1,200" },
  },
  {
    id: "endo",
    name: { ar: "علاج العصب", en: "Root Canal Therapy" },
    tag: { ar: "إنقاذ سنّك بجلسة هادئة", en: "Save your tooth in one calm session" },
    desc: {
      ar: "بالمجهر الجراحي نرى ما لا يُرى بالعين، فنعالج القنوات بدقة ونُنهي الألم من أول جلسة في أغلب الحالات.",
      en: "Under a surgical microscope we see what the eye can't — treating the canals precisely and ending the pain in the first session for most cases.",
    },
    inc: [
      { ar: "مجهر جراحي في كل فرع", en: "Surgical microscope in every branch" },
      { ar: "تخدير موضعي حديث بلا وخز", en: "Modern, needle-gentle anaesthesia" },
      { ar: "جلسة واحدة في أغلب الحالات", en: "A single session in most cases" },
    ],
    dur: { ar: "جلسة – ٣ جلسات", en: "1–3 sessions" },
    from: { ar: "900 ر.س", en: "SAR 900" },
  },
  {
    id: "kids",
    name: { ar: "طب أسنان الأطفال", en: "Pediatric Dentistry" },
    tag: { ar: "أول زيارة يحبّها طفلك", en: "A first visit your child will love" },
    desc: {
      ar: "غرفة مصمّمة للصغار، وطبيبة تتحدّث بلغتهم. نبني علاقة صداقة مع الكرسي قبل أن نبدأ أي علاج.",
      en: "A room designed for small people and a dentist who speaks their language. We make friends with the chair before any treatment begins.",
    },
    inc: [
      { ar: "زيارة تعارف بلا علاج", en: "A no-treatment meet-and-greet visit" },
      { ar: "سدّادات وقائية وفلورايد", en: "Protective sealants and fluoride" },
      { ar: "خيار التخدير الواعي للحالات الخاصة", en: "Conscious sedation for special cases" },
    ],
    dur: { ar: "٣٠ – ٤٥ دقيقة", en: "30–45 minutes" },
    from: { ar: "250 ر.س", en: "SAR 250" },
  },
  {
    id: "gums",
    name: { ar: "علاج اللثة", en: "Periodontics" },
    tag: { ar: "أساسٌ سليم لكل ابتسامة", en: "A healthy foundation for every smile" },
    desc: {
      ar: "نزيف اللثة ليس أمراً عادياً. نشخّص مبكراً، وننظّف بعمق بالليزر، ونعلّمك كيف تحافظ على لثتك سنوات.",
      en: "Bleeding gums are never normal. We diagnose early, clean deeply with laser, and teach you how to keep your gums healthy for years.",
    },
    inc: [
      { ar: "تنظيف عميق بالليزر", en: "Deep laser cleaning" },
      { ar: "تجميل اللثة وتصحيح الابتسامة اللثوية", en: "Gum contouring and gummy-smile correction" },
      { ar: "برنامج متابعة كل ٦ أشهر", en: "A six-monthly care programme" },
    ],
    dur: { ar: "٢ – ٤ زيارات", en: "2–4 visits" },
    from: { ar: "450 ر.س", en: "SAR 450" },
  },
  {
    id: "crown",
    name: { ar: "التركيبات والتيجان", en: "Crowns & Prosthetics" },
    tag: { ar: "قوة تدوم، ومظهر لا يُكتشف", en: "Strength that lasts, a look no one detects" },
    desc: {
      ar: "تيجان وجسور من الزركونيا والخزف تُصنع من مسح رقمي دقيق، فتأتي مطابقة للفكّ من أول تجربة بلا قوالب مزعجة.",
      en: "Zirconia and ceramic crowns and bridges made from a precise digital scan — fitting from the first try, with no messy impressions.",
    },
    inc: [
      { ar: "مسح رقمي بدل القوالب", en: "Digital scan instead of impressions" },
      { ar: "تاج في يوم واحد لبعض الحالات", en: "Same-day crowns for selected cases" },
      { ar: "ضمان مكتوب حتى ١٠ سنوات", en: "Written guarantee of up to 10 years" },
    ],
    dur: { ar: "٣ – ٧ أيام", en: "3–7 days" },
    from: { ar: "1,100 ر.س", en: "SAR 1,100" },
  },
];

function Detail({ s, dark, compact }: { s: Spec; dark?: boolean; compact?: boolean }) {
  const { tx } = useLang();
  const { open } = useBooking();
  const Icon = SpecIcons[s.id];
  return (
    <div key={s.id} className="pop">
      <div className={cn("draw-icon", compact ? "mb-5 h-20 w-20" : "mb-8 h-36 w-36", dark ? "text-sand" : "text-bronze")}>{Icon({ className: "h-full w-full", strokeWidth: 1.1 })}</div>
      <p className={cn(dark ? "text-hajar/85" : "text-ink/80", "t-lead")}>{tx(s.desc)}</p>
      <ul className="mt-6 space-y-3">
        {s.inc.map((i, k) => (
          <li key={k} className="flex gap-3 font-bold">
            <Check className={cn("mt-1.5 h-4 w-4 shrink-0", dark ? "text-bronze-soft" : "text-bronze")} />
            {tx(i)}
          </li>
        ))}
      </ul>
      <div className={cn("mt-8 grid grid-cols-2 gap-6 border-t pt-6", dark ? "border-hajar/20" : "border-ink/15")}>
        <div>
          <div className={cn("text-[0.8rem]", dark ? "text-hajar/55" : "text-ink/55")}>{tx({ ar: "المدة المعتادة", en: "Typical duration" })}</div>
          <div className="font-head text-[1.05rem] font-extrabold">{tx(s.dur)}</div>
        </div>
        <div>
          <div className={cn("text-[0.8rem]", dark ? "text-hajar/55" : "text-ink/55")}>{tx({ ar: "تبدأ من", en: "Starting from" })}</div>
          <div className={cn("font-head text-[1.05rem] font-extrabold", dark ? "text-bronze-soft" : "text-bronze")}>{tx(s.from)}</div>
        </div>
      </div>
      <Btn variant={dark ? "bronze" : "palm"} onClick={() => open({ service: s.id })} className="mt-8 w-full sm:w-auto">
        {tx({ ar: "احجز هذه الخدمة", en: "Book this service" })}
      </Btn>
    </div>
  );
}

export function Specialties() {
  const { tx, isAr } = useLang();
  const [a, setA] = useState(0);
  const cur = SPECS[a];
  const nums = ["١", "٢", "٣", "٤", "٥", "٦", "٧"];

  return (
    <section id="specialties" className="sec">
      <div className="wrap">
        <Reveal>
          <Eyebrow n="03">{tx({ ar: "سبعة تخصصات، سقف واحد", en: "Seven specialties, one roof" })}</Eyebrow>
        </Reveal>
        <h2 className="t-h2 mt-6 max-w-3xl">
          <Words text={tx({ ar: "كل ما تحتاجه ابتسامتك، دون أن تنتقل بين العيادات.", en: "Everything your smile needs, without moving between clinics." })} />
        </h2>

        <div className="mt-12 grid gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-16">
          {/* الفهرس */}
          <ol className="lg:col-span-7">
            {SPECS.map((s, i) => {
              const on = i === a;
              return (
                <li key={s.id} className="border-b border-sand">
                  <button
                    onClick={() => setA(i)}
                    aria-expanded={on}
                    className="group flex w-full items-center gap-4 py-5 text-start sm:gap-7 sm:py-7"
                  >
                    <span className={cn("w-8 shrink-0 font-head text-[0.85rem] font-bold transition-colors", on ? "text-bronze" : "text-ink/35")}>
                      {isAr ? `٠${nums[i]}` : `0${i + 1}`}
                    </span>
                    <span className="flex-1">
                      <span
                        className={cn("block font-head font-extrabold transition-all duration-500", on ? "text-palm" : "text-ink/45 group-hover:text-ink/80")}
                        style={{ fontSize: "clamp(1.4rem, 3.7vw, 2.7rem)", lineHeight: 1.35, transform: on ? "translateX(0)" : undefined }}
                      >
                        {tx(s.name)}
                      </span>
                      <span className={cn("mt-1 block text-[0.92rem] transition-all duration-500", on ? "max-h-10 text-bronze opacity-100" : "max-h-0 opacity-0")}>{tx(s.tag)}</span>
                    </span>
                    <span className={cn("grid h-11 w-11 shrink-0 place-items-center transition-all duration-500", on ? "rotate-[135deg] bg-bronze text-hajar" : "border border-ink/25")}>
                      <span className="relative block h-3 w-3">
                        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
                        <span className="absolute inset-y-0 start-1/2 w-px -translate-x-1/2 bg-current" />
                      </span>
                    </span>
                  </button>
                  {/* الجوال: تفصيل داخل الصف */}
                  <div className={cn("grid transition-[grid-template-rows] duration-700 ease-[cubic-bezier(.2,.8,.2,1)] lg:hidden", on ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <div className="overflow-hidden">
                      <div className="pb-8 ps-12">{on && <Detail s={s} compact />}</div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* لوح التفصيل (سطح المكتب) */}
          <aside className="hidden lg:col-span-5 lg:block">
            <div className="sticky top-28">
              <div className="najdi-top" style={{ ["--c" as string]: "#1F3D2B" }} />
              <div className="on-dark grain-l relative overflow-hidden bg-palm p-10 text-hajar">
                <div className="pointer-events-none absolute inset-0 text-hajar" style={{ opacity: 0.06 }}>
                  <PalmShadow variant="a" className="-end-20 -top-24 h-[520px] w-[520px] max-w-none" blur={1.5} />
                </div>
                <div className="relative">
                  <div className="track mb-2 font-head text-[0.75rem] font-bold text-sand">{tx(cur.tag)}</div>
                  <h3 className="t-h3 mb-8 !text-[1.9rem]">{tx(cur.name)}</h3>
                  <Detail s={cur} dark />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
