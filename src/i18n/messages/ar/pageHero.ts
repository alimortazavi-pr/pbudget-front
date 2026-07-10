import type { MessageTree } from "../../types";

export const pageHeroMessages: MessageTree = {
  shared: {
    backToProject: "العودة إلى المشروع",
    allProjectsLink: "جميع المشاريع",
    enableTimeTrackingHint:
      "يمكنك تفعيل تسجيل ساعات العمل من إعدادات المشروع.",
  },
  notes: {
    eyebrow: "ملاحظات مالية",
    description:
      "نص حر وقوائم تحقق في صفحة واحدة، مع تصنيف منفصل عن المعاملات.",
    durationGeneral: "عام",
  },
  tasks: {
    eyebrow: "التخطيط والمتابعة",
    description:
      "خطط يومية وشهرية وسنوية — كلها بتواريخ التقويم وروابط للمشاريع.",
  },
  workAttendance: {
    eyebrow: "المشاريع",
    title: "حضور العمل",
    description:
      "حدد الساعات اليومية لكل مشروع — يُحسب الهدف الشهري مع الجمعة والعطل الرسمية.",
    tabToday: "اليوم",
    tabAllProjects: "جميع المشاريع",
    todayProjectsTitle: "مشاريع اليوم",
    allProjectsTitle: "المشاريع",
    noActiveProjectsToday:
      "اليوم ليس يوم عمل أو ليس لديك مشاريع نشطة.",
    todayWorked: "اليوم: {{duration}}",
    todayWorkedInline: " · اليوم {{duration}}",
    dailyHoursSum: "مجموع الساعات اليومية للمشاريع:",
    setDailyHoursHint: "حدد الساعات اليومية لكل مشروع من التفاصيل.",
    dailyHoursNotSet: "لم تُحدد الساعات اليومية — اضبطها من تفاصيل المشروع",
  },
  projects: {
    eyebrow: "إدارة المشاريع",
    description:
      "اطلع على إجمالي العقد والمدفوعات الصغيرة وملاحظات الاجتماعات في مكان واحد.",
  },
  projectAttendance: {
    eyebrow: "حضور المشروع",
    description:
      "تسجيل الدخول والخروج، إدخال الوقت يدوياً، وتحليل العمل لهذا المشروع",
    disabledDescription: "هذا المشروع لا يتطلب تسجيل ساعات العمل.",
  },
  installments: {
    eyebrow: "التخطيط المالي",
    description:
      "أنشئ خطط دفع؛ اعرض الأقساط والمدفوعات والمعاملات في صفحة كل خطة.",
  },
  checks: {
    eyebrow: "إدارة الشيكات",
    description:
      "سجّل الشيكات الواردة والصادرة مع الاستحقاق والتسوية التلقائية إلى المعاملات.",
    recordButton: "تسجيل شيك",
  },
  commitments: {
    eyebrow: "التزامات متغيرة",
    description:
      "مبالغ تتغير باستمرار — صدقة أو إكرامية أو ديون صغيرة لم تُسجَّل نهائياً بعد.",
  },
  debts: {
    eyebrow: "إدارة الالتزامات المالية",
    description:
      "افتح أي مستحق أو دين؛ اعرض التسويات والمعاملات والتحليل في صفحة واحدة.",
  },
  analysis: {
    eyebrow: "مركز التحليل المالي",
    title: "تحليل مالي شامل",
    description:
      "مخططات تفاعلية للدخل والمصروف، توزيع الفئات، الاتجاهات الزمنية، ورؤى عملية لاتخاذ قرارات أفضل.",
    loading: "جارٍ تجهيز التحليل والمخططات…",
    noData: "لا توجد بيانات لعرض المخططات.",
  },
  ventures: {
    eyebrow: "التعاون والشراكة",
    title: "الأعمال والشركاء",
    description:
      "للشراكات التي ليست مشاريع فقط — مطاعم، متاجر، استثمارات مشتركة وأي عمل آخر.",
    newButton: "عمل جديد",
  },
  invites: {
    title: "دعوات التعاون",
    description: "دعوات التعاون في المشاريع — اقبل أو ارفض",
    pendingCount: "{{count}} دعوة قيد الانتظار",
  },
};
