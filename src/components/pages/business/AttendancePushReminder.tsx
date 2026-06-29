"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { Notification } from "iconsax-reactjs";

import * as pushApi from "@/common/api/push";
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/common/utils/push-client";
import { showToast } from "@/common/utils/toast";

type AttendancePushReminderProps = {
  businessId: string;
};

export function AttendancePushReminder({ businessId }: AttendancePushReminderProps) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const config = await pushApi.fetchPushConfig();
      if (!config.enabled || !isPushSupported()) {
        setSupported(false);
        setEnabled(false);
        return;
      }
      setSupported(true);
      const subs = await pushApi.fetchPushSubscriptions();
      setEnabled(
        subs.some((s) => s.attendanceReminders && s.businessId === businessId),
      );
    } catch {
      setSupported(isPushSupported());
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function enable() {
    setActing(true);
    try {
      const sub = await subscribeToPush();
      if (!sub) {
        showToast("اجازه اعلان داده نشد یا مرورگر پشتیبانی نمی‌کند");
        return;
      }
      await pushApi.subscribePush({
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        },
        businessId,
        attendanceReminders: true,
      });
      setEnabled(true);
      showToast("یادآور حضور فعال شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "فعال‌سازی ناموفق");
    } finally {
      setActing(false);
    }
  }

  async function disable() {
    setActing(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await pushApi.unsubscribePush({ endpoint: sub.endpoint });
        await unsubscribeFromPush();
      }
      setEnabled(false);
      showToast("یادآور حضور غیرفعال شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setActing(false);
    }
  }

  if (loading || !supported) return null;

  return (
    <div
      className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"
      data-tour="attendance-push"
    >
      <div className="flex items-start gap-3">
        <Notification size={22} className="mt-0.5 text-violet-600" />
        <div>
          <p className="font-medium">یادآور ورود صبحگاهی</p>
          <p className="mt-1 text-xs text-muted">
            بر اساس ساعت شروع شیفت شما (۱۵ دقیقه قبل تا ۴۵ دقیقه بعد) یادآور
            می‌گیرید — اگر ورود امروز ثبت نشده باشد.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant={enabled ? "secondary" : "primary"}
        onPress={() => void (enabled ? disable() : enable())}
        isPending={acting}
      >
        {enabled ? "غیرفعال" : "فعال‌سازی"}
      </Button>
    </div>
  );
}
