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
  kind?: "default" | "project";
  parent?: string | ICategoryParentRef | null;
  color?: string;
  monthlyLimit?: number;
}

export interface ICreateAndEditCategoryForm {
  title: string;
  parentId?: string | null;
  kind?: "default" | "project";
  color?: string;
  monthlyLimit?: string | number;
}
