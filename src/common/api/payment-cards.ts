import { axiosInstance } from "@/common/axiosInstance";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";

export async function fetchPaymentCards() {
  const { data } = await axiosInstance.get<{ cards: IPaymentCard[] }>(
    "/payment-cards",
  );
  return data.cards;
}

export async function createPaymentCard(payload: {
  title: string;
  bankName?: string;
  lastFour?: string;
  color?: string;
}) {
  const { data } = await axiosInstance.post<{ card: IPaymentCard }>(
    "/payment-cards",
    payload,
  );
  return data.card;
}

export async function updatePaymentCard(
  id: string,
  payload: {
    title?: string;
    bankName?: string;
    lastFour?: string;
    color?: string;
  },
) {
  const { data } = await axiosInstance.put<{ card: IPaymentCard }>(
    `/payment-cards/${id}`,
    payload,
  );
  return data.card;
}

export async function softDeletePaymentCard(id: string) {
  await axiosInstance.delete(`/payment-cards/${id}/soft`);
}
