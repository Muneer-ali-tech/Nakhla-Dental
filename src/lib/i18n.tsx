import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/* ============================================================
   نظام اللغتين — AR (RTL) أساسي / EN (LTR) ثانوي
   كل نص يُكتب كزوج { ar, en } بجوار مكانه.
   ============================================================ */
export type Lang = "ar" | "en";
export type Bi = { ar: string; en: string };

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
/* بلا lookbehind — متصفحات الجوال القديمة (Safari < 16.4 وبعض WebView)
   تفشل في تحليل (?<=…) عند التحميل فتُعطِّل الموقع كاملاً.
   الصيغة التالية سلوكها مطابق تماماً. */
export function toArDigits(s: string) {
  return s
    .replace(/\d/g, (d) => AR_DIGITS[Number(d)])
    .replace(/([٠-٩]),(?=[٠-٩])/g, "$1٬")
    .replace(/([٠-٩])\.(?=[٠-٩])/g, "$1٫");
}

type Ctx = {
  lang: Lang;
  isAr: boolean;
  dir: "rtl" | "ltr";
  tx: (b: Bi) => string;
  num: (n: number, dec?: number) => string;
  toggle: () => void;
  setLang: (l: Lang) => void;
};

const LangCtx = createContext<Ctx>(null as unknown as Ctx);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    const el = document.documentElement;
    el.classList.add("lang-switching");
    window.setTimeout(() => setLangState(next), 240);
    window.setTimeout(() => el.classList.remove("lang-switching"), 520);
  }, []);

  const value = useMemo<Ctx>(() => {
    const isAr = lang === "ar";
    return {
      lang,
      isAr,
      dir: isAr ? "rtl" : "ltr",
      tx: (b) => (isAr ? toArDigits(b.ar) : b.en),
      num: (n, dec = 0) =>
        new Intl.NumberFormat(isAr ? "ar-SA-u-nu-arab" : "en-US", {
          maximumFractionDigits: dec,
          minimumFractionDigits: dec,
        }).format(n),
      toggle: () => setLang(isAr ? "en" : "ar"),
      setLang,
    };
  }, [lang, setLang]);

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);
