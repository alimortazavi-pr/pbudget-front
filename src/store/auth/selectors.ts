import { RootState } from "@/store/index";
import { ISaveToLocalUser } from "@/ts/interfaces/auth.interface";

//Interfaces

export function isAuthSelector(state: RootState): boolean {
  return state.auth.isAuth;
}

export function didTryAutoLoginSelector(state: RootState): boolean {
  return state.auth.didTryAutoLogin;
}

export function tokenSelector(state: RootState): string | null {
  return state.auth.token;
}

export function usersSelector(state: RootState): ISaveToLocalUser[] {
  return state.auth.users;
}
