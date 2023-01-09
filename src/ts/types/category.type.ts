import { Dispatch, SetStateAction } from "react";
import { ICategory } from "../interfaces/category.interface";

export type createCategoryModalProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export type editCategoryModalProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  category: ICategory;
  setCategoryEdit: Dispatch<SetStateAction<ICategory | null | undefined>>;
};

export type theCategoriesProps = {};

export type singleCategoryProps = {
  category: ICategory;
  setCategoryEdit: Dispatch<SetStateAction<ICategory | null | undefined>>;
  onOpen: () => void;
};
