import { useId, useMemo } from "react";

/* ============================================================
   مشهد الابتسامة — رسم SVG تحريري (ليس فلتر على صورة)
   كل حالة قبل/بعد تُرسم بهندسة أسنان مختلفة فعلياً:
   الطول، الميلان، التداخل، الشقوق، اللون، السن المفقود…
   يمكن استبداله بصور فوتوغرافية عبر beforeSrc / afterSrc.
   ============================================================ */
export type ShadeKey = "dull" | "stained" | "natural" | "bright";
export type ToothCfg = {
  dx?: number;
  dy?: number;
  rot?: number;
  sw?: number;
  sh?: number;
  chip?: "l" | "r";
  missing?: boolean;
  z?: number;
  stain?: number;
  shade?: ShadeKey;
};
export type SmileCfg = {
  shade: ShadeKey;
  gap?: number; // فراغ بين القاطعتين
  papilla?: boolean;
  gumTone?: "inflamed" | "healthy";
  teeth?: Record<string, ToothCfg>; // L0..L4 / R0..R4 (0 = القاطعة المركزية)
};

const W = [58, 46, 48, 42, 38];
const GY = [232, 236, 236, 240, 244];
const BY = [314, 304, 318, 300, 288];
const TILT = [0, 3, 6, 9, 12];

const SHADES: Record<ShadeKey, { c: string; m: string; i: string }> = {
  dull: { c: "#C9AA66", m: "#E6D3A0", i: "#E2D8BE" },
  stained: { c: "#BD9440", m: "#DDBE74", i: "#E6D4A2" },
  natural: { c: "#E6D9B8", m: "#F7F0E1", i: "#F2EDE2" },
  bright: { c: "#EEE7D5", m: "#FEFCF8", i: "#F8F6F1" },
};

const OPEN = "M110 236C220 196 330 204 400 218C470 204 580 196 690 236C640 350 520 402 400 402C280 402 160 350 110 236Z";
const UPPER_LIP = "M84 240C170 150 330 140 400 168C470 140 630 150 716 240L690 236C580 196 470 204 400 218C330 204 220 196 110 236Z";
const LOWER_LIP = "M84 244C150 420 300 472 400 472C500 472 650 420 716 244L690 236C640 350 520 402 400 402C280 402 160 350 110 236Z";

