import { AppThunk } from "@/store";

//Actions of other store
import { calculateUserBudget, setProfile } from "../profile/actions";

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
          year: form.year.toString(),
          month: form.month.toString(),
          day: form.day.toString(),
          description: form.description.toString(),
        },
        {
          headers: {
            Authorization: `Bearer ${getState().auth.token}`,
          },
        }
      );
      await dispatch(
        setBudgets({
          budgets: getState().budget.budgets
            ? [...(getState().budget.budgets as IBudget[]), res.data.budget]
            : [res.data.budget],
          totalCostPrice:
            res.data.budget.type === budgetTypeEnum.COST
              ? getState().budget.totalCostPrice + res.data.budget.price
              : getState().budget.totalCostPrice,

          totalIncomePrice:
            res.data.budget.type === budgetTypeEnum.COST
              ? getState().budget.totalIncomePrice + res.data.budget.price
              : getState().budget.totalIncomePrice,
        })
      );
      await dispatch(
        setProfile({ ...getState().profile.user, budget: res.data.userBudget })
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
          year: form.year.toString(),
          month: form.month.toString(),
          day: form.day.toString(),
          description: form.description.toString(),
        },
        {
          headers: {
            Authorization: `Bearer ${getState().auth.token}`,
          },
        }
      );

      let totalCostPrice: number = 0;
      let totalIncomePrice: number = 0;
      const budgets = getState().budget.budgets?.map((budget) => {
        if (budget._id === res.data.budget._id) {
          if (res.data.budget.type === budgetTypeEnum.INCOME) {
            totalIncomePrice += budget.price;
          } else {
            totalCostPrice += budget.price;
          }
          return res.data.budget;
        }
        if (budget.type === budgetTypeEnum.INCOME) {
          totalIncomePrice += budget.price;
        } else {
          totalCostPrice += budget.price;
        }
        return budget;
      });

      await dispatch(
        setBudgets({
          budgets: budgets || [],
          totalCostPrice: totalIncomePrice,
          totalIncomePrice: totalCostPrice,
        })
      );
      await dispatch(
        setProfile({ ...getState().profile.user, budget: res.data.userBudget })
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
        setProfile({ ...getState().profile.user, budget: res.data.userBudget })
      );
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}
