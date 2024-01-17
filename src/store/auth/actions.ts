import { AppThunk } from "@/store";

//Actions of other store
import { setProfile } from "@/store/profile/actions";

//Reducer
import { authReducer } from "@/store/auth";

//Actions from reducer
export const { authenticate, setDidTryAutoLogin, logOut, setUsers } =
  authReducer.actions;

//Interfaces
import {
  ISaveToLocal,
  ISaveToLocalUser,
  ISignInForm,
  ISignUpForm,
} from "@/ts/interfaces/auth.interface";

//Tools
import api from "@/api";
import Cookies from "js-cookie";

//Actions from actions
export function autoLogin(token: string, users: ISaveToLocalUser[]): AppThunk {
  return async (dispatch) => {
    try {
      const res = await api.get("/auth/check", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await dispatch(
        authenticate({
          token: token,
        })
      );
      await dispatch(setProfile(res.data.user));
      await dispatch(setUsers(users));
    } catch (err: any) {
      if (err.response?.status === 401) {
        dispatch(logOutAction());
      } else {
        console.log(err);
      }
    }
  };
}

export function changeAccountAction(token: string): AppThunk {
  return async (dispatch, getState) => {
    try {
      const res = await api.get("/auth/check", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await dispatch(
        authenticate({
          token: token,
        })
      );
      await dispatch(setProfile(res.data.user));

      //Preparing users
      const users = [
        ...getState().auth.users.map((user) =>
          user._id === res.data.user._id
            ? { ...res.data.user, token: token }
            : user
        ),
      ];
      dispatch(setUsers(users));

      saveDataToLocal({ token: token, users: users });
    } catch (err: any) {
      if (err.response?.status === 401) {
        dispatch(logOutAction());
      } else {
        console.log(err);
      }
    }
  };
}

export function checkMobileExist(mobile: string): AppThunk {
  return async (dispatch) => {
    try {
      const res = await api.post("/auth/check-mobile-exist", { mobile });
      return res.data.isMustRegister;
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}

export function requestNewCode(mobile: string): AppThunk {
  return async (dispatch) => {
    try {
      const res = await api.post("/auth/request-code", { mobile });
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}

export function signUp(form: ISignUpForm): AppThunk {
  return async (dispatch, getState) => {
    try {
      const res = await api.post("/auth/register", form);
      dispatch(
        authenticate({
          token: res.data.token,
        })
      );
      dispatch(setProfile(res.data.user));

      //Preparing users
      const users = [
        ...getState().auth.users.filter(
          (user) => user._id !== res.data.user._id
        ),
        { ...res.data.user, token: res.data.token },
      ];
      dispatch(setUsers(users));

      saveDataToLocal({ token: res.data.token, users: users });
    } catch (err: any) {
      throw new Error(err.response.data?.message);
    }
  };
}

export function signIn(form: ISignInForm): AppThunk {
  return async (dispatch, getState) => {
    try {
      const res = await api.post("/auth/login", form);
      dispatch(
        authenticate({
          token: res.data.token,
        })
      );
      dispatch(setProfile(res.data.user));

      //Preparing users
      const users = [
        ...getState().auth.users.filter(
          (user) => user._id !== res.data.user._id
        ),
        { ...res.data.user, token: res.data.token },
      ];
      dispatch(setUsers(users));

      saveDataToLocal({ token: res.data.token, users: users });
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}

export function logOutAction(): AppThunk {
  return async (dispatch, getState) => {
    try {
      const usersFilter = getState().auth.users.filter(
        (user) => user.token !== getState().auth.token
      );
      const checkUsers = usersFilter.length > 0 ? usersFilter[0] : null;
      await dispatch(logOut({ user: checkUsers, users: usersFilter }));
      if (checkUsers) {
        await dispatch(setProfile(checkUsers));
        saveDataToLocal({ token: checkUsers.token, users: usersFilter });
        return false; //Has other users
      } else {
        Cookies.remove("userAuthorization");
        return true; //Hasn't other users
      }
    } catch (err: any) {
      throw new Error(err.response.data.message);
    }
  };
}

//Functions
export function saveDataToLocal({ token, users }: ISaveToLocal) {
  Cookies.set(
    "userAuthorization",
    JSON.stringify({
      token: token,
      users,
    }),
    { expires: 90 }
  );
}
