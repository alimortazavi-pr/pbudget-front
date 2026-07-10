"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useState } from "react";

import * as partnersApi from "@/common/api/partners";
import type {
  IPartnerActivity,
  PartnerActivityAction,
  PartnerContextType,
} from "@/common/interfaces/partner.interface";
import { formatIsoDateTimeJalali } from "@/common/utils/jalali-date";
import { showToast } from "@/common/utils/toast";

type PartnerActivityPanelProps = {
  contextType: PartnerContextType;
  contextId: string;
};

function actionLabel(action: PartnerActivityAction) {
  switch (action) {
    case "invited":
      return "دعوت";
    case "accepted":
      return "پذیرش";
    case "declined":
      return "رد";
    case "share_changed":
      return "تغییر سهم";
    case "permission_changed":
      return "تغییر دسترسی";
    case "removed":
      return "حذف";
    case "settlement_applied":
      return "تسویه";
    case "budget_attached":
      return "تراکنش";
    default:
      return action;
  }
}

function actionClass(action: PartnerActivityAction) {
  if (action === "accepted" || action === "settlement_applied") {
    return "bg-success/15 text-success-foreground";
  }
  if (action === "declined" || action === "removed") {
    return "bg-danger/15 text-danger";
  }
  return "bg-surface-secondary text-muted";
}

export function PartnerActivityPanel({
  contextType,
  contextId,
}: PartnerActivityPanelProps) {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<IPartnerActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await partnersApi.fetchPartnerActivity(contextType, contextId);
      setActivities(list);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری تاریخچه");
    } finally {
      setLoading(false);
    }
  }, [contextId, contextType]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-muted">{t("auto.k5a0412c314")}</p>;
  }

  if (activities.length === 0) {
    return (
      <section className="rounded-2xl border border-border/50 bg-surface-secondary/30 p-4">
        <h3 className="font-bold">{t("auto.k789357d8e6")}</h3>
        <p className="mt-2 text-sm text-muted">{t("auto.k9dda6210bd")}</p>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border/50 bg-surface-secondary/30 p-4">
      <h3 className="font-bold">{t("auto.k789357d8e6")}</h3>
      <div className="space-y-2">
        {activities.map((activity) => (
          <article
            key={activity._id}
            className="flex items-start justify-between gap-3 rounded-xl bg-background/60 p-3"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-lg px-2 py-0.5 text-xs font-medium ${actionClass(activity.action)}`}
                >
                  {actionLabel(activity.action)}
                </span>
                <span className="text-xs text-muted">
                  {formatIsoDateTimeJalali(activity.createdAt)}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-6">{activity.message}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
