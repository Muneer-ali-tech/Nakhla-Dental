import { useEffect, useRef, useState } from "react";
import { useLang, type Bi } from "../lib/i18n";
import { useBooking } from "./Booking";
import { Chat, Close, LogoMark, Phone, WhatsApp, Arrow } from "./Icons";
import { MAIN_PHONE, WA_NUMBER } from "../lib/data";
import { cn } from "../utils/cn";

/* ============================================================
   شريط الجوال السفلي (اتصال · واتساب · مساعد · حجز) + مساعد نخلة
   واجهة المحادثة نهائية؛ الإجابات هنا مكتوبة مسبقاً ويُستبدل
   محرّكها لاحقاً بنموذج ذكاء اصطناعي دون تغيير التصميم.
   ============================================================ */
type Msg = { from: "bot" | "me"; t: string };
const QUICK: { l: Bi; a: Bi }[] = [
  { l: { ar: "احجز موعداً", en: "Book a visit" }, a: { ar: "بكل سرور. اضغط «احجز» وسنؤكد موعدك عبر واتساب خلال ١٥ دقيقة.", en: "Gladly. Tap “Book” and we'll confirm your slot on WhatsApp within 15 minutes." } },
  { l: { ar: "الأسعار والتقسيط", en: "Prices & instalments" }, a: { ar: "الاستشارة الأولى مجانية، والتقسيط بدون فوائد حتى ١٢ شهراً. جرّب حاسبة التقسيط في الصفحة لترى قسطك.", en: "The first consultation is free and instalments are interest-free up to 12 months. Try the calculator on this page to see your payment." } },
  { l: { ar: "ساعات العمل", en: "Opening hours" }, a: { ar: "من السبت إلى الخميس ٩ ص – ١٠ م، والجمعة ٤ م – ١٠ م (تختلف ساعة بين الفروع).", en: "Saturday to Thursday 9am–10pm, Friday 4pm–10pm (varies slightly between branches)." } },
  { l: { ar: "الفروع", en: "Branches" }, a: { ar: "لدينا فرعان في المدينة المنورة: القبلتين والعزيزية، وفرع في حائل.", en: "We have two branches in Madinah — Al-Qiblatain and Al-Aziziyah — and one in Ha'il." } },
  { l: { ar: "التأمين", en: "Insurance" }, a: { ar: "نقبل أغلب شركات التأمين الكبرى، ونتحقق من وثيقتك قبل موعدك بيوم عمل.", en: "We accept most major insurers and verify your policy one working day before your visit." } },
];

