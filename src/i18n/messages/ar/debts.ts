import type { MessageTree } from "../../types";

export const debtsMessages: MessageTree = {
  settled: "تمت التسوية",
  remaining: "المتبقي",
  sourceDetached: "تم فصل المعاملة المصدر",
  settlementDetached: "تم فصل التسوية",
  detachSettlement: "فصل التسوية",
  attachSource: "ربط المعاملة المصدر",
  attachSettlement: "ربط معاملة التسوية",
  settle: "تسوية",
  registerSettlement: "تسجيل التسوية",
  registerSettlements: "تسجيل {{count}} تسويات",
  noMatchingTransaction: "لم يُعثر على معاملة مناسبة. سجّل أولاً معاملة",
  incomeDeposit: "وارد (إيداع)",
  costWithdraw: "صادر (سحب)",
  registerFirst: ".",
  attachEmptySettlement:
    "لا توجد معاملة تسوية مطابقة. لـ {{kind}} تحتاج معاملة {{txType}} غير مستخدمة بعملة {{currency}}.",
  attachEmptySource:
    "لا توجد معاملة مصدر مطابقة. لـ {{kind}} تحتاج معاملة {{txType}} غير مستخدمة بعملة {{currency}}.",
  existingActiveTitle:
    "هناك بالفعل {{count}} عنصر/عناصر نشطة باسم «{{person}}»",
  existingActiveHint:
    "لتجنب التكرار، اختر عنصراً موجوداً للتسوية، أو أنشئ عنصراً جديداً إذا كان التزاماً جديداً فعلاً.",
  linkToExisting: "ربط والتسوية مع هذا العنصر",
  createNewAnyway: "إنشاء مستحق/دين جديد",
  creatingNewConfirmed: "أنت بصدد إنشاء عنصر جديد لهذا الاسم.",
  showExistingAgain: "عرض العناصر الموجودة",
  chooseLinkOrCreate:
    "هناك بالفعل {{count}} عنصر/عناصر نشطة باسم «{{person}}». اربط بموجود أو اختر إنشاء جديد.",
};
