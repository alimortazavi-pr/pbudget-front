export interface ICredit {
  _id: string;
  budget: string;
  type: number;
  personName: string;
  price: number;
  isPaid: boolean;
  year: string;
  month: string;
  day: string;
  user: string;
}

export interface ICreateAndEditCreditForm {
  type: number;
  personName: string;
  price: string | number;
  isPaid: boolean;
  year: string;
  month: string;
  day: string;
}
