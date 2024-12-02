import { creditTypeEnum } from "@/ts/enums/credit.enum";
import { ICredit, ICreditState } from "@/ts/interfaces/credit.interface";
import { setCreditsAction } from "@/ts/types/credit.type";
import { PayloadAction } from "@reduxjs/toolkit";

//Interfaces

//Tools

const reducers = {
  setCredits: (
    state: ICreditState,
    action: PayloadAction<setCreditsAction>
  ): ICreditState => {
    return {
      ...state,
      credits: action.payload.credits,
      totalDebtPrice: action.payload.totalDebtPrice,
      totalDuesPrice: action.payload.totalDuesPrice,
    };
  },
  deleteCredit: (
    state: ICreditState,
    action: PayloadAction<ICredit>
  ): ICreditState => {
    let newTotalDebtPrice: number = state.totalDebtPrice || 0;
    let newTotalDuesPrice: number = state.totalDuesPrice || 0;
    if (action.payload.type === creditTypeEnum.DUES) {
      newTotalDuesPrice -= action.payload.price;
    } else {
      newTotalDebtPrice -= action.payload.price;
    }

    return {
      ...state,
      credits: [
        ...(state.credits as ICredit[]).filter(
          (credit) => credit._id !== action.payload._id
        ),
      ],
      totalDebtPrice: newTotalDebtPrice,
      totalDuesPrice: newTotalDuesPrice,
    };
  },
};

export default reducers;
