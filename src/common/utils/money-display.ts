import {
  resolveMoneyDisplayUnit,
  type MoneyDisplayUnit,
  type UserCurrency,
} from "@/common/constants/user-preferences";

const STORAGE_KEY = "pdesk.money-display-unit";
const RIAL_MULTIPLIER = 10;

let activeUnit: MoneyDisplayUnit = "toman";

/**
 * The unit amounts render in right now. It starts as toman (what the server
 * renders) and MoneyDisplayBoundary switches it after hydration, so the first
 * client render always matches the server HTML.
 */
export function getMoneyDisplayUnit(): MoneyDisplayUnit {
  return activeUnit;
}

/** The unit remembered on this device (used until the profile has loaded). */
export function readStoredMoneyDisplayUnit(): MoneyDisplayUnit {
  if (typeof window === "undefined") return "toman";
  try {
    return resolveMoneyDisplayUnit(window.localStorage.getItem(STORAGE_KEY) as MoneyDisplayUnit | null);
  } catch {
    return "toman";
  }
}

export function setMoneyDisplayUnit(value?: MoneyDisplayUnit | null) {
  activeUnit = resolveMoneyDisplayUnit(value);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, activeUnit);
    window.dispatchEvent(
      new CustomEvent("pdesk:money-display-unit", { detail: activeUnit }),
    );
  }
}

export function tomanToDisplayAmount(
  amount: number,
  unit: MoneyDisplayUnit = getMoneyDisplayUnit(),
) {
  return unit === "rial" ? amount * RIAL_MULTIPLIER : amount;
}

export function displayAmountToToman(
  amount: number,
  unit: MoneyDisplayUnit = getMoneyDisplayUnit(),
) {
  return unit === "rial" ? amount / RIAL_MULTIPLIER : amount;
}

export function moneyDisplayUnitLabel(
  unit: MoneyDisplayUnit = getMoneyDisplayUnit(),
) {
  return unit === "rial" ? "ریال" : "تومان";
}

export function shouldConvertToman(currency?: UserCurrency | null) {
  return !currency || currency === "toman";
}
