"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeSsoCode } from "@/common/utils/sso";
import { saveDataToLocal } from "@/common/utils/storage";
import { PATHS } from "@/common/constants";
import { useAppDispatch } from "@/stores/hooks";
import { authenticate, setUsers } from "@/stores/auth";
import { setProfile } from "@/stores/profile";
import { normalizeProfile } from "@/common/utils/profile";
import type { IProfile } from "@/common/interfaces/profile.interface";

export function SsoCallbackPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");
    const returnPath = params.get("return") || PATHS.HOME;

    if (!code) {
      router.replace(PATHS.GET_STARTED);
      return;
    }

    void (async () => {
      try {
        const data = await exchangeSsoCode(code);
        const user = normalizeProfile(data.user as Record<string, unknown>) as IProfile;
        const nextUsers = [{ ...user, token: data.token }];
        saveDataToLocal({ token: data.token, users: nextUsers });
        dispatch(authenticate({ token: data.token }));
        dispatch(setUsers(nextUsers));
        dispatch(setProfile(user));
        router.replace(returnPath);
      } catch {
        setError(t("auto.k0c6458cc4d"));
      }
    })();
  }, [dispatch, params, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center p-6 text-center">
      {error ? (
        <p className="text-rose-600">{error}</p>
      ) : (
        <p className="text-muted">{t("auto.kf762d35953")}</p>
      )}
    </div>
  );
}
