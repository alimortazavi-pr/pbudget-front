import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";

//Reducers
import authReducer from "@/store/auth";
import budgetReducer from "@/store/budget";
import categoryReducer from "@/store/category";
import profileReducer from "@/store/profile";
import layoutReducer from "@/store/layout";
import creditReducer from "@/store/credit";
import boxReducer from "@/store/box";

export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      budget: budgetReducer,
      profile: profileReducer,
      category: categoryReducer,
      layout: layoutReducer,
      credit: creditReducer,
      box: boxReducer,
    },
  });
}

const store = makeStore();

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export default store;
