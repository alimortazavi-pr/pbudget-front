import { AppThunk } from "@/store";

//Reducer
import { creditReducer } from "@/store/credit";

//Actions from reducer
export const { setCredits, deleteCredit } = creditReducer.actions;

//Interfaces
import {
  ICredit,
  ICreateAndEditCreditForm,
} from "@/ts/interfaces/credit.interface";

//Enums
import { creditTypeEnum } from "@/ts/enums/credit.enum";

//Tools
import api from "@/api";

//Actions from actions
export function createCredit(
  form: ICreateAndEditCreditForm,
  budgetId: string
): AppThunk {
  return async (dispatch, getState) => {
    try {
      const res = await api.post(
        "/credits",
        {
          price: form.price.toString(),
          type: form.type,
          category: form.category,
          year: form.year.toString(),
          month: form.month.toString(),
          day: form.day.toString(),
          description: form.description.toString(),
          person: form.person.toString(),
          paid: new Boolean(form.paid),
          budget: budgetId,
        },
        {
          headers: {
            Authorization: `Bearer ${getState().auth.token}`,
          },
        }
      );
      await dispatch(
        setCredits({
          credits: getState().credit.credits
            ? [...(getState().credit.credits as ICredit[]), res.data.credit]
            : [res.data.credit],
          totalDebtPrice:
            res.data.credit.type === creditTypeEnum.DEBT
              ? getState().credit.totalDebtPrice + res.data.credit.price
              : getState().credit.totalDebtPrice,

          totalDuesPrice:
            res.data.credit.type === creditTypeEnum.DEBT
              ? getState().credit.totalDuesPrice + res.data.credit.price
              : getState().credit.totalDuesPrice,
        })
      );
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}

export function editCredit(
  form: ICreateAndEditCreditForm,
  creditId: string
): AppThunk {
  return async (dispatch, getState) => {
    try {
      const res = await api.put(
        `/credits/${creditId}`,
        {
          price: form.price.toString(),
          type: form.type,
          category: form.category,
          year: form.year.toString(),
          month: form.month.toString(),
          day: form.day.toString(),
          description: form.description.toString(),
          person: form.person.toString(),
          paid: new Boolean(form.paid),
        },
        {
          headers: {
            Authorization: `Bearer ${getState().auth.token}`,
          },
        }
      );

      let totalDebtPrice: number = 0;
      let totalDuesPrice: number = 0;
      const credits = getState().credit.credits?.map((credit) => {
        if (credit._id === res.data.credit._id) {
          if (res.data.credit.type === creditTypeEnum.DUES) {
            totalDuesPrice += credit.price;
          } else {
            totalDebtPrice += credit.price;
          }
          return res.data.credit;
        }
        if (credit.type === creditTypeEnum.DUES) {
          totalDuesPrice += credit.price;
        } else {
          totalDebtPrice += credit.price;
        }
        return credit;
      });

      await dispatch(
        setCredits({
          credits: credits || [],
          totalDebtPrice: totalDuesPrice,
          totalDuesPrice: totalDebtPrice,
        })
      );
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}

export function softDeleteCredit(credit: ICredit): AppThunk {
  return async (dispatch, getState) => {
    try {
      const res = await api.delete(`/credits/${credit._id}/soft`, {
        headers: {
          Authorization: `Bearer ${getState().auth.token}`,
        },
      });
      await dispatch(deleteCredit(credit));
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}
