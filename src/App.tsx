import { LangProvider } from "./lib/i18n";
import { BookingProvider } from "./components/Booking";
import { GlobalPalmLight } from "./components/Palm";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Trust } from "./components/Trust";
import { BeforeAfter } from "./components/BeforeAfter";
import { Specialties } from "./components/Specialties";
import { WhyUs } from "./components/WhyUs";
import { Founder } from "./components/Founder";
import { Doctors } from "./components/Doctors";
import { Journey } from "./components/Journey";
import { Technology } from "./components/Technology";
import { Testimonials } from "./components/Testimonials";
import { Installments } from "./components/Installments";
import { Offers } from "./components/Offers";
import { Branches } from "./components/Branches";
import { Faq } from "./components/Faq";
import { FinalCta } from "./components/FinalCta";
import { Footer } from "./components/Footer";
import { Dock } from "./components/Dock";
import { OfferPopup } from "./components/OfferPopup";

/* ============================================================
   نخلة لطب الأسنان — الصفحة الرئيسية
   الترتيب المعتمد (مع تقديم «قبل وبعد» لرفع التحويل):
   انبهار (هيرو) ← دليل (أرقام ثم نتائج) ← خدمات ← ثقة (ميثاق، مؤسس، أطباء)
   ← طمأنينة (رحلة، تقنية، آراء) ← تيسير (تقسيط، عروض) ← حجز (فروع، أسئلة، باب).
   ============================================================ */
export default function App() {
  return (
    <LangProvider>
      <BookingProvider>
        <GlobalPalmLight />
        {/* ١) الهيدر والتنقل */}
        <Header />
        <main>
          {/* ٢) الواجهة الرئيسية */}
          <Hero />
          {/* ٣) مؤشرات الثقة والإنجازات */}
          <Trust />
          {/* ٤) قبل وبعد */}
          <BeforeAfter />
          {/* ٥) التخصصات السبعة */}
          <Specialties />
          {/* ٦) لماذا نحن */}
          <WhyUs />
          {/* ٧) كلمة المؤسس */}
          <Founder />
          {/* ٨) فريق الأطباء والاستشاريين */}
          <Doctors />
          {/* ٩) رحلة المريض */}
          <Journey />
          {/* ١٠) التقنيات والتعقيم */}
          <Technology />
          {/* ١١) آراء المرضى */}
          <Testimonials />
          {/* ١٢) التقسيط والتأمين */}
          <Installments />
          {/* ١٣) العروض الحصرية */}
          <Offers />
          {/* ١٤) الفروع والتواصل */}
          <Branches />
          {/* ١٥) الأسئلة الشائعة */}
          <Faq />
          {/* ١٦) الدعوة النهائية للحجز */}
          <FinalCta />
        </main>
        {/* ١٧) الفوتر */}
        <Footer />
        <Dock />
        {/* ١٨) نظام العرض الذكي: نافذة سطح المكتب + شريط الجوال (٣٠٪ تمرير) */}
        <OfferPopup />
      </BookingProvider>
    </LangProvider>
  );
}
