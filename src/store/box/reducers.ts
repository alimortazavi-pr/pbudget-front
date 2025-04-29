import { IBox, IBoxState } from "@/ts/interfaces/box.interface";
import { PayloadAction } from "@reduxjs/toolkit";

//Interfaces

//Tools

const reducers = {
  setBoxes(
    state: IBoxState,
    action: PayloadAction<IBox[]>
  ): IBoxState {
    return {
      ...state,
      boxes: action.payload,
    };
  },
};

export default reducers;
