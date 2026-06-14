import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { IProfile, IProfileState } from "@/common/interfaces/profile.interface";

const initialState: IProfileState = {
  user: null,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<IProfile | null>) {
      state.user = action.payload;
    },
  },
});

export const profileReducer = profileSlice.reducer;
export const { setProfile } = profileSlice.actions;
export const userSelector = (state: { profile: IProfileState }) =>
  state.profile.user;
