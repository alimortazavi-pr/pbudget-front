"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

import { PATHS } from "@/common/constants";
import { buildGetStartedUrl } from "@/common/utils/auth-flow";
import * as partnersApi from "@/common/api/partners";
import type { IPartnerInviteInfo } from "@/common/interfaces/partner.interface";
import { formatJalaliDateSlashed, moment } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

type PartnerInvitePageProps = {
  token: string;
};

export function PartnerInvitePage({ token }: PartnerInvitePageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAppSelector(userSelector);
  const [invite, setInvite] = useState<IPartnerInviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await partnersApi.fetchPartnerInvite(token);
      setInvite(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auto.k853acc5ec9"));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function accept() {
    if (!invite) return;
    const contextType = invite.contextType;
    setActing(true);
    try {
      await partnersApi.acceptPartnerInvite(token);
      showToast(t("auto.k833c338585"), "success");
      router.push(
        contextType === "project" ? PATHS.PROJECTS : PATHS.VENTURES,
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.ke18ed389dc"));
    } finally {
      setActing(false);
    }
  }

  async function decline() {
    setActing(true);
    try {
      await partnersApi.declinePartnerInvite(token);
      showToast(t("auto.kbaa8f3b1c7"));
      router.push(PATHS.HOME);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md py-16 text-center text-muted">
        {t("auto.k4127f66ce6")}
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <p className="text-danger">{error ?? t("auto.kd044cdedaa")}</p>
        <Link href={PATHS.HOME}>
          <Button variant="secondary">{t("common.backToHome")}</Button>
        </Link>
      </div>
    );
  }

  const contextLabel =
    invite.contextType === "project" ? t("auto.kcce7e8ff41") : t("auto.k9f48ae23bb");

  const expiresLabel = (() => {
    const m = moment(invite.expiresAt).locale("fa");
    return formatJalaliDateSlashed(
      m.format("jYYYY"),
      m.format("jM"),
      m.format("jD"),
    );
  })();

  return (
    <div className="mx-auto max-w-md space-y-5 py-8">
      <section className="glass rounded-3xl p-6 text-center">
        <p className="text-sm text-muted">{t("auto.kaed62bd3e2")}</p>
        <h1 className="mt-2 text-2xl font-bold">{invite.contextTitle}</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          {t("pages.invites.inviteBody", {
            owner: invite.ownerName,
            context: contextLabel,
            title: invite.contextTitle,
          })}
        </p>

        <div className="mt-5 space-y-2 rounded-xl bg-surface-secondary p-4 text-sm">
          {invite.sharePercent > 0 ? (
            <p>
              {t("auto.k02000786d1")}{" "}
              <span className="font-bold">
                {t("pages.partners.totalSharePercent", { percent: invite.sharePercent })}
              </span>
            </p>
          ) : null}
          <p className="text-muted">
            {t("auto.ke18fd29fef")}{expiresLabel}
          </p>
        </div>
      </section>

      {!user ? (
        <div className="glass space-y-3 rounded-2xl p-5 text-center">
          <p className="text-sm text-muted">
            {t("auto.k000e4e5acb")}{" "}
            <span dir="ltr" className="font-medium text-foreground">
              {invite.mobile}
            </span>{" "}
            {t("auto.kf3369bb7a8")}
          </p>
          <Link href={buildGetStartedUrl(PATHS.PARTNER_INVITE(token))}>
            <Button className="w-full" size="lg">
              {t("auto.k8dfad36076")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Button size="lg" onPress={() => void accept()} isPending={acting}>
            {t("auto.k6dd4cf3137")}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onPress={() => void decline()}
            isPending={acting}
          >
            {t("auto.kb81c943244")}
          </Button>
        </div>
      )}
    </div>
  );
}
