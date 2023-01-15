import { PayloadAction } from "@reduxjs/toolkit";

//Interfaces
import { IAuthState } from "@/ts/interfaces/auth.interface";

//Tools
import Cookies from "js-cookie";

const reducers = {
  authenticate: (
    state: IAuthState,
    action: PayloadAction<{ token: string }>
  ) => {
    return {
      ...state,
      token: action.payload.token,
      didTryAutoLogin: true,
      isAuth: true,
    };
  },
  setDidTryAutoLogin: (state: IAuthState) => {
    return {
      ...state,
      didTryAutoLogin: true,
    };
  },
  logOut: (state: IAuthState) => {
    Cookies.remove("userAuthorization");
    return {
      ...state,
      didTryAutoLogin: true,
      isAuth: false,
    };
  },
};

export default reducers;
