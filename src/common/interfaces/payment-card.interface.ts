export interface IPaymentCard {
  _id: string;
  title: string;
  bankName: string;
  lastFour: string;
  color: string;
}

export interface IPaymentCardState {
  cards: IPaymentCard[] | null;
}
