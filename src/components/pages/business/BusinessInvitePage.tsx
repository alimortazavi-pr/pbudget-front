"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

import { PATHS } from "@/common/constants";
import { buildGetStartedUrl } from "@/common/utils/auth-flow";
import * as businessApi from "@/common/api/business";
import type { IBusinessInviteInfo } from "@/common/interfaces/business.interface";
import { storage } from "@/common/utils/storage";
import { formatJalaliDateSlashed, moment } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

type BusinessInvitePageProps = {
  token: string;
};

export function BusinessInvitePage({ token }: BusinessInvitePageProps) {
  const router = useRouter();
  const user = useAppSelector(userSelector);
  const [invite, setInvite] = useState<IBusinessInviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await businessApi.fetchBusinessInvite(token);
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
    setActing(true);
    try {
      const res = await businessApi.acceptBusinessInvite(token);
      showToast("عضویت تأیید شد", "success");
      storage.setActiveBusinessId(res.businessId);
      router.push(PATHS.BUSINESS_DETAIL(res.businessId));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در تأیید");
    } finally {
      setActing(false);
    }
  }

  async function decline() {
    setActing(true);
    try {
      await businessApi.declineBusinessInvite(token);
      showToast("دعوت رد شد");
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
          <Button variant="secondary">بازگشت به خانه</Button>
        </Link>
      </div>
    );
  }

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
        <p className="text-sm text-muted">دعوت پرسنل کسب‌وکار</p>
        <h1 className="mt-2 text-2xl font-bold">{invite.businessTitle}</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          <span className="font-medium text-foreground">{invite.inviterName}</span>{" "}
          شما را به «{invite.businessTitle}» دعوت کرده است.
        </p>
        <div className="mt-5 space-y-2 rounded-xl bg-surface-secondary p-4 text-sm">
          <p>
            نقش: <span className="font-bold">{invite.preset}</span>
          </p>
          <p className="text-muted">اعتبار تا {expiresLabel}</p>
        </div>
      </section>

      {!user ? (
        <div className="glass space-y-3 rounded-2xl p-5 text-center">
          <p className="text-sm text-muted">
            برای پذیرش، با شماره{" "}
            <span dir="ltr" className="font-medium text-foreground">
              {invite.mobile}
            </span>{" "}
            وارد شوید و رمز عبور خود را تنظیم کنید
          </p>
          <Link href={buildGetStartedUrl(PATHS.BUSINESS_INVITE(token))}>
            <Button className="w-full" size="lg">
              ورود / تکمیل ثبت‌نام
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Button size="lg" onPress={() => void accept()} isPending={acting}>
            پذیرش و ورود به پنل
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
