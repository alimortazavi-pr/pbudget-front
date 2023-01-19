export interface ICategoryState {
  categories: ICategory[] | null;
}

export interface ICategory {
  _id: string;
  user: string;
  title: string | null;
  deleted: boolean;
}

export interface ICreateAndEditCategoryForm {
  title: string;
}

export interface IValidationErrorsCreateAndEditCategoryForm {
  paths: string[];
  messages: {
    title: string;
  };
}
