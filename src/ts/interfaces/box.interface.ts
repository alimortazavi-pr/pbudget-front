export interface IBoxState {
  boxes: IBox[] | null;
}

export interface IBox {
  _id: string;
  user: string;
  title: string | null;
  budget: number;
  deleted: boolean;
}

export interface ICreateAndEditBoxForm {
  title: string;
}

export interface IValidationErrorsCreateAndEditBoxForm {
  paths: string[];
  messages: {
    title: string;
  };
}

export interface IChangeBudgetBoxForm {
  price: string | number;
}

export interface IValidationErrorsChangeBudgetBoxForm {
  paths: string[];
  messages: {
    price: string;
  };
}
