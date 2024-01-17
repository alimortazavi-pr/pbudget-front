import { PayloadAction } from "@reduxjs/toolkit";

//Interfaces
import { IAuthState, ISaveToLocalUser } from "@/ts/interfaces/auth.interface";

//Tools

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
  setUsers: (state: IAuthState, action: PayloadAction<ISaveToLocalUser[]>) => {
    return {
      ...state,
      users: action.payload,
    };
  },
  setDidTryAutoLogin: (state: IAuthState) => {
    return {
      ...state,
      didTryAutoLogin: true,
    };
  },
  logOut: (
    state: IAuthState,
    action: PayloadAction<{
      users: ISaveToLocalUser[];
      user: ISaveToLocalUser | null;
    }>
  ): IAuthState => {
    return {
      token: action.payload.user ? action.payload.user.token : null,
      users: action.payload.users,
      didTryAutoLogin: true,
      isAuth: action.payload.user ? true : false,
    };
  },
};

export default reducers;
