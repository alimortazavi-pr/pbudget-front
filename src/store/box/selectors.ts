import { RootState } from "@/store/index";
import { IBox } from "@/ts/interfaces/box.interface";

//Interfaces
export function boxesSelector(state: RootState): IBox[] | null {
  return state.box.boxes;
}
