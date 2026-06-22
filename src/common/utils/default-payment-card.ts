import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";

const STORAGE_PREFIX = "pbudget-default-payment-card";

function storageKey(userId?: string | null) {
  return userId ? `${STORAGE_PREFIX}:${userId}` : STORAGE_PREFIX;
}

export function getDefaultPaymentCardId(userId?: string | null): string | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(storageKey(userId));
  return value || null;
}

export function setDefaultPaymentCardId(
  cardId: string | null,
  userId?: string | null,
) {
  if (typeof window === "undefined") return;
  const key = storageKey(userId);
  if (!cardId) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, cardId);
}

export function resolveDefaultPaymentCardId(
  cards: IPaymentCard[],
  userId?: string | null,
): string {
  const storedId = getDefaultPaymentCardId(userId);
  if (!storedId) return "";
  return cards.some((card) => card._id === storedId) ? storedId : "";
}
