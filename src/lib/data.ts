import type { Bi } from "./i18n";
import dr1 from "../assets/img/dr1.jpg";
import dr2 from "../assets/img/dr2.jpg";
import dr3 from "../assets/img/dr3.jpg";
import dr4 from "../assets/img/dr4.jpg";
import dr5 from "../assets/img/dr5.jpg";
import dr6 from "../assets/img/dr6.jpg";
import dr7 from "../assets/img/dr7.jpg";

/* بيانات مشتركة: الفروع والخدمات والأطباء والتواصل (قيم تجريبية للنموذج الأولي) */
export const WA_NUMBER = "966500000000";
export const MAIN_PHONE = "+966 14 000 0000";

export const SERVICES: { id: string; name: Bi }[] = [
  { id: "implant", name: { ar: "زراعة الأسنان", en: "Dental Implants" } },
  { id: "ortho", name: { ar: "التقويم", en: "Orthodontics" } },
  { id: "cosmetic", name: { ar: "تجميل الأسنان والابتسامة", en: "Cosmetic & Smile Design" } },
  { id: "endo", name: { ar: "علاج العصب", en: "Root Canal Therapy" } },
  { id: "kids", name: { ar: "طب أسنان الأطفال", en: "Pediatric Dentistry" } },
  { id: "gums", name: { ar: "علاج اللثة", en: "Periodontics" } },
  { id: "crown", name: { ar: "التركيبات والتيجان", en: "Crowns & Prosthetics" } },
];

export type Branch = {
  id: string;
  name: Bi;
  city: Bi;
  addr: Bi;
  phone: string;
  /** ساعات العمل: [فتح, إغلاق] بتوقيت الرياض */
  hours: [number, number];
  hoursFri: [number, number];
  hoursText: Bi;
  slot: Bi;
  map: string;
};

export const BRANCHES: Branch[] = [
  {
    id: "qiblatain",
    name: { ar: "فرع القبلتين", en: "Al-Qiblatain" },
    city: { ar: "المدينة المنورة", en: "Madinah" },
    addr: { ar: "حي القبلتين — بجوار مسجد القبلتين، المدينة المنورة", en: "Al-Qiblatain District, beside Masjid Al-Qiblatain, Madinah" },
    phone: "+966 14 000 0001",
    hours: [9, 22],
    hoursFri: [16, 22],
    hoursText: { ar: "السبت – الخميس ٩ ص – ١٠ م · الجمعة ٤ م – ١٠ م", en: "Sat–Thu 9am–10pm · Fri 4pm–10pm" },
    slot: { ar: "أقرب موعد: اليوم ٦:٣٠ م", en: "Next slot: today 6:30 pm" },
    map: "https://maps.google.com/?q=Al+Qiblatain+Madinah",
  },
  {
    id: "aziziyah",
    name: { ar: "فرع العزيزية", en: "Al-Aziziyah" },
    city: { ar: "المدينة المنورة", en: "Madinah" },
    addr: { ar: "حي العزيزية — طريق الأمير عبدالمحسن، المدينة المنورة", en: "Al-Aziziyah District, Prince Abdulmohsen Rd, Madinah" },
    phone: "+966 14 000 0002",
    hours: [10, 23],
    hoursFri: [16, 23],
    hoursText: { ar: "السبت – الخميس ١٠ ص – ١١ م · الجمعة ٤ م – ١١ م", en: "Sat–Thu 10am–11pm · Fri 4pm–11pm" },
    slot: { ar: "أقرب موعد: اليوم ٨:٠٠ م", en: "Next slot: today 8:00 pm" },
    map: "https://maps.google.com/?q=Al+Aziziyah+Madinah",
  },
  {
    id: "hail",
    name: { ar: "فرع حائل", en: "Ha'il" },
    city: { ar: "حائل", en: "Ha'il" },
    addr: { ar: "حي النقرة — طريق الملك عبدالعزيز، حائل", en: "Al-Naqra District, King Abdulaziz Rd, Ha'il" },
    phone: "+966 16 000 0003",
    hours: [10, 22],
    hoursFri: [16, 22],
    hoursText: { ar: "السبت – الخميس ١٠ ص – ١٠ م · الجمعة ٤ م – ١٠ م", en: "Sat–Thu 10am–10pm · Fri 4pm–10pm" },
    slot: { ar: "أقرب موعد: غداً ١١:٠٠ ص", en: "Next slot: tomorrow 11:00 am" },
    map: "https://maps.google.com/?q=Hail+Saudi+Arabia",
  },
];

export type Doctor = {
  id: string;
  img: string;
  name: Bi;
  spec: Bi;
  role: Bi;
  years: number;
  branch: Bi;
  bio: Bi;
  /** التخصص كمعرّف خدمة — يستخدمه نموذج الحجز لتصفية الأطباء (SERVICES.id) */
  svc: (typeof SERVICES)[number]["id"];
  /** الفروع التي يوجد فيها الطبيب (BRANCHES.id) — لتصفية الأطباء في الحجز */
  branches: string[];
};

