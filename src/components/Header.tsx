import { useEffect, useState } from "react";
import { useLang } from "../lib/i18n";
import { useBooking } from "./Booking";
import { Close, LogoMark, Menu, Phone, WhatsApp } from "./Icons";
import { cn } from "../utils/cn";
import { MAIN_PHONE, WA_NUMBER } from "../lib/data";

/* ============================================================
   ١) الهيدر والتنقل
   شعار + قائمة + حجز سريع + زر لغة AR | EN بمقبض منزلق
   ============================================================ */
export function LangToggle({ dark, className }: { dark?: boolean; className?: string }) {
  const { lang, toggle, tx } = useLang();
  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={lang === "en"}
      aria-label={tx({ ar: "تبديل اللغة إلى الإنجليزية", en: "Switch language to Arabic" })}
      dir="ltr"
      className={cn(
        "cham relative grid h-11 w-[92px] shrink-0 grid-cols-2 items-center border text-[0.78rem] font-bold",
        dark ? "border-hajar/35 text-hajar" : "border-ink/30 text-ink",
        className
      )}
    >
      {/* المقبض البرونزي */}
      <span
        className="absolute inset-y-[3px] start-[3px] w-[calc(50%-3px)] cham bg-bronze transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)]"
        style={{ transform: lang === "en" ? "translateX(100%)" : "none" }}
      />
      <span className={cn("relative z-10 text-center font-head transition-colors", lang === "ar" ? "text-hajar" : "")}>AR</span>
      <span className={cn("relative z-10 text-center font-head transition-colors", lang === "en" ? "text-hajar" : "")}>EN</span>
    </button>
  );
}

export function Logo({ dark }: { dark?: boolean }) {
  const { tx, isAr } = useLang();
  return (
    <a href="#top" className="flex items-center gap-3" aria-label="Nakhla">
      <LogoMark className={cn("h-9 w-9", dark ? "text-hajar" : "text-palm")} style={{ ["--logo-in" as string]: dark ? "#1F3D2B" : "#EAE3D6" }} />
      <span className="leading-none">
        <span className={cn("block font-head text-[1.45rem] font-black", dark ? "text-hajar" : "text-palm", !isAr && "tracking-tight")}>{tx({ ar: "نخلة", en: "Nakhla" })}</span>
        <span className={cn("track mt-1 block font-head text-[0.62rem] font-bold", dark ? "text-sand" : "text-bronze")}>{tx({ ar: "لطب الأسنان", en: "Dental" })}</span>
      </span>
    </a>
  );
}

export const NAV = [
  { href: "#results", l: { ar: "النتائج", en: "Results" } },
  { href: "#specialties", l: { ar: "التخصصات", en: "Specialties" } },
  { href: "#doctors", l: { ar: "الأطباء", en: "Doctors" } },
  { href: "#pricing", l: { ar: "التقسيط", en: "Payment" } },
  { href: "#branches", l: { ar: "الفروع", en: "Branches" } },
  { href: "#faq", l: { ar: "الأسئلة", en: "FAQ" } },
];

export function Header() {
  const { tx, isAr } = useLang();
  const { open } = useBooking();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[60] transition-all duration-500",
          scrolled ? "border-b border-sand/70 bg-hajar/90 backdrop-blur-md" : "bg-transparent"
        )}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className={cn("wrap flex items-center justify-between gap-3 transition-all duration-500", scrolled ? "h-[68px]" : "h-[80px]")}>
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="main">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="group relative px-4 py-3 font-head text-[0.85rem] font-bold text-ink/80 transition-colors hover:text-ink">
                {tx(n.l)}
                <span className="absolute inset-x-4 bottom-1.5 h-px origin-center scale-x-0 bg-bronze transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <LangToggle />
            <button
              onClick={() => open()}
              className="cham hidden min-h-[44px] items-center bg-bronze px-5 font-head text-[0.82rem] font-bold text-hajar transition-colors hover:bg-palm sm:inline-flex"
            >
              {tx({ ar: "احجز موعدي", en: "Book my visit" })}
            </button>
            <button
              onClick={() => open()}
              className="cham inline-flex min-h-[44px] items-center bg-bronze px-4 font-head text-[0.8rem] font-bold text-hajar sm:hidden"
            >
              {tx({ ar: "احجز موعدي", en: "Book my visit" })}
            </button>
            <button onClick={() => setMenu(true)} className="grid h-11 w-11 place-items-center text-ink lg:hidden" aria-label={tx({ ar: "القائمة", en: "Menu" })}>
              <Menu className="h-7 w-7" />
            </button>
          </div>
        </div>
      </header>

      {/* قائمة الجوال: شاشة كاملة بكشف دائري */}
      <div
        className="on-dark fixed inset-0 z-[80] overflow-y-auto bg-palm text-hajar transition-[clip-path] duration-[800ms] ease-[cubic-bezier(.7,0,.2,1)] lg:hidden"
        style={{ clipPath: menu ? `circle(150% at ${isAr ? "12%" : "88%"} 6%)` : `circle(0% at ${isAr ? "12%" : "88%"} 6%)`, pointerEvents: menu ? "auto" : "none" }}
        aria-hidden={!menu}
      >
        <div className="grain-l absolute inset-0" />
        <div className="wrap relative flex min-h-full flex-col pb-8" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <div className="flex h-[80px] items-center justify-between">
            <Logo dark />
            <button onClick={() => setMenu(false)} className="grid h-11 w-11 place-items-center border border-hajar/30" aria-label="close">
              <Close className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-6 flex flex-col">
            {NAV.map((n, i) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setMenu(false)}
                className="flex items-baseline gap-4 border-b border-hajar/15 py-4 font-head text-[clamp(1.7rem,8vw,2.4rem)] font-extrabold transition-all duration-700"
                style={{ opacity: menu ? 1 : 0, transform: menu ? "none" : "translateY(24px)", transitionDelay: `${250 + i * 60}ms` }}
              >
                <span className="text-[0.8rem] font-bold text-sand">{isAr ? `٠${["١", "٢", "٣", "٤", "٥", "٦"][i]}` : `0${i + 1}`}</span>
                {tx(n.l)}
              </a>
            ))}
          </nav>
          <div className="mt-auto space-y-3 pt-10">
            <button
              onClick={() => {
                setMenu(false);
                open();
              }}
              className="cham flex min-h-[58px] w-full items-center justify-center bg-bronze font-head font-bold"
            >
              {tx({ ar: "احجز استشارتي المجانية", en: "Book my free consultation" })}
            </button>
            <div className="grid grid-cols-2 gap-3">
              <a href={`tel:${MAIN_PHONE.replace(/\s/g, "")}`} className="cham flex min-h-[52px] items-center justify-center gap-2 border border-hajar/30 font-head text-sm font-bold">
                <Phone className="h-5 w-5" /> {tx({ ar: "اتصال", en: "Call" })}
              </a>
              <a href={`https://wa.me/${WA_NUMBER}`} className="cham flex min-h-[52px] items-center justify-center gap-2 border border-hajar/30 font-head text-sm font-bold">
                <WhatsApp className="h-5 w-5" /> {tx({ ar: "واتساب", en: "WhatsApp" })}
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
