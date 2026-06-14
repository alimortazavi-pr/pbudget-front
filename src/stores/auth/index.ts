import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { IAuthState, ISaveToLocalUser } from "@/common/interfaces";

const initialState: IAuthState = {
  token: null,
  isAuth: false,
  didTryAutoLogin: false,
  users: [],
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authenticate(state, action: PayloadAction<{ token: string }>) {
      state.token = action.payload.token;
      state.isAuth = true;
      state.didTryAutoLogin = true;
    },
    setDidTryAutoLogin(state, action: PayloadAction<boolean>) {
      state.didTryAutoLogin = action.payload;
    },
    setUsers(state, action: PayloadAction<ISaveToLocalUser[]>) {
      state.users = action.payload;
    },
    logOut(
      state,
      action: PayloadAction<{
        user: ISaveToLocalUser | null;
        users: ISaveToLocalUser[];
      }>,
    ) {
      if (action.payload.user) {
        state.token = action.payload.user.token;
        state.isAuth = true;
      } else {
        state.token = null;
        state.isAuth = false;
      }
      state.users = action.payload.users;
      state.didTryAutoLogin = true;
    },
    resetAuth(state) {
      state.token = null;
      state.isAuth = false;
      state.users = [];
      state.didTryAutoLogin = true;
    },
  },
});

export const authReducer = authSlice.reducer;
export const {
  authenticate,
  setDidTryAutoLogin,
  setUsers,
  logOut,
  resetAuth,
} = authSlice.actions;

export const tokenSelector = (state: { auth: IAuthState }) => state.auth.token;
export const isAuthSelector = (state: { auth: IAuthState }) => state.auth.isAuth;
export const usersSelector = (state: { auth: IAuthState }) => state.auth.users;
export const didTryAutoLoginSelector = (state: { auth: IAuthState }) =>
  state.auth.didTryAutoLogin;
