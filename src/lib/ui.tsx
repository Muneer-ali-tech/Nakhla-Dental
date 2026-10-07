import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { Arrow } from "../components/Icons";
import { useLang, toArDigits } from "./i18n";

/* ============================================================
   أدوات الواجهة المشتركة
   ============================================================ */

/** يراقب ظهور العنصر في الشاشة (مرة واحدة) */
export function useInView<T extends HTMLElement>(threshold = 0.18) {
  const ref = useRef<T>(null);
  const [inView, setIn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setIn(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/** تقدّم التمرير داخل عنصر 0..1 */
export function useScrollProgress<T extends HTMLElement>(anchor = 0.65) {
  const ref = useRef<T>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const calc = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const v = (vh * anchor - r.top) / r.height;
      const c = Math.max(0, Math.min(1, v));
      setP((old) => (Math.abs(old - c) > 0.004 ? c : old));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(calc);
    };
    calc();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [anchor]);
  return [ref, p] as const;
}

/** ظهور ناعم عند التمرير */
export function Reveal({
  children,
  delay = 0,
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const [ref, inView] = useInView<HTMLDivElement>(0.12);
  return (
    <div ref={ref} className={cn("rv", inView && "in", className)} style={{ ...style, ["--d" as string]: `${delay}ms` }}>
      {children}
    </div>
  );
}

/** عنوان تظهر كلماته واحدة تلو الأخرى من خلف قناع */
export function Words({
  text,
  className,
  delay = 0,
  step = 70,
  hl = [],
  hlClass = "text-bronze",
}: {
  text: string;
  className?: string;
  delay?: number;
  step?: number;
  hl?: number[];
  hlClass?: string;
}) {
  const [ref, inView] = useInView<HTMLSpanElement>(0.2);
  return (
    <span ref={ref} className={cn(inView && "in", className)}>
      {text.split(" ").map((w, i) => (
        <span key={i}>
          <span className="lm">
            <span className={cn(hl.includes(i) && hlClass)} style={{ ["--d" as string]: `${delay + i * step}ms` }}>
              {w}
            </span>
          </span>{" "}
        </span>
      ))}
    </span>
  );
}

/** عدّاد أرقام يعدّ عند الظهور */
export function Count({ to, dec = 0, suffix = "", className }: { to: number; dec?: number; suffix?: string; className?: string }) {
  const { num } = useLang();
  const [ref, inView] = useInView<HTMLSpanElement>(0.5);
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const t0 = performance.now();
    const dur = 2000;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setV(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {num(v, dec)}
      {suffix}
    </span>
  );
}

/** عنوان القسم الصغير: رقم + خط + اسم */
export function Eyebrow({ n, children, light, className }: { n: string; children: ReactNode; light?: boolean; className?: string }) {
  const { isAr } = useLang();
  n = isAr ? toArDigits(n) : n;
  return (
    <div className={cn("track flex items-center gap-3 font-head text-[0.78rem] font-bold", light ? "text-sand" : "text-bronze", className)}>
      <span className="inline-block h-2.5 w-2.5 rotate-45 bg-current" />
      <span>{n}</span>
      <span className="h-px w-8 bg-current opacity-50 sm:w-12" />
      <span>{children}</span>
    </div>
  );
}

type BtnProps = {
  children: ReactNode;
  variant?: "bronze" | "palm" | "hajar" | "ghost" | "ghost-light";
  onClick?: () => void;
  href?: string;
  className?: string;
  arrow?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
};
const variants = {
  bronze: "bg-bronze text-hajar hover:bg-palm",
  palm: "bg-palm text-hajar hover:bg-bronze",
  hajar: "bg-hajar text-palm hover:bg-sand",
  ghost: "border border-ink/30 text-ink hover:bg-ink hover:text-hajar",
  "ghost-light": "border border-hajar/40 text-hajar hover:bg-hajar hover:text-palm",
};
/** الزر الأساسي: حجر منحوت بزوايا مقطوعة */
export function Btn({ children, variant = "bronze", onClick, href, className, arrow = true, type = "button", disabled }: BtnProps) {
  const cls = cn(
    "cham group inline-flex min-h-[52px] items-center justify-center gap-3 px-7 font-head text-[0.92rem] font-bold transition-colors duration-300 disabled:opacity-50",
    variants[variant],
    className
  );
  const inner = (
    <>
      <span>{children}</span>
      {arrow && <Arrow className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />}
    </>
  );
  if (href)
    return (
      <a href={href} className={cls} onClick={onClick}>
        {inner}
      </a>
    );
  return (
    <button type={type} onClick={onClick} className={cls} disabled={disabled}>
      {inner}
    </button>
  );
}
