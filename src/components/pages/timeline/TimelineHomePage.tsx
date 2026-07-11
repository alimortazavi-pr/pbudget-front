"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@heroui/react";
import {
  Card,
  Chart,
  MoneyRecive,
  Task,
} from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import {
  CURRENCY_OPTIONS,
  DEFAULT_USER_PREFERENCES,
} from "@/common/constants/user-preferences";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { getWalletBalance } from "@/common/utils/wallet-balances";
import { showToast } from "@/common/utils/toast";
import { formatPrice, toPersianDigits } from "@/common/utils";
import * as tasksApi from "@/common/api/tasks";
import { TransactionCard } from "@/components/pages/dashboard/TransactionCard";
import {
  PeriodProvider,
  usePeriod,
  usePeriodBootstrap,
} from "@/components/providers/PeriodProvider";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";
import { PeriodCalendarPanel } from "@/components/pages/timeline/PeriodCalendarPanel";
import { PeriodScopeBar } from "@/components/pages/timeline/PeriodScopeBar";
import { TimelineWidgetDrawer } from "@/components/pages/timeline/TimelineWidgetDrawer";
import { TimelineWidgetTile } from "@/components/pages/timeline/TimelineWidgetTile";
import { useTimelineData } from "@/components/pages/timeline/useTimelineData";

type DrawerKind = "finance" | "tasks" | "due" | null;

export function TimelineHomePage() {
  const { t } = useTranslation();
  return (
    <PeriodProvider>
      <TimelineHomePageContent />
    </PeriodProvider>
  );
}

