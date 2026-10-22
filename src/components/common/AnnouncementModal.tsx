"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal } from "@heroui/react";
import { Copy, Crown, Flash, TickCircle } from "iconsax-reactjs";

import * as announcementApi from "@/common/api/announcements";
import type { ActiveAnnouncement } from "@/common/api/announcements";
import * as subscriptionApi from "@/common/api/subscriptions";
import type { SubscriptionPlan } from "@/common/interfaces/subscription.interface";
import { PATHS } from "@/common/constants";
import { formatPlanPrice } from "@/common/utils";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { showToast } from "@/common/utils/toast";
import { isAuthSelector } from "@/stores/auth";
import { useAppSelector } from "@/stores/hooks";
import { AppModal, AppModalDialog, modalSheetBodyClass, modalSheetFooterClass } from "@/components/common/ui/AppModal";

/** "۱ روز و ۴ ساعت" / "۳ ساعت و ۵ دقیقه" until [endsAt]; null once it has passed. */
function remaining(endsAt: string, now: number) {
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return null;
  const minutes = Math.floor(ms / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${toPersianDigits(days)} روز و ${toPersianDigits(hours)} ساعت`;
  if (hours > 0) return `${toPersianDigits(hours)} ساعت و ${toPersianDigits(mins)} دقیقه`;
  return `${toPersianDigits(Math.max(mins, 1))} دقیقه`;
}

/** Admin messages ("announcements"): shown once per user as a modal until closed. */
export function AnnouncementModal() {
  const router = useRouter();
  const isAuth = useAppSelector(isAuthSelector);
  const [queue, setQueue] = useState<ActiveAnnouncement[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [offers, setOffers] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    if (!isAuth) {
      setQueue([]);
      return;
    }
    let alive = true;
    // A short delay keeps it from stacking on top of the "what's new" sheet and the first paint.
    const timer = window.setTimeout(() => {
      announcementApi
        .fetchActiveAnnouncements()
        .then((items) => alive && setQueue(items))
        .catch(() => undefined);
    }, 2500);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [isAuth]);

  const current = queue[0];

  useEffect(() => {
    if (!current?.showOffers) {
      setOffers([]);
      return;
    }
    let alive = true;
    void subscriptionApi
      .fetchSubscriptionOffers()
      .then((items) => alive && setOffers(items))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [current?.id, current?.showOffers]);

  useEffect(() => {
    if (!current?.endsAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [current?.endsAt]);

  const finish = useCallback(
    (clicked: boolean) => {
      if (!current) return;
      void announcementApi.dismissAnnouncement(current.id, clicked).catch(() => undefined);
      setQueue((items) => items.slice(1));
      if (clicked) router.push(PATHS.PLANS);
    },
    [current, router],
  );

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      showToast("کد تخفیف کپی شد", "success");
    } catch {
      showToast("کد را دستی کپی کنید", "danger");
    }
  }

  if (!current) return null;
  const left = current.endsAt ? remaining(current.endsAt, now) : null;

  return (
    <AppModal open onOpenChange={(open) => !open && finish(false)} mobileFull>
      <AppModalDialog className="flex max-h-[100dvh] flex-col sm:max-w-md">
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-accent via-accent/80 to-violet-500 px-5 pb-6 pt-8 text-white">
          <div className="pointer-events-none absolute -end-10 -top-10 size-40 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 start-0 size-32 rounded-full bg-white/10 blur-2xl" />
          <span className="relative mb-3 flex size-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <Flash size={26} variant="Bold" />
          </span>
          <Modal.Heading className="relative text-xl font-extrabold leading-8 text-white">{current.title}</Modal.Heading>
        </div>
        <div className={`${modalSheetBodyClass} space-y-4`}>
          <p className="whitespace-pre-line text-sm leading-7">{current.body}</p>
          {offers.length > 0 ? (
            <div className="space-y-3">
              {offers.map((plan, index) => {
                const percent = plan.originalPrice && plan.originalPrice > plan.price ? Math.round((1 - plan.price / plan.originalPrice) * 100) : 0;
                const best = index === 0;
                return (
                  <button
                    key={plan._id}
                    type="button"
                    onClick={() => finish(true)}
                    className={`relative flex w-full items-center justify-between gap-3 rounded-2xl border-2 p-4 text-start transition active:scale-[0.99] ${best ? "border-accent bg-accent/10 shadow-lg shadow-accent/10" : "border-border/60 bg-surface-secondary/60"}`}
                  >
                    {percent > 0 ? (
                      <span className="absolute -top-3 end-4 rounded-full bg-danger px-3 py-0.5 text-xs font-bold text-white">{toPersianDigits(percent)}٪ تخفیف</span>
                    ) : null}
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Crown size={16} variant="Bold" className="text-accent" />
                        {plan.name}
                      </span>
                      {plan.originalPrice ? (
                        <span className="mt-1 block text-xs text-muted">
                          به‌جای <span className="line-through">{formatPlanPrice(plan.originalPrice)}</span> {plan.priceUnit}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-end">
                      <span className="block text-xl font-extrabold text-accent">{formatPlanPrice(plan.price)}</span>
                      <span className="text-xs text-muted">{plan.priceUnit}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
          {current.discountCode ? (
            <button
              type="button"
              onClick={() => void copyCode(current.discountCode as string)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-accent/60 bg-accent/10 px-4 py-3"
            >
              <span className="text-xs text-muted">کد تخفیف شما</span>
              <span className="flex items-center gap-2 text-xl font-extrabold tracking-widest text-accent" dir="ltr">
                {current.discountCode}
                <Copy size={18} />
              </span>
            </button>
          ) : null}
          {left ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-warning-foreground">
              <TickCircle size={16} variant="Bold" />
              فقط {left} فرصت دارید
            </p>
          ) : null}
        </div>
        <Modal.Footer className={`${modalSheetFooterClass} flex flex-col gap-2`}>
          {current.ctaLabel ? (
            <Button fullWidth onPress={() => finish(true)}>
              {current.ctaLabel}
            </Button>
          ) : null}
          <Button fullWidth variant="ghost" onPress={() => finish(false)}>
            بستن
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>
  );
}
