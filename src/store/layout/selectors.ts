import { RootState } from "@/store/index";

//Interfaces
export function darkModeSelector(state: RootState): boolean {
  return state.layout.darkMode;
}
