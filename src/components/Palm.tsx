import { useEffect, useMemo, useRef } from "react";
import { cn } from "../utils/cn";

/* ============================================================
   التوقيع البصري: «ظلّ السعف»
   سعف نخيل مولَّد هندسياً (محور منحنٍ + وريقات مدبّبة متدلّية)
   يُستخدم كظلّ متحرك فوق حجر نجد، وكعنصر ضوء في الأقسام الداكنة.
   ============================================================ */
type F = { ox: number; oy: number; a: number; len: number; curve: number; n: number; leaf: number };

function build(f: F) {
  const a = (f.a * Math.PI) / 180;
  const dx = Math.cos(a),
    dy = Math.sin(a);
  const nx = -dy,
    ny = dx;
  const p0 = [f.ox, f.oy];
  const p2 = [f.ox + dx * f.len, f.oy + dy * f.len];
  const p1 = [f.ox + dx * f.len * 0.5 + nx * f.curve, f.oy + dy * f.len * 0.5 + ny * f.curve];
  const pt = (t: number) => [
    (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
    (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
  ];
  const tn = (t: number) => {
    const x = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const y = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const l = Math.hypot(x, y) || 1;
    return [x / l, y / l];
  };
  const rachis = `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} Q${p1[0].toFixed(1)} ${p1[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  const leaves: string[] = [];
  for (let i = 1; i <= f.n; i++) {
    const t = 0.1 + (0.9 * i) / f.n;
    const [x, y] = pt(t);
    const [tx, ty] = tn(t);
    const prof = Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.98)), 0.7);
    const len = f.leaf * (0.25 + 0.75 * prof) * (1 - 0.35 * t);
    for (const side of [-1, 1]) {
      const ang = side * 0.95;
      const c = Math.cos(ang),
        s = Math.sin(ang);
      const dxl = tx * c - ty * s,
        dyl = tx * s + ty * c;
      const ex = x + dxl * len;
      const ey = y + dyl * len + len * 0.28; // تدلٍّ بفعل الجاذبية
      const mx = (x + ex) / 2,
        my = (y + ey) / 2 - len * 0.05;
      const w = Math.max(1.6, len * 0.045);
      const pxn = -(ey - y),
        pyn = ex - x;
      const pl = Math.hypot(pxn, pyn) || 1;
      const ox = (pxn / pl) * w,
        oy = (pyn / pl) * w;
      leaves.push(
        `M${x.toFixed(1)} ${y.toFixed(1)}Q${(mx + ox).toFixed(1)} ${(my + oy).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}Q${(mx - ox).toFixed(1)} ${(my - oy).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}Z`
      );
    }
  }
  return { rachis, leaves: leaves.join("") };
}

const SETS: Record<string, F[]> = {
  // مجموعة من الزاوية العلوية
  a: [
    { ox: 900, oy: -40, a: 150, len: 760, curve: -120, n: 30, leaf: 190 },
    { ox: 900, oy: -40, a: 128, len: 700, curve: 90, n: 28, leaf: 175 },
    { ox: 900, oy: -40, a: 172, len: 600, curve: -70, n: 24, leaf: 150 },
  ],
  b: [
    { ox: -40, oy: 940, a: -35, len: 760, curve: -110, n: 30, leaf: 190 },
    { ox: -40, oy: 940, a: -58, len: 640, curve: 80, n: 26, leaf: 165 },
  ],
  c: [
    { ox: 450, oy: -50, a: 90, len: 780, curve: 150, n: 32, leaf: 200 },
    { ox: 450, oy: -50, a: 62, len: 700, curve: -90, n: 28, leaf: 180 },
    { ox: 450, oy: -50, a: 118, len: 700, curve: 90, n: 28, leaf: 180 },
  ],
};

export function PalmShadow({
  variant = "a",
  className,
  sway = true,
  blur = 3,
}: {
  variant?: "a" | "b" | "c";
  className?: string;
  sway?: boolean;
  blur?: number;
}) {
  const data = useMemo(() => SETS[variant].map(build), [variant]);
  return (
    <svg
      viewBox="0 0 900 900"
      aria-hidden
      className={cn("pointer-events-none absolute select-none", sway && (variant === "b" ? "sway2" : "sway"), className)}
      style={{ filter: `blur(${blur}px)`, transformOrigin: variant === "b" ? "0% 100%" : variant === "c" ? "50% 0%" : "100% 0%" }}
    >
      <g fill="currentColor" stroke="currentColor">
        {data.map((d, i) => (
          <g key={i}>
            <path d={d.rachis} fill="none" strokeWidth="4" strokeLinecap="round" />
            <path d={d.leaves} strokeWidth="0.6" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** طبقة الظل العامة فوق الصفحة كلها (تتحرك ببطء مع التمرير كأن الضوء ينتقل) */
export function GlobalPalmLight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const y = window.scrollY;
      if (ref.current) {
        ref.current.style.transform = `translate3d(0, ${Math.sin(y / 900) * 36}px, 0) rotate(${Math.sin(y / 1500) * 2.4}deg)`;
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 z-[45] overflow-hidden text-ink mix-blend-multiply" style={{ opacity: 0.085 }} aria-hidden>
      <div ref={ref} className="absolute inset-[-8%] will-change-transform">
        <PalmShadow variant="a" className="-end-[22%] -top-[8%] h-[88vmax] w-[88vmax] max-w-none md:h-[62vmax] md:w-[62vmax]" blur={5} />
        <PalmShadow variant="b" className="-start-[24%] -bottom-[10%] hidden h-[70vmax] w-[70vmax] max-w-none md:block" blur={6} />
      </div>
    </div>
  );
}
