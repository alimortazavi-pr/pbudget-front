import {
  resolveMoneyDisplayUnit,
  type MoneyDisplayUnit,
  type UserCurrency,
} from "@/common/constants/user-preferences";

const STORAGE_KEY = "pdesk.money-display-unit";
const RIAL_MULTIPLIER = 10;

let activeUnit: MoneyDisplayUnit = "toman";
let initialized = false;

export function getMoneyDisplayUnit(): MoneyDisplayUnit {
  if (!initialized && typeof window !== "undefined") {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    activeUnit = resolveMoneyDisplayUnit(stored as MoneyDisplayUnit | null);
    initialized = true;
  }
  return activeUnit;
}

export function setMoneyDisplayUnit(value?: MoneyDisplayUnit | null) {
  activeUnit = resolveMoneyDisplayUnit(value);
  initialized = true;
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
