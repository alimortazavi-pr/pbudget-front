import { toEnglishDigits, toPersianDigits } from "@/common/utils";

/** Left-to-right embed — keeps grouped card digits in order inside RTL UI */
const LTR_EMBED = "\u200E";

export function normalizeCardNumber(value: string, maxLength = 16) {
  return toEnglishDigits(value).replace(/\D/g, "").slice(0, maxLength);
}

/** Card number display — 16 digits grouped; middle 4 as •••• 1234 */
export function formatCardNumberDisplay(value?: string | null, maskMiddle = false) {
  const digits = normalizeCardNumber(value ?? "");
  if (!digits) return "";

  if (digits.length === 16) {
    if (maskMiddle) {
      return toPersianDigits(
        `${digits.slice(0, 4)} •••• •••• ${digits.slice(12)}`,
      );
    }
    return toPersianDigits(
      `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12)}`,
    );
  }

  if (digits.length <= 4) {
    return digits ? toPersianDigits(`•••• ${digits}`) : "";
  }

  return toPersianDigits(digits);
}

/** Same as formatCardNumberDisplay with LTR direction for RTL UI */
export function formatCardNumberForDisplay(value?: string | null, maskMiddle = false) {
  const formatted = formatCardNumberDisplay(value, maskMiddle);
  return formatted ? `${LTR_EMBED}${formatted}` : "";
}

export function paymentCardSubtitle(
  bankName?: string,
  cardNumber?: string | null,
  maskMiddle = false,
) {
  const formatted = formatCardNumberForDisplay(cardNumber, maskMiddle);
  return [bankName?.trim(), formatted].filter(Boolean).join(" · ");
}
