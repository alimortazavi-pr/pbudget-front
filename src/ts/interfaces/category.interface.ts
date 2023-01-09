export interface ICategoryState {
  categories: ICategory[];
}

export interface ICategory {
  _id: string;
  user: string;
  title: string;
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
