import { AppThunk } from "@/store";

//Reducer
import { profileReducer } from "@/store/profile";

//Actions from reducer
export const { setProfile, calculateUserBudget } = profileReducer.actions;

//Interfaces
import { IEditProfileForm } from "@/ts/interfaces/profile.interface";

//Tools
import api from "@/api";

//Actions from actions
export function getProfile(): AppThunk {
  return async (dispatch, getState) => {
    try {
      if (getState().auth.isAuth) {
        const res = await api.get(`/users/profile`, {
          headers: {
            Authorization: `Bearer ${getState().auth.token}`,
          },
        });
        await dispatch(setProfile(res.data.user));
      }
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}

export function editProfile(form: IEditProfileForm): AppThunk {
  return async (dispatch, getState) => {
    try {
      if (getState().auth.isAuth) {
        const res = await api.put(`/users/profile`, form, {
          headers: {
            Authorization: `Bearer ${getState().auth.token}`,
          },
        });
        await dispatch(setProfile(res.data.user));
      }
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}

export function changeUserBudget(price: number): AppThunk {
  return async (dispatch, getState) => {
    try {
      if (getState().auth.isAuth) {
        const res = await api.put(
          `/users/profile/change-budget`,
          { price },
          {
            headers: {
              Authorization: `Bearer ${getState().auth.token}`,
            },
          }
        );
        await dispatch(setProfile(res.data.user));
      }
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}
