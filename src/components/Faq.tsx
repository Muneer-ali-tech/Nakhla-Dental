import { useEffect, useRef, useState } from "react";
import { useLang, type Bi } from "../lib/i18n";
import { Eyebrow, Reveal, Words } from "../lib/ui";
import { Chat, LogoMark } from "./Icons";
import { cn } from "../utils/cn";

/* ============================================================
   ١٥) الأسئلة الشائعة
   المتوقّع: أكورديون أبيض بعلامة +. المختار: «محادثة» — السؤال
   فقاعة المريض، والجواب فقاعة العيادة تسبقها نقاط كتابة قصيرة.
   يخلق ألفة ويحاكي الواتساب الذي يعيش فيه المريض السعودي.
   ============================================================ */
const FAQS: { q: Bi; a: Bi }[] = [
  { q: { ar: "هل الاستشارة الأولى مجانية فعلاً؟", en: "Is the first consultation really free?" }, a: { ar: "نعم. الفحص والأشعة البانورامية وخطة العلاج المكتوبة بلا مقابل، ولا يُطلب منك أي التزام أو قرار في نفس اليوم.", en: "Yes. The exam, panoramic X-ray and written treatment plan cost nothing, and you're never asked for a commitment or a same-day decision." } },
  { q: { ar: "هل زراعة الأسنان مؤلمة؟", en: "Is a dental implant painful?" }, a: { ar: "تتم الزراعة تحت تخدير موضعي، ويصف أغلب مرضانا ما بعدها بأنه أخف من خلع ضرس. نصرف لك مسكّناً مناسباً ونتصل بك في الليلة نفسها لنطمئن عليك.", en: "Implants are placed under local anaesthesia, and most patients describe the aftermath as milder than a tooth extraction. We prescribe suitable pain relief and call you that same evening." } },
  { q: { ar: "كم تستغرق رحلة الزراعة كاملة؟", en: "How long does the full implant journey take?" }, a: { ar: "من ٣ إلى ٦ أشهر في الغالب، وبعض الحالات تُنجز في زيارة واحدة. نحدد لك الجدول بدقة في خطتك المكتوبة.", en: "Usually 3 to 6 months, and some cases are completed in a single visit. Your written plan sets the schedule precisely." } },
  { q: { ar: "هل تقبلون التأمين الطبي؟", en: "Do you accept medical insurance?" }, a: { ar: "نعم، نتعامل مع أغلب شركات التأمين الكبرى. نتحقق من وثيقتك قبل موعدك بيوم عمل حتى تعرف ما تغطيه بالضبط.", en: "Yes — we work with most major insurers. We verify your policy one working day before your visit so you know exactly what is covered." } },
  { q: { ar: "ابني يخاف من طبيب الأسنان، هل أنتم مناسبون؟", en: "My child is afraid of the dentist — are you a good fit?" }, a: { ar: "هذا بالضبط ما نبرع فيه. نبدأ بزيارة تعارف بلا علاج، وطبيبتنا تتحدث بلغة الصغار. ولدينا خيار التخدير الواعي للحالات الخاصة.", en: "That's exactly what we do best. We begin with a no-treatment meet-and-greet and our pediatric dentist speaks the language of little ones. Conscious sedation is available for special cases." } },
  { q: { ar: "ماذا لو لم أرضَ عن النتيجة؟", en: "What if I'm not happy with the result?" }, a: { ar: "لديك ضمان مكتوب بمدة وشروط واضحة. وإن لم تتحقق النتيجة المتفق عليها في خطتك، نعالجها على حسابنا أو نردّ لك المبلغ وفق الضمان.", en: "You have a written guarantee with a clear term and conditions. If the result agreed in your plan isn't achieved, we correct it at our cost or refund per the guarantee." } },
  { q: { ar: "أعالج في فرع وأتابع في فرع آخر، هل ممكن؟", en: "Can I be treated at one branch and followed up at another?" }, a: { ar: "بكل سهولة. ملفك وأشعتك ومحاكاتك الرقمية موحّدة بين الفروع الثلاثة، فتجد طبيبك ومعلوماتك أينما ذهبت.", en: "Easily. Your file, X-rays and digital simulations are unified across all three branches, so your doctor and information follow you wherever you go." } },
];

