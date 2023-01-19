import { PayloadAction } from "@reduxjs/toolkit";

//Interfaces
import { IProfile, IProfileState } from "@/ts/interfaces/profile.interface";

//Tools

const reducers = {
  setProfile: (
    state: IProfileState,
    action: PayloadAction<IProfile>
  ): IProfileState => {
    return {
      ...state,
      user: {
        ...action.payload,
      },
    };
  },
  calculateUserBudget: (
    state: IProfileState,
    action: PayloadAction<number>
  ): IProfileState => {
    return {
      ...state,
      user: {
        ...state.user,
        budget: (state.user.budget as number) + action.payload,
      },
    };
  },
};

export default reducers;
