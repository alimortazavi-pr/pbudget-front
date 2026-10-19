import { axiosInstance } from "@/common/axiosInstance";
import type {
  IAccountBalance,
  IAccountTransfer,
  IPaymentCard,
} from "@/common/interfaces/payment-card.interface";

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
  trackBalance?: boolean;
  initialBalance?: string;
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
    trackBalance?: boolean;
    initialBalance?: string;
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

/** Balances of the accounts that opted in to tracking (others are not listed). */
export async function fetchAccountBalances() {
  const { data } = await axiosInstance.get<{ balances: IAccountBalance[] }>(
    "/payment-cards/balances",
  );
  return data.balances;
}

export async function fetchAccountTransfers() {
  const { data } = await axiosInstance.get<{ transfers: IAccountTransfer[] }>(
    "/payment-cards/transfers",
  );
  return data.transfers;
}

export async function createAccountTransfer(payload: {
  fromCardId: string;
  toCardId: string;
  amount: string;
  year: string;
  month: string;
  day: string;
  description?: string;
}) {
  const { data } = await axiosInstance.post<{ transfer: IAccountTransfer }>(
    "/payment-cards/transfers",
    payload,
  );
  return data.transfer;
}

export async function deleteAccountTransfer(id: string) {
  await axiosInstance.delete(`/payment-cards/transfers/${id}`);
}
