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
      setError(err instanceof Error ? err.message : "دعوت نامعتبر است");
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
      showToast(err instanceof Error ? err.message : "خطا در تأیید");
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
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md py-16 text-center text-muted">
        در حال بارگذاری دعوت…
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <p className="text-danger">{error ?? "دعوت یافت نشد"}</p>
        <Link href={PATHS.HOME}>
          <Button variant="secondary">{t("common.backToHome")}</Button>
        </Link>
      </div>
    );
  }

  const contextLabel =
    invite.contextType === "project" ? "پروژه" : "کسب‌وکار";

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
          <span className="font-medium text-foreground">{invite.ownerName}</span>{" "}
          شما را به عنوان شریک در {contextLabel} «{invite.contextTitle}» دعوت
          کرده است.
        </p>

        <div className="mt-5 space-y-2 rounded-xl bg-surface-secondary p-4 text-sm">
          {invite.sharePercent > 0 ? (
            <p>
              سهم پیشنهادی:{" "}
              <span className="font-bold">{invite.sharePercent}٪</span>
            </p>
          ) : null}
          <p className="text-muted">
            اعتبار تا {expiresLabel}
          </p>
        </div>
      </section>

      {!user ? (
        <div className="glass space-y-3 rounded-2xl p-5 text-center">
          <p className="text-sm text-muted">
            برای تأیید دعوت باید با شماره{" "}
            <span dir="ltr" className="font-medium text-foreground">
              {invite.mobile}
            </span>{" "}
            وارد شوید
          </p>
          <Link href={buildGetStartedUrl(PATHS.PARTNER_INVITE(token))}>
            <Button className="w-full" size="lg">
              ورود / ثبت‌نام
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Button size="lg" onPress={() => void accept()} isPending={acting}>
            تأیید دعوت
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onPress={() => void decline()}
            isPending={acting}
          >
            رد دعوت
          </Button>
        </div>
      )}
    </div>
  );
}
