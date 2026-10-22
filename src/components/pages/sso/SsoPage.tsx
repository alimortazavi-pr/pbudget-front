"use client";

import { useTranslation } from "@/i18n";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Spinner } from "@heroui/react";

import * as authApi from "@/common/api/auth";
import * as ssoApi from "@/common/api/sso";
import { PATHS } from "@/common/constants";
import { saveDataToLocal, storage } from "@/common/utils";
import { toStoredAccount } from "@/common/utils/storage";

/** Landing page for "business → personal": consumes a one-time ticket and signs the user in. */
export function SsoPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ticket = params.get("ticket");
    if (started.current) return;
    started.current = true;
    if (!ticket) {
      router.replace(PATHS.GET_STARTED);
      return;
    }
    // Keep the ticket out of history/referrers as soon as we have read it.
    window.history.replaceState(null, "", "/sso");
    void (async () => {
      try {
        const { token } = await ssoApi.consumeTicket(ticket);
        const { user } = await authApi.checkAuth(token);
        const existing = storage.getAuthData()?.users ?? [];
        const users = [
          ...existing.filter((u) => u._id !== user._id),
          toStoredAccount({ ...user, token }),
        ];
        saveDataToLocal({ token, users });
        window.location.assign(PATHS.HOME);
      } catch {
        setFailed(true);
      }
    })();
  }, [params, router]);

  return (
    <div className="grid min-h-dvh place-items-center px-5 text-center">
      {failed ? (
        <div className="max-w-sm space-y-4">
          <p className="font-bold">{t("sso.failedTitle")}</p>
          <p className="text-sm leading-7 text-muted">{t("sso.failedBody")}</p>
          <Button onPress={() => router.replace(PATHS.GET_STARTED)}>{t("sso.signIn")}</Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-muted">
          <Spinner />
          <p>{t("sso.signingIn")}</p>
        </div>
      )}
    </div>
  );
}
