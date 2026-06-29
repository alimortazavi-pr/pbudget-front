import { configureStore } from "@reduxjs/toolkit";

import { authReducer } from "./auth";
import { profileReducer } from "./profile";
import { budgetReducer } from "./budget";
import { categoryReducer } from "./category";
import { boxReducer } from "./box";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    budget: budgetReducer,
    category: categoryReducer,
    box: boxReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
