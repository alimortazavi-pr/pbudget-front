import { ILayoutState } from "@/ts/interfaces/layout.interface";
import { PayloadAction } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

//Interfaces

//Tools

const reducers = {
  setDarkMode(
    state: ILayoutState,
    action: PayloadAction<boolean>
  ): ILayoutState {
    return {
      ...state,
      darkMode: action.payload,
    };
  },
};

export default reducers;
