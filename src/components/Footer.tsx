import { useLang } from "../lib/i18n";
import { BRANCHES, MAIN_PHONE } from "../lib/data";
import { Logo, LangToggle, NAV } from "./Header";
import { Arrow, WhatsApp } from "./Icons";

/* ============================================================
   ١٧) الفوتر
   المتوقّع: أربعة أعمدة روابط على خلفية داكنة. المختار: أعمدة
   هادئة فوق كلمة «نخلة» عملاقة مفرّغة تُقصّ من أسفل الصفحة،
   كأنها نقش على جدار الحجر.
   ============================================================ */
export function Footer() {
  const { tx } = useLang();
  return (
    <footer className="on-dark grain-l relative overflow-hidden bg-palm-deep text-hajar">
      <div className="wrap relative z-10 pb-52 pt-16 sm:pb-64 lg:pt-24">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo dark />
            <p className="mt-6 max-w-sm text-hajar/70">{tx({ ar: "عيادات أسنان فاخرة في المدينة المنورة وحائل. ابتسامة تُصمَّم بصبر، وتُسلَّم بضمان مكتوب.", en: "Premium dental clinics in Madinah and Ha'il. Smiles designed with patience and delivered with a written guarantee." })}</p>
            <div className="mt-6">
              <LangToggle dark />
            </div>
          </div>

          <div className="lg:col-span-3">
            <h4 className="track mb-5 font-head text-[0.75rem] font-bold text-sand">{tx({ ar: "الفروع", en: "Branches" })}</h4>
            <ul className="space-y-4">
              {BRANCHES.map((b) => (
                <li key={b.id}>
                  <div className="font-head font-extrabold">{tx(b.name)}</div>
                  <a href={`tel:${b.phone.replace(/\s/g, "")}`} dir="ltr" className="text-[0.9rem] text-hajar/70 hover:text-hajar" style={{ display: "inline-block" }}>
                    {b.phone}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="track mb-5 font-head text-[0.75rem] font-bold text-sand">{tx({ ar: "روابط", en: "Explore" })}</h4>
            <ul>
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="inline-flex min-h-[44px] items-center text-hajar/75 hover:text-hajar">
                    {tx(n.l)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="track mb-5 font-head text-[0.75rem] font-bold text-sand">{tx({ ar: "تواصل", en: "Connect" })}</h4>
            <a href={`tel:${MAIN_PHONE.replace(/\s/g, "")}`} dir="ltr" className="block font-head text-[1.5rem] font-black" style={{ textAlign: "start" }}>
              {MAIN_PHONE}
            </a>
            <div className="mt-4 flex flex-wrap gap-x-5 text-hajar/75">
              {["Instagram", "Snapchat", "X", "TikTok"].map((s) => (
                <a key={s} href="#" className="inline-flex min-h-[44px] items-center hover:text-hajar" dir="ltr">
                  {s}
                </a>
              ))}
            </div>
            <a href="#top" className="cham mt-6 inline-flex min-h-[48px] items-center gap-3 border border-hajar/30 px-6 font-head text-[0.82rem] font-bold hover:bg-hajar hover:text-palm">
              <Arrow className="h-4 w-4 -rotate-90 rtl:rotate-90" />
              {tx({ ar: "العودة للأعلى", en: "Back to top" })}
            </a>
          </div>
        </div>

        <div className="mt-16 space-y-5 border-t border-hajar/15 pt-6 text-[0.8rem] text-hajar/55">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <span>{tx({ ar: "© ٢٠٢٦ عيادات نخلة لطب الأسنان. جميع الحقوق محفوظة.", en: "© 2026 Nakhla Dental Clinics. All rights reserved." })}</span>
            <span>{tx({ ar: "منشأة مرخّصة من وزارة الصحة — ترخيص رقم ٠٠٠٠٠٠", en: "Licensed by the Ministry of Health — licence no. 000000" })}</span>
          </div>
          <p className="text-center font-head text-[0.88rem] font-bold text-sand">
            {tx({ ar: "موقع نموذجي لعيادة افتراضية", en: "A demo website for a virtual clinic" })}
          </p>
          <p className="text-center">
            {tx({ ar: "تم تصميم هذا الموقع من قبل", en: "This website was designed by" })}{" "}
            <a
              href="https://wa.me/967771491931"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 font-head text-[0.92rem] font-bold text-sand transition-colors hover:text-hajar"
            >
              <WhatsApp className="h-4 w-4" />
              {tx({ ar: "منير علي", en: "Muneer Ali" })}
            </a>
          </p>
        </div>
      </div>

      {/* الكلمة العملاقة المنقوشة */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[-0.18em] select-none text-center font-head font-black leading-none text-transparent" style={{ fontSize: "clamp(9rem, 34vw, 30rem)", WebkitTextStroke: "1.5px rgba(200,183,154,.28)" }} aria-hidden>
        {tx({ ar: "نخلة", en: "Nakhla" })}
      </div>
    </footer>
  );
}
