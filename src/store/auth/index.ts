import { createSlice } from "@reduxjs/toolkit";

//Interfaces
import { IAuthState } from "@/ts/interfaces/auth.interface";

//Reducers
import reducers from "@/store/auth/reducers";

const initialState: IAuthState = {
  token: null,
  didTryAutoLogin: false,
  isAuth: false,
};

export const authReducer = createSlice({
  name: "auth",
  initialState,
  reducers,
});

export default authReducer.reducer;
