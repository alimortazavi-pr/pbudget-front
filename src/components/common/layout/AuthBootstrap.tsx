"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { PATHS } from "@/common/constants";
import * as authApi from "@/common/api/auth";
import * as categoriesApi from "@/common/api/categories";
import { saveDataToLocal, storage } from "@/common/utils";
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

    const isPublic = pathname === PATHS.GET_STARTED;

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
        dispatch(setUsers(authData.users));
        saveDataToLocal({ token: authData.token, users: authData.users });
      } catch {
        storage.clearAuthData();
        dispatch(setDidTryAutoLogin(true));
        if (!isPublic) router.replace(PATHS.GET_STARTED);
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

  return null;
}