export function Faq() {
  const { tx, isAr } = useLang();
  const [o, setO] = useState<number | null>(0);
  const [typing, setTyping] = useState(false);
  const t = useRef<number>(0);

  useEffect(() => () => clearTimeout(t.current), []);
  const pick = (i: number) => {
    clearTimeout(t.current);
    if (o === i) return setO(null);
    setO(i);
    setTyping(true);
    t.current = window.setTimeout(() => setTyping(false), 750);
  };

  return (
    <section id="faq" className="sec bg-sand/40">
      <div className="wrap grid gap-12 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <Eyebrow n="13">{tx({ ar: "الأسئلة الشائعة", en: "Frequently asked" })}</Eyebrow>
            </Reveal>
            <h2 className="t-h2 mt-6">
              <Words text={tx({ ar: "أسئلةٌ يسألها كل مريض، وأجوبة بلا التفاف.", en: "Questions every patient asks, answered without detours." })} />
            </h2>
            <Reveal delay={150}>
              <div className="cham-lg on-dark mt-10 bg-palm p-6 text-hajar">
                <Chat className="h-7 w-7 text-bronze-soft" />
                <p className="mt-3 font-head font-extrabold">{tx({ ar: "لم تجد سؤالك؟", en: "Didn't find yours?" })}</p>
                <p className="mt-1 text-[0.9rem] text-hajar/75">{tx({ ar: "اسأل مساعد نخلة الآن، يجيبك في ثوانٍ.", en: "Ask the Nakhla assistant — it answers in seconds." })}</p>
                <button onClick={() => window.dispatchEvent(new Event("nakhla:chat"))} className="cham mt-4 min-h-[48px] bg-bronze px-6 font-head text-[0.85rem] font-bold hover:bg-hajar hover:text-palm">
                  {tx({ ar: "ابدأ المحادثة", en: "Start chatting" })}
                </button>
              </div>
            </Reveal>
          </div>
        </div>

        <ul className="space-y-4 lg:col-span-8">
          {FAQS.map((f, i) => {
            const on = o === i;
            return (
              <li key={i}>
                {/* فقاعة المريض */}
                <button
                  onClick={() => pick(i)}
                  aria-expanded={on}
                  className={cn("cham flex min-h-[60px] w-full max-w-[92%] items-center gap-4 px-5 py-4 text-start font-head text-[0.95rem] font-bold transition-colors sm:max-w-[80%] sm:px-6 sm:text-[1.05rem]", on ? "bg-bronze text-hajar" : "bg-hajar-soft text-ink hover:bg-hajar")}
                >
                  <span className="shrink-0 text-[0.75rem] opacity-60">{isAr ? `٠${["١", "٢", "٣", "٤", "٥", "٦", "٧"][i]}` : `0${i + 1}`}</span>
                  {tx(f.q)}
                </button>

                {/* فقاعة العيادة */}
                <div className={cn("grid transition-[grid-template-rows] duration-500", on ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden">
                    <div className="flex justify-end gap-3 pt-3">
                      <div className="max-w-[94%] sm:max-w-[84%]">
                        <div className="cham on-dark bg-palm px-5 py-4 text-hajar sm:px-6 sm:py-5" style={{ lineHeight: isAr ? 1.95 : 1.65 }}>
                          {on && typing ? (
                            <span className="dot-typing inline-flex h-6 items-center text-hajar/70">
                              <span />
                              <span />
                              <span />
                            </span>
                          ) : (
                            <span className="pop block">{tx(f.a)}</span>
                          )}
                        </div>
                      </div>
                      <LogoMark className="mt-auto hidden h-9 w-9 shrink-0 text-palm sm:block" style={{ ["--logo-in" as string]: "#EAE3D6" }} />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