function TimelineHomePageContent() {  const { t } = useTranslation();

  usePeriodBootstrap();
  const period = usePeriod();
  const user = useAppSelector(userSelector);
  const data = useTimelineData(period);
  const [drawer, setDrawer] = useState<DrawerKind>(null);

  async function toggleTask(id: string) {
    try {
      await tasksApi.toggleTask(id);
      await data.reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.error"));
    }
  }

  const financeStatus =
    data.net >= 0 ? ("good" as const) : ("warn" as const);
  const taskStatus =
    data.taskSummary.overdue > 0
      ? ("danger" as const)
      : data.taskSummary.pending > 0
        ? ("warn" as const)
        : ("good" as const);
  const dueStatus =
    data.dueCount > 0 ? ("warn" as const) : ("good" as const);

  return (
    <div className="pb-timeline-home">
      <section className="pb-timeline-hero">
        <p className="text-sm text-white/80">{t("auto.kfa65ac7860")}{user?.firstName ?? ""}</p>
        <div className="mt-1 space-y-1">
          {CURRENCY_OPTIONS.map((option) => {
            const amount = getWalletBalance(user, option.id);
            const preferred =
              user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;
            if (amount === 0 && option.id !== preferred) return null;
            return (
              <p
                key={option.id}
                className={
                  option.id === preferred
                    ? "pb-balance-amount text-white"
                    : "text-sm font-semibold text-white/90"
                }
              >
                {formatPriceWithCurrency(amount, option.id)}
              </p>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-white/70">{t("common.walletBalance")}</p>
      </section>

      <PeriodScopeBar />

      <section className="pb-timeline-calendar-wrap">
        <PeriodCalendarPanel />
      </section>

      {data.loading ? (
        <div className="pb-hmi-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="pb-shimmer h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="pb-hmi-grid">
          <TimelineWidgetTile
            title={t("auto.kbead1798a0")}
            value={formatPrice(data.net)}
            subtitle={t("dashboard.incomeExpenseSubtitle", {
              income: formatPrice(data.income),
              expense: formatPrice(data.expense),
            })}
            status={financeStatus}
            icon={<Chart size={22} variant="Bold" />}
            onPress={() => setDrawer("finance")}
          />
          <TimelineWidgetTile
            title={t("auto.k93becfb5eb")}
            value={toPersianDigits(String(data.taskSummary.pending))}
            subtitle={`${toPersianDigits(String(data.taskSummary.done))} ${t("auto.kf82fc4a167")} · ${toPersianDigits(String(data.taskSummary.overdue))} ${t("auto.k2055424d06")}`}
            status={taskStatus}
            icon={<Task size={22} variant="Bold" />}
            onPress={() => setDrawer("tasks")}
          />
          <TimelineWidgetTile
            title={t("auto.kd1226f849e")}
            value={toPersianDigits(String(data.dueCount))}
            subtitle={`${toPersianDigits(String(data.checkPendingCount))} ${t("auto.kf0445be6b3")} · ${toPersianDigits(String(data.installmentPendingCount))} ${t("auto.kd673bbfe0f")}`}
            status={dueStatus}
            icon={<MoneyRecive size={22} variant="Bold" />}
            onPress={() => setDrawer("due")}
          />
          <TimelineWidgetTile
            title={t("auto.k4ad10a7f11")}
            value={toPersianDigits(String(data.budgets.length))}
            subtitle={t("auto.kd1561981ec")}
            status="neutral"
            icon={<Card size={22} variant="Bold" />}
            onPress={() => setDrawer("finance")}
          />
        </div>
      )}

      <TimelineWidgetDrawer
        open={drawer === "finance"}
        onOpenChange={(open) => !open && setDrawer(null)}
        title={t("auto.k6d1b24c32e")}
      >
        {data.budgets.length === 0 ? (
          <p className="text-center text-sm text-muted">{t("auto.k22a5c47aec")}</p>
        ) : (
          data.budgets.map((budget) => (
            <TransactionCard key={budget._id} budget={budget} />
          ))
        )}
        <Link href={PATHS.CREATE_BUDGET} className="block pt-2">
          <Button className="w-full">{t("auto.k5af9c84809")}</Button>
        </Link>
      </TimelineWidgetDrawer>

      <TimelineWidgetDrawer
        open={drawer === "tasks"}
        onOpenChange={(open) => !open && setDrawer(null)}
        title={t("auto.k7a32178d46")}
      >
        {data.tasks.length === 0 ? (
          <p className="text-center text-sm text-muted">{t("auto.kea5ea656cd")}</p>
        ) : (
          data.tasks.map((task) => (
            <div
              key={task._id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-surface p-3"
            >
              <div className="min-w-0">
                <p
                  className={`truncate text-sm font-medium ${task.done ? "text-muted line-through" : ""}`}
                >
                  {task.title}
                </p>
                {task.description ? (
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {task.description}
                  </p>
                ) : null}
              </div>
              <Button
                size="sm"
                variant={task.done ? "secondary" : "primary"}
                onPress={() => void toggleTask(task._id)}
              >
                {task.done ? t("common.back") : t("auto.k8e89bd5274")}
              </Button>
            </div>
          ))
        )}
        <Link href={PATHS.TASKS} className="block pt-2">
          <Button variant="secondary" className="w-full">
            {t("auto.kc59245a12b")}
          </Button>
        </Link>
      </TimelineWidgetDrawer>

      <TimelineWidgetDrawer
        open={drawer === "due"}
        onOpenChange={(open) => !open && setDrawer(null)}
        title={t("auto.kb184d80ea0")}
      >
        {data.checks.length === 0 && data.installments.length === 0 ? (
          <p className="text-center text-sm text-muted">{t("auto.k1d66ab7422")}</p>
        ) : (
          <>
            {data.checks.map((check) => (
              <div
                key={check._id}
                className="rounded-xl border border-border/50 bg-surface p-3"
              >
                <p className="text-sm font-medium">{t("auto.kfe66a193dd")}{check.person}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatPrice(check.amount)}
                </p>
              </div>
            ))}
            {data.installments.map((item) => (
              <div
                key={item._id}
                className="rounded-xl border border-border/50 bg-surface p-3"
              >
                <p className="text-sm font-medium">{item.plan.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatPrice(item.amount)}
                </p>
              </div>
            ))}
          </>
        )}
        <div className="flex gap-2 pt-2">
          <Link href={PATHS.CHECKS} className="flex-1">
            <Button variant="secondary" className="w-full">
              {t("nav.checks")}
            </Button>
          </Link>
          <Link href={PATHS.INSTALLMENTS} className="flex-1">
            <Button variant="secondary" className="w-full">
              {t("nav.installments")}
            </Button>
          </Link>
        </div>
      </TimelineWidgetDrawer>
    </div>
  );
}
