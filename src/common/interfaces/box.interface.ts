export interface IBoxState {
  boxes: IBox[] | null;
}

export interface IBox {
  _id: string;
  title: string;
  budget: number;
  /** Savings target; 0 = none. */
  goal: number;
  user: string;
  deleted: boolean;
}

export interface ICreateAndEditBoxForm {
  title: string;
}

export interface IChangeBudgetBoxForm {
  price: number | string;
}