export const DOCTORS: Doctor[] = [
  {
    id: "harbi",
    img: dr1,
    name: { ar: "د. عبدالرحمن الحربي", en: "Dr. Abdulrahman Al-Harbi" },
    spec: { ar: "زراعة الأسنان", en: "Implantology" },
    role: { ar: "المؤسس · استشاري جراحة الفم والفكين", en: "Founder · Oral & maxillofacial consultant" },
    years: 25,
    branch: { ar: "القبلتين", en: "Al-Qiblatain" },
    bio: { ar: "زمالة في زراعة الأسنان من ألمانيا. نفّذ أكثر من ٦٬٨٠٠ زرعة، ويراجع شخصياً كل خطة جراحية في العيادات.", en: "Implant fellowship in Germany. Over 6,800 implants placed — and he personally reviews every surgical plan in the clinics." },
    svc: "implant",
    branches: ["qiblatain"],
  },
  {
    id: "shammari",
    img: dr2,
    name: { ar: "د. نورة الشمري", en: "Dr. Noura Al-Shammari" },
    spec: { ar: "التقويم", en: "Orthodontics" },
    role: { ar: "استشارية تقويم الأسنان", en: "Orthodontics consultant" },
    years: 14,
    branch: { ar: "حائل", en: "Ha'il" },
    bio: { ar: "معتمدة في التقويم الشفاف الرقمي. تؤمن أن أجمل تقويم هو الذي ينتهي في أقل وقت ممكن.", en: "Certified in digital clear aligners. She believes the best orthodontics is the kind that finishes in the shortest possible time." },
    svc: "ortho",
    branches: ["hail"],
  },
  {
    id: "otaibi",
    img: dr3,
    name: { ar: "د. فيصل العتيبي", en: "Dr. Faisal Al-Otaibi" },
    spec: { ar: "تجميل الابتسامة", en: "Smile design" },
    role: { ar: "استشاري تجميل الأسنان وتصميم الابتسامة", en: "Cosmetic dentistry & smile design consultant" },
    years: 12,
    branch: { ar: "القبلتين · العزيزية", en: "Qiblatain · Aziziyah" },
    bio: { ar: "يصمّم كل ابتسامة على ملامح صاحبها. يرفض القشور المبالغ فيها ويعتبر الطبيعية معياراً لا خياراً.", en: "He designs each smile around its owner's features. He refuses over-sized veneers and treats natural as a standard, not an option." },
    svc: "cosmetic",
    branches: ["qiblatain", "aziziyah"],
  },
  {
    id: "juhani",
    img: dr4,
    name: { ar: "د. ريم الجهني", en: "Dr. Reem Al-Juhani" },
    spec: { ar: "علاج العصب", en: "Endodontics" },
    role: { ar: "أخصائية علاج العصب بالمجهر", en: "Microscopic endodontics specialist" },
    years: 9,
    branch: { ar: "العزيزية", en: "Al-Aziziyah" },
    bio: { ar: "تُعرف بين زملائها بـ«صاحبة الجلسة الواحدة». تعالج أعقد القنوات تحت المجهر بهدوء يطمئن المريض.", en: "Known among colleagues as “the one-session specialist.” She treats the most complex canals under the microscope with a calm that reassures." },
    svc: "endo",
    branches: ["aziziyah"],
  },
  {
    id: "rashidi",
    img: dr5,
    name: { ar: "د. سلطان الرشيدي", en: "Dr. Sultan Al-Rashidi" },
    spec: { ar: "اللثة", en: "Periodontics" },
    role: { ar: "استشاري أمراض اللثة والليزر", en: "Periodontics & laser consultant" },
    years: 16,
    branch: { ar: "حائل", en: "Ha'il" },
    bio: { ar: "من أبناء حائل. يرى أن اللثة هي أساس كل ابتسامة، ويقدّم لمرضاه برنامج متابعة لا ينتهي بانتهاء العلاج.", en: "A son of Ha'il. He sees the gum as the foundation of every smile, and gives patients a follow-up programme that outlasts the treatment." },
    svc: "gums",
    branches: ["hail"],
  },
  {
    id: "mutairi",
    img: dr6,
    name: { ar: "د. لمى المطيري", en: "Dr. Lama Al-Mutairi" },
    spec: { ar: "طب أسنان الأطفال", en: "Pediatric dentistry" },
    role: { ar: "أخصائية طب أسنان الأطفال", en: "Pediatric dentistry specialist" },
    years: 8,
    branch: { ar: "القبلتين", en: "Al-Qiblatain" },
    bio: { ar: "تبدأ كل زيارة بقصة قصيرة لا بمرآة. لا يخرج طفلٌ من عيادتها إلا ويريد أن يعود.", en: "Every visit begins with a short story, not a mirror. No child leaves her room without wanting to come back." },
    svc: "kids",
    branches: ["qiblatain"],
  },
  {
    id: "anazi",
    img: dr7,
    name: { ar: "د. ماجد العنزي", en: "Dr. Majed Al-Anazi" },
    spec: { ar: "التركيبات والتيجان", en: "Prosthodontics" },
    role: { ar: "استشاري التركيبات السنية", en: "Prosthodontics consultant" },
    years: 21,
    branch: { ar: "العزيزية · حائل", en: "Aziziyah · Ha'il" },
    bio: { ar: "حرفيّ بالمعنى القديم للكلمة. يراجع كل تاج بعينه قبل أن يصل إليك، ولا يسلّم عملاً لا يرضى أن يضعه في فمه.", en: "A craftsman in the old sense. He inspects every crown himself before it reaches you, and never hands over work he wouldn't place in his own mouth." },
    svc: "crown",
    branches: ["aziziyah", "hail"],
  },
];

/** هل الفرع مفتوح الآن؟ (بتوقيت الرياض) */
export function isOpen(b: Branch): boolean {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Riyadh",
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).formatToParts(new Date());
    const day = parts.find((p) => p.type === "weekday")?.value;
    const h = Number(parts.find((p) => p.type === "hour")?.value) % 24;
    const m = Number(parts.find((p) => p.type === "minute")?.value);
    const mins = h * 60 + m;
    const [o, c] = day === "Fri" ? b.hoursFri : b.hours;
    return mins >= o * 60 && mins < c * 60;
  } catch {
    return true;
  }
}
