import { AppThunk } from "@/store";

//Actions of other store
import { calculateUserBudget } from "../profile/actions";

//Reducer
import { budgetReducer } from "@/store/budget";

//Actions from reducer
export const { setBudgets, deleteBudget } = budgetReducer.actions;

//Interfaces
import {
  IBudget,
  ICreateAndEditBudgetForm,
} from "@/ts/interfaces/budget.interface";

//Tools
import api from "@/api";
import { budgetTypeEnum } from "@/ts/enums/budget.enum";

//Actions from actions
export function createBudget(form: ICreateAndEditBudgetForm): AppThunk {
  return async (dispatch, getState) => {
    try {
      const res = await api.post(
        "/budgets",
        {
          price: form.price.toString(),
          type: form.type,
          category: form.category,
          year: form.year,
          month: form.month,
          day: form.day,
        },
        {
          headers: {
            Authorization: `Bearer ${getState().auth.token}`,
          },
        }
      );
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}

export function editBudget(
  form: ICreateAndEditBudgetForm,
  budgetId: string
): AppThunk {
  return async (dispatch, getState) => {
    try {
      const res = await api.put(
        `/budgets/${budgetId}`,
        {
          price: form.price.toString(),
          type: form.type,
          category: form.category,
          year: form.year,
          month: form.month,
          day: form.day,
        },
        {
          headers: {
            Authorization: `Bearer ${getState().auth.token}`,
          },
        }
      );
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}

export function toggleIsDoneBudget(budgetId: string): AppThunk {
  return async (dispatch, getState) => {
    try {
      const res = await api.put(
        `/budgets/${budgetId}/toggle`,
        {},
        {
          headers: {
            Authorization: `Bearer ${getState().auth.token}`,
          },
        }
      );
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}

export function softDeleteBudget(budget: IBudget): AppThunk {
  return async (dispatch, getState) => {
    try {
      const res = await api.delete(`/budgets/${budget._id}/soft`, {
        headers: {
          Authorization: `Bearer ${getState().auth.token}`,
        },
      });
      await dispatch(deleteBudget(budget));
      await dispatch(
        calculateUserBudget(
          budget.type === budgetTypeEnum.INCOME ? -budget.price : +budget.price
        )
      );
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}
