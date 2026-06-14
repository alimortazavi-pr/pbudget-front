export interface ICategoryState {
  categories: ICategory[] | null;
}

export interface ICategoryParentRef {
  _id: string;
  title: string;
}

export interface ICategory {
  _id: string;
  title: string;
  user: string;
  deleted: boolean;
  parent?: string | ICategoryParentRef | null;
}

export interface ICreateAndEditCategoryForm {
  title: string;
  parentId?: string | null;
}
