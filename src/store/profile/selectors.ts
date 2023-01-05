import { RootState } from "@/store/index";

//Interfaces
import { IProfile } from "@/ts/interfaces/profile.interface";

export function userSelector(state: RootState): IProfile {
  return state.profile.user;
}