export function Dock() {
  const { tx, isAr } = useLang();
  const { open } = useBooking();
  const [show, setShow] = useState(false);
  const [chat, setChat] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [val, setVal] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = () => setShow(window.scrollY > 480);
    on();
    window.addEventListener("scroll", on, { passive: true });
    const openChat = () => setChat(true);
    window.addEventListener("nakhla:chat", openChat);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("nakhla:chat", openChat);
    };
  }, []);
  useEffect(() => {
    if (chat && msgs.length === 0) {
      setTyping(true);
      const t = setTimeout(() => {
        setTyping(false);
        setMsgs([{ from: "bot", t: tx({ ar: "أهلاً بك في نخلة. أنا مساعدك، كيف أخدمك اليوم؟", en: "Welcome to Nakhla. I'm your assistant — how can I help today?" }) }]);
      }, 700);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line
  }, [chat]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, typing]);

  const reply = (me: string, bot: string) => {
    setMsgs((m) => [...m, { from: "me", t: me }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: "bot", t: bot }]);
    }, 800);
  };
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!val.trim()) return;
    reply(val, tx({ ar: "شكراً لسؤالك. سأحوّلك لمنسّق المواعيد ليجيبك بدقة عبر واتساب.", en: "Thanks for asking. I'll hand you to our coordinator to answer precisely on WhatsApp." }));
    setVal("");
  };

  return (
    <>
      {/* زر المساعد العائم: جوال — يسار الشريط السفلي ويرتفع فوق شريط العرض، سطح المكتب — كما كان */}
      <button
        onClick={() => setChat((c) => !c)}
        className={cn(
          "dock-fab cham fixed z-[55] flex items-center gap-3 bg-palm font-head font-bold text-hajar hover:bg-bronze",
          "h-12 left-[14px] bottom-[calc(var(--dock-h)_+_12px_+_var(--offer-h))] px-4 text-[15px] shadow-[0_8px_24px_rgba(22,32,26,0.28)]",
          "md:bottom-6 md:end-6 md:left-auto md:h-auto md:min-h-[56px] md:px-6 md:text-[0.85rem] md:shadow-[0_20px_40px_-15px_rgba(22,32,26,.6)]",
          "lg:end-auto lg:start-6",
          show || chat ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
        )}
        aria-label={tx({ ar: "مساعد نخلة", en: "Nakhla assistant" })}
      >
        <Chat className="h-5 w-5" />
        {tx({ ar: "اسأل نخلة", en: "Ask Nakhla" })}
      </button>

      {/* الشريط السفلي (جوال): اتصال · حجز · واتساب — dir=ltr يثبّت الترتيب جسدياً في اللغتين */}
      <div
        dir="ltr"
        className={cn(
          "fixed inset-x-0 bottom-0 z-[55] flex items-center gap-2.5 border-t border-sand bg-hajar shadow-[0_-6px_20px_rgba(22,32,26,0.08)] transition-transform duration-500 md:hidden",
          show ? "translate-y-0" : "translate-y-full"
        )}
        style={{ height: "var(--dock-h)", padding: "10px 14px calc(10px + env(safe-area-inset-bottom, 0px))" }}
      >
        <a
          href={`tel:${MAIN_PHONE.replace(/\s/g, "")}`}
          className="dock-btn grid h-14 w-14 shrink-0 place-items-center border border-sand text-palm"
          aria-label={tx({ ar: "اتصال", en: "Call" })}
        >
          <Phone className="h-6 w-6" />
        </a>
        <button
          onClick={() => open()}
          className="dock-btn dock-book cham flex h-14 min-w-0 flex-1 items-center justify-center gap-2 bg-bronze font-head text-[16px] font-bold text-hajar"
        >
          <span>{tx({ ar: "احجز موعدي", en: "Book an appointment" })}</span>
          <Arrow className="h-4 w-4" />
        </button>
        <a
          href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(tx({ ar: "السلام عليكم، أرغب بحجز موعد", en: "Hello, I'd like to book an appointment" }))}`}
          target="_blank"
          rel="noopener"
          className="dock-btn grid h-14 w-14 shrink-0 place-items-center border border-sand text-palm"
          aria-label={tx({ ar: "واتساب", en: "WhatsApp" })}
        >
          <WhatsApp className="h-6 w-6" />
        </a>
      </div>

      {/* نافذة المحادثة */}
      <div
        className={cn(
          "fixed z-[85] flex flex-col overflow-hidden bg-hajar shadow-[0_30px_80px_-20px_rgba(22,32,26,.7)] transition-all duration-500",
          "inset-x-3 bottom-[calc(var(--dock-h)_+_12px)] h-[min(70svh,540px)] md:inset-x-auto md:bottom-24 md:end-6 md:h-[560px] md:w-[390px] lg:end-auto lg:start-6",
          chat ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"
        )}
        role="dialog"
        aria-label={tx({ ar: "مساعد نخلة", en: "Nakhla assistant" })}
        aria-hidden={!chat}
      >
        <div className="on-dark flex items-center gap-3 bg-palm px-5 py-4 text-hajar">
          <LogoMark className="h-9 w-9 text-hajar" style={{ ["--logo-in" as string]: "#1F3D2B" }} />
          <div className="flex-1 leading-tight">
            <div className="font-head font-extrabold">{tx({ ar: "مساعد نخلة", en: "Nakhla assistant" })}</div>
            <div className="flex items-center gap-2 text-[0.75rem] text-hajar/70">
              <span className="h-2 w-2 rounded-full bg-[#7fd39a]" />
              {tx({ ar: "متصل · يردّ خلال ثوانٍ", en: "Online · replies in seconds" })}
            </div>
          </div>
          <button onClick={() => setChat(false)} className="grid h-11 w-11 place-items-center" aria-label="close">
            <Close className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-hajar-soft p-4">
          {msgs.map((m, i) => (
            <div key={i} className={cn("pop flex", m.from === "me" ? "justify-end" : "justify-start")}>
              <div className={cn("cham max-w-[85%] px-4 py-3 text-[0.92rem]", m.from === "me" ? "bg-bronze text-hajar" : "bg-hajar text-ink")} style={{ lineHeight: isAr ? 1.8 : 1.5 }}>
                {m.t}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex">
              <div className="cham bg-hajar px-4 py-3 text-ink/60">
                <span className="dot-typing inline-flex h-4 items-center">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            </div>
          )}
          <div ref={end} />
        </div>

        <div className="border-t border-sand bg-hajar p-3">
          <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
            {QUICK.map((q, i) => (
              <button key={i} onClick={() => reply(tx(q.l), tx(q.a))} className="cham min-h-[40px] shrink-0 border border-ink/25 px-4 font-head text-[0.78rem] font-bold hover:bg-ink hover:text-hajar">
                {tx(q.l)}
              </button>
            ))}
          </div>
          <form onSubmit={send} className="flex gap-2">
            <input value={val} onChange={(e) => setVal(e.target.value)} placeholder={tx({ ar: "اكتب سؤالك…", en: "Type your question…" })} className="field !min-h-[48px] flex-1" />
            <button type="submit" className="cham grid h-12 w-12 shrink-0 place-items-center bg-palm text-hajar" aria-label="send">
              <Arrow className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
