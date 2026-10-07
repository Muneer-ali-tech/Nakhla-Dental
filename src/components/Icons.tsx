import type { ReactNode, SVGProps } from "react";

/* ============================================================
   الأيقونات: خط رفيع هندسي موحّد (stroke 1.5) — بلا إيموجي
   ============================================================ */
type P = SVGProps<SVGSVGElement>;
const S = ({ children, ...p }: P & { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
    {children}
  </svg>
);

export const Arrow = (p: P) => (
  <S {...p} className={`rtl:-scale-x-100 ${p.className ?? ""}`}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </S>
);
export const Plus = (p: P) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
);
export const Close = (p: P) => (
  <S {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </S>
);
export const Menu = (p: P) => (
  <S {...p}>
    <path d="M4 8h16M4 16h10" />
  </S>
);
export const Phone = (p: P) => (
  <S {...p}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </S>
);
export const Pin = (p: P) => (
  <S {...p}>
    <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" />
    <circle cx="12" cy="9" r="2.4" />
  </S>
);
export const Clock = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </S>
);
export const Check = (p: P) => (
  <S {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </S>
);
export const Chat = (p: P) => (
  <S {...p}>
    <path d="M4 5h16v11H9l-5 4V5z" />
    <path d="M8 10h8M8 13h5" />
  </S>
);
export const Star = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L2 9.2l7.1-.6L12 2z" />
  </svg>
);
export const WhatsApp = (p: P) => (
  <S {...p}>
    <path d="M3 21l1.6-4.9A9 9 0 1 1 8 19.5L3 21z" />
    <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1.2-1.500-2.200-1-1 .9a4 4 0 0 1-2-2l.9-1-1-2.200L9 8.500z" />
  </S>
);
export const Copy = (p: P) => (
  <S {...p}>
    <rect x="8" y="8" width="12" height="12" rx="1" />
    <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
  </S>
);

/* شعار نخلة: بيت نجدي مثلثي القمة تنبت داخله سعفة */
export const LogoMark = (p: P) => (
  <svg viewBox="0 0 40 40" aria-hidden {...p}>
    <path d="M5 38V17L20 3l15 14v21z" fill="currentColor" />
    <g stroke="var(--logo-in, #EAE3D6)" strokeWidth="1.9" strokeLinecap="round" fill="none">
      <path d="M20 35V15" />
      <path d="M20 27c-6-1-9-5-10-9" />
      <path d="M20 27c6-1 9-5 10-9" />
      <path d="M20 21c-4-1-5-4-5-7" />
      <path d="M20 21c4-1 5-4 5-7" />
    </g>
  </svg>
);

/* ------- أيقونات التخصصات السبعة (ترسم نفسها عند الاختيار) ------- */
const TOOTH =
  "M20 10C13 10 11 19 13 28C15 37 16 54 21 56C25 58 26 44 32 44C38 44 39 58 43 56C48 54 49 37 51 28C53 19 51 10 44 10C39 10 37 14 32 14C27 14 25 10 20 10Z";
const B = (p: P & { children: ReactNode }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
    {p.children}
  </svg>
);
export const SpecIcons: Record<string, (p: P) => ReactNode> = {
  implant: (p) => (
    <B {...p}>
      <path d="M20 6h24c3 0 4 4 3 8-1 4-2 7-4 7H21c-2 0-3-3-4-7-1-4 0-8 3-8z" />
      <path d="M26 21h12v5H26z" />
      <path d="M24 26h16l-3 28c0 2-2 4-5 4s-5-2-5-4z" />
      <path d="M25 33h14M26 39h12M27 45h10M28 51h8" />
    </B>
  ),
  ortho: (p) => (
    <B {...p}>
      <path d="M6 42Q32 6 58 42" />
      <rect x="10.300" y="28.300" width="7" height="7" />
      <rect x="19.100" y="22.600" width="7" height="7" />
      <rect x="28.500" y="20.500" width="7" height="7" />
      <rect x="37.900" y="22.600" width="7" height="7" />
      <rect x="46.700" y="28.300" width="7" height="7" />
      <path d="M14 36v10M23 30v14M32 28v14M41 30v14M50 36v10" opacity=".55" />
    </B>
  ),
  cosmetic: (p) => (
    <B {...p}>
      <path d={TOOTH} transform="translate(-4 4) scale(.92)" />
      <path d="M50 6v12M44 12h12" />
      <path d="M12 8v6M9 11h6" />
      <path d="M44 28c3-.5 5-2.500 6-6" opacity=".55" />
    </B>
  ),
  endo: (p) => (
    <B {...p}>
      <path d={TOOTH} />
      <path d="M26 20v28M38 20v28" />
      <path d="M26 24c2 2 2 4 0 6s-2 4 0 6M38 24c-2 2-2 4 0 6s2 4 0 6" opacity=".6" />
      <path d="M32 3v10" />
    </B>
  ),
  kids: (p) => (
    <B {...p}>
      <path d={TOOTH} transform="translate(7 14) scale(.78)" />
      <path d="M30 18c0-8 9-11 14-9 0 7-6 10-14 9z" />
      <path d="M30 18v6" />
      <path d="M26 38h.1M38 38h.1" strokeWidth="3" />
      <path d="M27 44c2 2 8 2 10 0" />
    </B>
  ),
  gums: (p) => (
    <B {...p}>
      <path d={TOOTH} />
      <path d="M4 30q7-7 14 0t14 0 14 0 14 0" strokeWidth="1.800" />
      <path d="M4 36q7-7 14 0t14 0 14 0 14 0" opacity=".4" />
    </B>
  ),
  crown: (p) => (
    <B {...p}>
      <path d="M14 20l-3-14 11 7 10-11 10 11 11-7-3 14z" />
      <path d="M17 20c-2 8 0 28 4 34 3 4 5-8 11-8s8 12 11 8c4-6 6-26 4-34" />
      <path d="M17 24h30" strokeDasharray="2 3" opacity=".7" />
    </B>
  ),
};
