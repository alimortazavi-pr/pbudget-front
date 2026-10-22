"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal } from "@heroui/react";
import { Copy, TickCircle } from "iconsax-reactjs";

import * as announcementApi from "@/common/api/announcements";
import type { ActiveAnnouncement } from "@/common/api/announcements";
import { PATHS } from "@/common/constants";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { showToast } from "@/common/utils/toast";
import { isAuthSelector } from "@/stores/auth";
import { useAppSelector } from "@/stores/hooks";
import { AppModal, AppModalDialog, AppModalHeader, modalSheetBodyClass, modalSheetFooterClass } from "@/components/common/ui/AppModal";

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
        <AppModalHeader>
          <Modal.Heading>{current.title}</Modal.Heading>
        </AppModalHeader>
        <div className={`${modalSheetBodyClass} space-y-4`}>
          <p className="whitespace-pre-line text-sm leading-7">{current.body}</p>
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