export function Smile({ cfg, className }: { cfg: SmileCfg; className?: string }) {
  const uid = useId().replace(/:/g, "");

  const { teeth, lower, papillae } = useMemo(() => {
    const list: any[] = [];
    for (const side of ["L", "R"] as const) {
      const s = side === "L" ? -1 : 1;
      let cum = (cfg.gap ?? 0) / 2;
      for (let i = 0; i < 5; i++) {
        const o: ToothCfg = cfg.teeth?.[side + i] ?? {};
        const w = W[i] * (o.sw ?? 1);
        const h = (BY[i] - GY[i]) * (o.sh ?? 1);
        const cx = 400 + s * (cum + W[i] / 2 + 1) + (o.dx ?? 0);
        cum += W[i] + 2;
        list.push({
          key: side + i,
          i,
          s,
          cx,
          gy: GY[i] + (o.dy ?? 0),
          w,
          h,
          rot: -s * TILT[i] + (o.rot ?? 0),
          chip: o.chip,
          missing: o.missing,
          stain: o.stain ?? 0,
          shade: o.shade ?? cfg.shade,
          z: o.z ?? 0,
        });
      }
    }
    const low: any[] = [];
    const lw = [32, 31, 31, 30, 28, 26];
    for (const s of [-1, 1]) {
      let cum = 0;
      for (let i = 0; i < 6; i++) {
        low.push({ x: 400 + s * (cum + lw[i] / 2), y: 298 + i * 6 + (i > 3 ? 6 : 0), w: lw[i] });
        cum += lw[i] + 1.5;
      }
    }
    const pap: any[] = [];
    if (cfg.papilla !== false) {
      for (let i = 0; i < 4; i++) {
        for (const side of ["L", "R"]) {
          const a = list.find((t) => t.key === side + i);
          const b = list.find((t) => t.key === side + (i + 1));
          if (a && b && !a.missing && !b.missing) pap.push({ x: (a.cx + b.cx) / 2, y: (a.gy + b.gy) / 2 });
        }
      }
      const a = list.find((t) => t.key === "L0"),
        b = list.find((t) => t.key === "R0");
      pap.push({ x: (a.cx + b.cx) / 2, y: GY[0] });
    }
    return { teeth: list.sort((a, b) => a.z - b.z), lower: low, papillae: pap };
  }, [cfg]);

  const gum = cfg.gumTone === "inflamed" ? ["#B8484A", "#CF6E6B"] : ["#C46E6C", "#DA938E"];
  const id = (n: string) => `${uid}${n}`;

  return (
    <svg viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-hidden>
      <defs>
        <linearGradient id={id("skin")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C99872" />
          <stop offset="1" stopColor="#A8704E" />
        </linearGradient>
        <radialGradient id={id("vig")} cx=".5" cy=".5" r=".75">
          <stop offset=".45" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#2a1408" stopOpacity=".5" />
        </radialGradient>
        <linearGradient id={id("upl")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9A5245" />
          <stop offset="1" stopColor="#7E3E35" />
        </linearGradient>
        <linearGradient id={id("lol")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8E463B" />
          <stop offset=".45" stopColor="#B96F61" />
          <stop offset="1" stopColor="#9C5546" />
        </linearGradient>
        <linearGradient id={id("mouth")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b1815" />
          <stop offset="1" stopColor="#170807" />
        </linearGradient>
        <linearGradient id={id("gum")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={gum[0]} />
          <stop offset="1" stopColor={gum[1]} />
        </linearGradient>
        <linearGradient id={id("top")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e0706" stopOpacity=".6" />
          <stop offset="1" stopColor="#1e0706" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id("bot")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e0706" stopOpacity="0" />
          <stop offset="1" stopColor="#1e0706" stopOpacity=".65" />
        </linearGradient>
        <linearGradient id={id("side")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#140404" stopOpacity=".8" />
          <stop offset=".14" stopColor="#140404" stopOpacity="0" />
          <stop offset=".86" stopColor="#140404" stopOpacity="0" />
          <stop offset="1" stopColor="#140404" stopOpacity=".8" />
        </linearGradient>
        <linearGradient id={id("edge")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5a3b19" stopOpacity=".34" />
          <stop offset=".2" stopColor="#5a3b19" stopOpacity="0" />
          <stop offset=".8" stopColor="#5a3b19" stopOpacity="0" />
          <stop offset="1" stopColor="#5a3b19" stopOpacity=".34" />
        </linearGradient>
        {(Object.keys(SHADES) as ShadeKey[]).map((k) => (
          <linearGradient key={k} id={id("v" + k)} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={SHADES[k].c} />
            <stop offset=".3" stopColor={SHADES[k].m} />
            <stop offset=".82" stopColor={SHADES[k].m} />
            <stop offset="1" stopColor={SHADES[k].i} />
          </linearGradient>
        ))}
        <clipPath id={id("open")}>
          <path d={OPEN} />
        </clipPath>
      </defs>

      {/* الجلد */}
      <rect width="800" height="520" fill={`url(#${id("skin")})`} />
      <ellipse cx="400" cy="120" rx="120" ry="30" fill="#7a4a2c" opacity=".18" />
      <rect width="800" height="520" fill={`url(#${id("vig")})`} />

      {/* داخل الفم */}
      <path d={OPEN} fill={`url(#${id("mouth")})`} />

      <g clipPath={`url(#${id("open")})`}>
        {/* اللثة */}
        <rect x="100" y="180" width="600" height="86" fill={`url(#${id("gum")})`} />
        {/* الأسنان السفلية */}
        <g>
          {lower.map((t, i) => (
            <rect key={i} x={t.x - t.w / 2} y={t.y} width={t.w} height="90" rx={t.w * 0.38} fill={`url(#${id("v" + (cfg.shade === "bright" ? "natural" : cfg.shade))})`} stroke="rgba(70,45,20,.4)" strokeWidth="1" />
          ))}
          <rect x="100" y="290" width="600" height="120" fill="#2a0c0a" opacity=".38" />
        </g>
        {/* الأسنان العلوية */}
        {teeth.map((t) =>
          t.missing ? (
            <g key={t.key}>
              <ellipse cx={t.cx} cy={t.gy + 6} rx={t.w * 0.46} ry="16" fill={`url(#${id("gum")})`} />
            </g>
          ) : (
            <g key={t.key} transform={`translate(${t.cx} ${t.gy}) rotate(${t.rot})`}>
              <rect x={-t.w / 2 + 1.5} y="3" width={t.w} height={t.h} rx={t.w * 0.4} fill="#1a0807" opacity=".35" />
              <rect x={-t.w / 2} y="0" width={t.w} height={t.h} rx={t.w * 0.4} fill={`url(#${id("v" + t.shade)})`} />
              <rect x={-t.w / 2} y="0" width={t.w} height={t.h} rx={t.w * 0.4} fill={`url(#${id("edge")})`} />
              <ellipse cx={-t.w * 0.17} cy={t.h * 0.44} rx={t.w * 0.1} ry={t.h * 0.24} fill="#fff" opacity={t.shade === "bright" ? 0.42 : 0.24} />
              {t.stain > 0 && (
                <g fill="#6f4c1a" stroke="#6f4c1a" opacity={0.22 + t.stain * 0.14}>
                  <path d={`M${-t.w * 0.32} ${t.h * 0.18}q${t.w * 0.3} ${t.h * 0.1} ${t.w * 0.62} 0`} strokeWidth="2.4" fill="none" />
                  <circle cx={t.w * 0.14} cy={t.h * 0.55} r="2.6" />
                  <circle cx={-t.w * 0.2} cy={t.h * 0.7} r="2" />
                  <path d={`M${-t.w * 0.1} ${t.h * 0.82}l3 -9`} strokeWidth="1.6" />
                </g>
              )}
              <rect x={-t.w / 2} y="0" width={t.w} height={t.h} rx={t.w * 0.4} fill="none" stroke="rgba(76,48,20,.42)" strokeWidth="1.2" />
              {t.chip && (
                <polygon
                  fill="#25100d"
                  points={
                    t.chip === "r"
                      ? `${t.w / 2 - 17},${t.h + 1} ${t.w / 2 - 10},${t.h - 7} ${t.w / 2 - 6},${t.h - 5} ${t.w / 2 + 1},${t.h - 19} ${t.w / 2 + 1},${t.h + 1}`
                      : `${-t.w / 2 + 17},${t.h + 1} ${-t.w / 2 + 10},${t.h - 7} ${-t.w / 2 + 6},${t.h - 5} ${-t.w / 2 - 1},${t.h - 19} ${-t.w / 2 - 1},${t.h + 1}`
                  }
                />
              )}
            </g>
          )
        )}
        {papillae.map((p, i) => (
          <path key={i} d={`M${p.x - 6} ${p.y - 3}L${p.x} ${p.y + 15}L${p.x + 6} ${p.y - 3}Z`} fill={`url(#${id("gum")})`} />
        ))}
        {/* ظلال العمق */}
        <rect x="100" y="190" width="600" height="80" fill={`url(#${id("top")})`} />
        <rect x="100" y="330" width="600" height="80" fill={`url(#${id("bot")})`} />
        <rect x="100" y="190" width="600" height="220" fill={`url(#${id("side")})`} />
      </g>

      {/* الشفتان */}
      <path d={UPPER_LIP} fill={`url(#${id("upl")})`} />
      <path d={LOWER_LIP} fill={`url(#${id("lol")})`} />
      <path d="M130 236C240 198 330 208 400 220C470 208 560 198 670 236" fill="none" stroke="#5a2620" strokeWidth="2" opacity=".5" />
      <ellipse cx="400" cy="436" rx="130" ry="13" fill="#fff" opacity=".13" />
      <ellipse cx="400" cy="178" rx="80" ry="7" fill="#fff" opacity=".08" />
    </svg>
  );
}
