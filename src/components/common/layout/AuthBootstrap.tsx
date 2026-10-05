"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { PATHS } from "@/common/constants";
import { isPublicPath } from "@/common/constants/public-routes";
import * as authApi from "@/common/api/auth";
import * as categoriesApi from "@/common/api/categories";
import { saveDataToLocal, storage } from "@/common/utils";
import { isAddAccountFlow } from "@/common/utils/auth-flow";
import { resolvePostAuthDestination } from "@/common/utils/post-auth";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  authenticate,
  didTryAutoLoginSelector,
  isAuthSelector,
  setDidTryAutoLogin,
  setUsers,
} from "@/stores/auth";
import { setProfile } from "@/stores/profile";
import { setCategories } from "@/stores/category";

export function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const isAuth = useAppSelector(isAuthSelector);
  const didTry = useAppSelector(didTryAutoLoginSelector);

  useEffect(() => {
    if (didTry) return;

    const isPublic = isPublicPath(pathname);

    async function bootstrap() {
      const authData = storage.getAuthData();

      if (!authData?.token || !authData.users?.length) {
        dispatch(setDidTryAutoLogin(true));
        if (!isPublic) router.replace(PATHS.GET_STARTED);
        return;
      }

      try {
        const { user } = await authApi.checkAuth(authData.token);
        dispatch(authenticate({ token: authData.token }));
        dispatch(setProfile(user));
        const nextUsers = authData.users.map((u) =>
          u._id === user._id ? { ...user, token: authData.token } : u,
        );
        dispatch(setUsers(nextUsers));
        saveDataToLocal({ token: authData.token, users: nextUsers });
        dispatch(setDidTryAutoLogin(true));
      } catch (error) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403) {
          // The interceptor already dropped this account and moved to the
          // next one (or to sign-in) — nothing else to do here.
          return;
        }
        // Server unreachable / 5xx: keep every account signed in and let the
        // user retry, instead of wiping all sessions because of an outage.
        dispatch(authenticate({ token: authData.token }));
        dispatch(setUsers(authData.users));
        dispatch(setDidTryAutoLogin(true));
      }
    }

    void bootstrap();
  }, [dispatch, didTry, pathname, router]);

  useEffect(() => {
    if (!isAuth) return;
    void categoriesApi.fetchCategories().then((cats) => {
      dispatch(setCategories(cats));
    });
  }, [dispatch, isAuth]);

  useEffect(() => {
    if (!didTry || !isAuth) return;
    if (pathname !== PATHS.GET_STARTED && pathname !== PATHS.LANDING) return;
    if (
      pathname === PATHS.GET_STARTED &&
      isAddAccountFlow(new URLSearchParams(window.location.search))
    ) {
      return;
    }
    // Keep authenticated users on the public contact section when they arrive
    // from a plan or feature CTA instead of sending them back to the dashboard.
    if (pathname === PATHS.LANDING && window.location.hash === "#contact") return;

    void resolvePostAuthDestination().then((result) => {
      if (result.needsPicker) {
        router.replace(PATHS.WORKSPACE);
        return;
      }
      router.replace(result.path ?? PATHS.HOME);
    });
  }, [didTry, isAuth, pathname, router]);

  return null;
}
