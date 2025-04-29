import { AppThunk } from "@/store";

//Actions of other store

//Reducer
import { boxReducer } from "@/store/box";

//Actions from reducer
export const { setBoxes } = boxReducer.actions;

//Interfaces
import {
  IBox,
  IChangeBudgetBoxForm,
  ICreateAndEditBoxForm,
} from "@/ts/interfaces/box.interface";

//Tools
import api from "@/api";
import moment from "jalali-moment";

//Actions from actions
export function getBoxes(): AppThunk {
  return async (dispatch, getState) => {
    try {
      const res = await api.get(`/boxes`, {
        headers: {
          Authorization: `Bearer ${getState().auth.token}`,
        },
      });
      dispatch(setBoxes(res.data.boxes));
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}

export function createBox(form: ICreateAndEditBoxForm): AppThunk {
  return async (dispatch, getState) => {
    try {
      const res = await api.post("/boxes", form, {
        headers: {
          Authorization: `Bearer ${getState().auth.token}`,
        },
      });
      dispatch(setBoxes([...(getState().box.boxes as IBox[]), res.data.box]));
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}

export function editBox(form: ICreateAndEditBoxForm, box: IBox): AppThunk {
  return async (dispatch, getState) => {
    try {
      const res = await api.put(`/boxes/${box._id}`, form, {
        headers: {
          Authorization: `Bearer ${getState().auth.token}`,
        },
      });
      dispatch(
        setBoxes([
          ...(getState().box.boxes as IBox[]).map((cat) =>
            cat._id === box._id ? res.data.box : cat
          ),
        ])
      );
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}

export function changeBoxBudget(
  form: IChangeBudgetBoxForm,
  box: IBox
): AppThunk {
  return async (dispatch, getState) => {
    try {
      const now = moment().locale("fa");
      const res = await api.put(
        `/boxes/change-budget/${box._id}`,
        {
          ...form,
          price: form.price.toString(),
          year: now.year().toString(),
          month: (now.month() + 1).toString(),
          day: now.date().toString(),
        },
        {
          headers: {
            Authorization: `Bearer ${getState().auth.token}`,
          },
        }
      );
      dispatch(
        setBoxes([
          ...(getState().box.boxes as IBox[]).map((bx) =>
            bx._id === box._id ? res.data.box : bx
          ),
        ])
      );
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}

export function softDeleteBox(box: IBox): AppThunk {
  return async (dispatch, getState) => {
    try {
      const now = moment().locale("fa");
      await api.put(
        `/boxes/${box._id}/soft`,
        {
          year: now.year().toString(),
          month: (now.month() + 1).toString(),
          day: now.date().toString(),
        },
        {
          headers: {
            Authorization: `Bearer ${getState().auth.token}`,
          },
        }
      );
      dispatch(
        setBoxes([
          ...(getState().box.boxes as IBox[]).filter(
            (cat) => cat._id !== box._id
          ),
        ])
      );
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}
