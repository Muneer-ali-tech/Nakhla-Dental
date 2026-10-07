import { useLang } from "../lib/i18n";
import { Count, Eyebrow, Reveal } from "../lib/ui";
import type { ReactNode } from "react";

/* ============================================================
   ٣) مؤشرات الثقة والإنجازات
   بدل أربع خانات أرقام مكرّرة: «جملة واحدة» تُقرأ كبيان،
   وأرقامها تعدّ أمام العين. ثم شريط اعتمادات بحافة شرفات نجدية.
   ============================================================ */
const N = (to: number, dec = 0, suffix = "") => (
  <Count to={to} dec={dec} suffix={suffix} className="mx-1 inline-block border-b-[3px] border-bronze/40 font-black text-bronze" />
);

const SENTENCE: Record<"ar" | "en", ReactNode[]> = {
  ar: [
    "على مدى ",
    N(12),
    " عاماً رافقنا ",
    N(38000),
    " مريض في رحلتهم، وصمّمنا ",
    N(12400),
    " ابتسامة، وزرعنا ",
    N(6800),
    " زرعة بنسبة نجاح ",
    N(98.6, 1, "٪"),
    " — في ",
    N(3),
    " فروع بين المدينة المنورة وحائل.",
  ],
  en: [
    "For ",
    N(12),
    " years we've walked beside ",
    N(38000),
    " patients, designed ",
    N(12400),
    " smiles and placed ",
    N(6800),
    " implants at a ",
    N(98.6, 1, "%"),
    " success rate — across ",
    N(3),
    " branches between Madinah and Ha'il.",
  ],
};

const BADGES = [
  { ar: "مرخّصة من وزارة الصحة", en: "Licensed by the Ministry of Health" },
  { ar: "معتمدة من سباهي (CBAHI)", en: "CBAHI accredited" },
  { ar: "أطباء مسجّلون في الهيئة السعودية للتخصصات الصحية", en: "SCFHS-registered specialists" },
  { ar: "تعقيم بمعيار دولي", en: "International sterilization standard" },
  { ar: "ضمان مكتوب على كل علاج", en: "Written guarantee on every treatment" },
  { ar: "تقسيط بدون فوائد", en: "Interest-free instalments" },
];

export function Trust() {
  const { tx, lang } = useLang();
  return (
    <section id="trust" className="relative pt-20 lg:pt-28">
      <div className="wrap">
        <Reveal>
          <Eyebrow n="01">{tx({ ar: "بالأرقام، لا بالوعود", en: "In numbers, not promises" })}</Eyebrow>
        </Reveal>
        <Reveal delay={120}>
          <p
            key={lang}
            className="mt-8 max-w-[1180px] font-head font-bold text-ink"
            style={{ fontSize: "clamp(1.55rem, 4.7vw, 3.55rem)", lineHeight: lang === "ar" ? 1.85 : 1.35, letterSpacing: lang === "en" ? "-0.02em" : 0 }}
          >
            {SENTENCE[lang].map((s, i) => (
              <span key={i}>{s}</span>
            ))}
          </p>
        </Reveal>
      </div>

      {/* شريط الاعتمادات بحافة شرفات */}
      <div className="relative mt-20 lg:mt-28">
        <div className="najdi-top" style={{ ["--c" as string]: "#1F3D2B" }} />
        <div className="on-dark overflow-hidden bg-palm py-6 text-hajar" dir="ltr">
          <div className="marquee-track">
            {[0, 1].map((k) => (
              <ul key={k} className="flex shrink-0 items-center" aria-hidden={k === 1}>
                {BADGES.map((b, i) => (
                  <li key={i} dir={lang === "ar" ? "rtl" : "ltr"} className="flex items-center gap-8 ps-8 font-head text-[0.92rem] font-bold">
                    <span className="whitespace-nowrap">{tx(b)}</span>
                    <span className="h-2 w-2 rotate-45 bg-bronze-soft" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
