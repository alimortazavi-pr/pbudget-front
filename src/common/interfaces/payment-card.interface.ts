export interface IPaymentCard {
  _id: string;
  title: string;
  bankName: string;
  lastFour: string;
  color: string;
  /** Opt-in: the app keeps this account's balance. */
  trackBalance?: boolean;
  initialBalance?: number;
}

export interface IPaymentCardState {
  cards: IPaymentCard[] | null;
}

export interface IAccountBalance {
  cardId: string;
  initialBalance: number;
  income: number;
  cost: number;
  transferIn: number;
  transferOut: number;
  balance: number;
}

export interface IAccountTransfer {
  _id: string;
  fromCard: string;
  toCard: string;
  amount: number;
  year: string | number;
  month: string | number;
  day: string | number;
  description?: string;
  createdAt?: string;
}
