const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

export function toEnglishDigits(value: string): string {
  return value.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
}

export function formatPrice(amount: number | string): string {
  const num = typeof amount === "string" ? parseInt(amount, 10) : amount;
  if (Number.isNaN(num)) return toPersianDigits("0");
  return toPersianDigits(num.toLocaleString("en-US"));
}
