import { AppThunk } from "@/store";

//Actions of other store

//Reducer
import { layoutReducer } from "@/store/layout";

//Actions from reducer
export const { setDarkMode } = layoutReducer.actions;

//Interfaces
import {} from "@/ts/interfaces/layout.interface";

//Tools
import api from "@/api";

//Actions from actions
