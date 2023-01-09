import { AppThunk } from "@/store";

//Actions of other store

//Reducer
import { categoryReducer } from "@/store/category";

//Actions from reducer
export const { setCategories } = categoryReducer.actions;

//Interfaces
import {
  ICategory,
  ICreateAndEditCategoryForm,
} from "@/ts/interfaces/category.interface";

//Tools
import api from "@/api";

//Actions from actions
export function getCategories(): AppThunk {
  return async (dispatch, getState) => {
    try {
      const res = await api.get(`/categories`, {
        headers: {
          Authorization: `Bearer ${getState().auth.token}`,
        },
      });
      dispatch(setCategories(res.data.categories));
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}

export function createCategory(form: ICreateAndEditCategoryForm): AppThunk {
  return async (dispatch, getState) => {
    try {
      const res = await api.post("/categories", form, {
        headers: {
          Authorization: `Bearer ${getState().auth.token}`,
        },
      });
      dispatch(
        setCategories([...getState().category.categories, res.data.category])
      );
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}

export function editCategory(
  form: ICreateAndEditCategoryForm,
  category: ICategory
): AppThunk {
  return async (dispatch, getState) => {
    try {
      const res = await api.put(`/categories/${category._id}`, form, {
        headers: {
          Authorization: `Bearer ${getState().auth.token}`,
        },
      });
      dispatch(
        setCategories([
          ...getState().category.categories.map((cat) =>
            cat._id === category._id ? res.data.category : cat
          ),
        ])
      );
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}

export function softDeleteCategory(category: ICategory): AppThunk {
  return async (dispatch, getState) => {
    try {
      const res = await api.delete(`/categories/${category._id}/soft`, {
        headers: {
          Authorization: `Bearer ${getState().auth.token}`,
        },
      });
      dispatch(
        setCategories([
          ...getState().category.categories.filter(
            (cat) => cat._id !== category._id
          ),
        ])
      );
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}
