"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";
import {
  ArrowLeft2,
  Bank,
  Briefcase,
  Calendar,
  Card,
  Clock,
  Coin1,
  DocumentText,
  EmptyWallet,
  Moneys,
  People,
  ReceiptText,
  Wallet3,
} from "iconsax-reactjs";
import type { ReactNode } from "react";

import * as budgetsApi from "@/common/api/budgets";
import type { BudgetDetails } from "@/common/api/budgets";
import { PATHS } from "@/common/constants";
import type { UserCurrency, UserDateCalendar } from "@/common/constants/user-preferences";
import type { IBudget } from "@/common/interfaces/budget.interface";
import { formatBudgetDate, formatBudgetDateTime } from "@/common/utils/calendar-date";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { formatQuantity } from "@/common/utils/asset-format";
import { CheckType, DebtType } from "@/types/enums";

const CURRENCY_LABELS: Record<string, string> = { toman: "تومان", usd: "دلار", dinar: "دینار" };
const DEBT_STATUS: Record<string, string> = { open: "باز", partial: "بخشی تسویه‌شده", settled: "تسویه‌شده" };
const CHECK_STATUS: Record<string, string> = {
  pending: "در انتظار",
  cleared: "پاس‌شده",
  bounced: "برگشتی",
  cancelled: "باطل‌شده",
};

function dueText(due: { year: number; month: number; day: number } | null | undefined, calendar: UserDateCalendar) {
  if (!due?.year) return "";
  return formatBudgetDate(String(due.year), String(due.month), String(due.day), calendar);
}

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 py-1.5">
      <span className="mt-0.5 shrink-0 text-muted" aria-hidden>
        {icon}
      </span>
      <span className="w-20 shrink-0 text-xs leading-6 text-muted">{label}</span>
      <span className="min-w-0 flex-1 break-words text-sm leading-6">{children}</span>
    </div>
  );
}

function LinkCard({
  href,
  icon,
  tone = "accent",
  title,
  subtitle,
}: {
  href?: string;
  icon: ReactNode;
  tone?: "accent" | "income" | "expense" | "warning";
  title: string;
  subtitle?: string;
}) {
  const toneClass = {
    accent: "bg-accent/12 text-accent",
    income: "bg-income-soft text-income",
    expense: "bg-expense-soft text-expense",
    warning: "bg-warning/15 text-warning-foreground",
  }[tone];
  const body = (
    <>
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${toneClass}`} aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-semibold leading-6">{title}</span>
        {subtitle ? <span className="block break-words text-xs leading-5 text-muted">{subtitle}</span> : null}
      </span>
      {href ? <ArrowLeft2 size={16} className="shrink-0 text-muted" aria-hidden /> : null}
    </>
  );
  const className = "flex items-center gap-3 rounded-2xl border border-border/60 bg-surface-secondary/40 px-3 py-2.5 text-start";
  return href ? (
    <Link href={href} className={`${className} transition hover:border-accent/50`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/**
 * The opened transaction: full description, every attribute, and the records
 * it belongs to (debt, installment, check, box, work time, venture, bank
 * import), loaded when the card opens.
 */
export function TransactionDetails({
  budget,
  currency,
  calendar,
  categoryTitle,
  paymentCardLabel,
}: {
  budget: IBudget;
  currency: UserCurrency;
  calendar: UserDateCalendar;
  categoryTitle: string;
  paymentCardLabel: string | null;
}) {
  const [details, setDetails] = useState<BudgetDetails | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    budgetsApi
      .fetchBudgetDetails(budget._id)
      .then((data) => alive && setDetails(data))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [budget._id]);

  const description = budget.description?.trim();
  const full = details?.budget;
  const links = details?.links;
  const updatedAt = full?.updatedAt && full.updatedAt !== full.createdAt ? full.updatedAt : null;
  const project = full?.project && typeof full.project === "object" ? full.project : null;
  const sessionMinutes = links?.workSessions.reduce((sum, item) => sum + (item.minutes ?? 0), 0) ?? 0;
  const sessionProject = links?.workSessions.find((item) => item.project)?.project ?? null;

  const linkCards: ReactNode[] = [];
  if (links) {
    for (const debt of links.debts) {
      const receivable = debt.type === DebtType.RECEIVABLE;
      const kind = receivable ? "طلب" : "بدهی";
      const debtCurrency = (debt.currency as UserCurrency) || currency;
      const parts = [
        `کل ${formatPriceWithCurrency(debt.totalAmount, debtCurrency)}`,
        debt.status === "settled" ? "تسویه‌شده" : `مانده ${formatPriceWithCurrency(debt.remainingAmount, debtCurrency)}`,
        debt.due ? `سررسید ${dueText(debt.due, calendar)}` : "",
      ].filter(Boolean);
      linkCards.push(
        <LinkCard
          key={`debt-${debt._id}-${debt.role}`}
          href={PATHS.DEBT(debt._id)}
          tone={receivable ? "income" : "expense"}
          icon={<People size={18} variant="Bold" />}
          title={
            debt.role === "source"
              ? `ثبت ${kind} · ${debt.person}`
              : `تسویهٔ ${kind} · ${debt.person}${debt.settledAmount ? ` (${formatPriceWithCurrency(debt.settledAmount, debtCurrency)})` : ""}`
          }
          subtitle={`${parts.join(" · ")}${DEBT_STATUS[debt.status] && debt.status !== "settled" ? ` · ${DEBT_STATUS[debt.status]}` : ""}`}
        />,
      );
    }
    if (links.investment) {
      const item = links.investment;
      linkCards.push(
        <LinkCard
          key="investment"
          href={item.assetDeleted ? undefined : PATHS.ASSET(item.assetId)}
          tone="warning"
          icon={<Coin1 size={18} variant="Bold" />}
          title={`سرمایه‌گذاری · ${item.title}`}
          subtitle={`${toPersianDigits(formatQuantity(item.quantity))} ${item.unit} خریداری شد${item.assetDeleted ? " (دارایی حذف شده است)" : ""}`}
        />,
      );
    }
    if (links.installment) {
      const plan = links.installment;
      linkCards.push(
        <LinkCard
          key="installment"
          href={PATHS.INSTALLMENT_PLAN(plan.planId)}
          icon={<Calendar size={18} variant="Bold" />}
          title={`قسط ${toPersianDigits(plan.sequence)}${plan.totalInstallments ? ` از ${toPersianDigits(plan.totalInstallments)}` : ""} · ${plan.title}`}
          subtitle={[plan.person, `سررسید ${dueText(plan.due, calendar)}`].filter(Boolean).join(" · ")}
        />,
      );
    }
    if (links.check) {
      const check = links.check;
      linkCards.push(
        <LinkCard
          key="check"
          href={PATHS.CHECKS}
          tone="warning"
          icon={<ReceiptText size={18} variant="Bold" />}
          title={`چک ${check.type === CheckType.RECEIVABLE ? "دریافتی از" : "پرداختی به"} ${check.person}`}
          subtitle={[
            formatPriceWithCurrency(check.amount, currency),
            `سررسید ${dueText(check.due, calendar)}`,
            CHECK_STATUS[check.status] ?? "",
            check.bankName,
            check.checkNumber ? `شمارهٔ ${toPersianDigits(check.checkNumber)}` : "",
          ]
            .filter(Boolean)
            .join(" · ")}
        />,
      );
    }
    if (links.box) {
      linkCards.push(
        <LinkCard
          key="box"
          href={links.box.deleted ? undefined : PATHS.BOXES}
          icon={<EmptyWallet size={18} variant="Bold" />}
          title={`صندوق «${links.box.title}»`}
          subtitle={links.box.deleted ? "این صندوق حذف شده است" : "واریز یا برداشت از صندوق"}
        />,
      );
    }
    if (links.workSessions.length) {
      linkCards.push(
        <LinkCard
          key="work"
          href={sessionProject ? PATHS.PROJECT_ATTENDANCE(sessionProject) : PATHS.WORK_ATTENDANCE}
          icon={<Clock size={18} variant="Bold" />}
          title={`پرداخت ${toPersianDigits(links.workSessions.length)} جلسهٔ کاری`}
          subtitle={
            sessionMinutes
              ? `${toPersianDigits(Math.floor(sessionMinutes / 60))} ساعت و ${toPersianDigits(sessionMinutes % 60)} دقیقه`
              : undefined
          }
        />,
      );
    }
    if (links.venture) {
      linkCards.push(
        <LinkCard
          key="venture"
          href={PATHS.VENTURE(links.venture._id)}
          icon={<Briefcase size={18} variant="Bold" />}
          title={`سرمایه‌گذاری مشترک «${links.venture.title}»`}
          subtitle="سهم شرکا از این تراکنش در آن حساب می‌شود"
        />,
      );
    }
    if (project) {
      linkCards.push(
        <LinkCard
          key="project"
          href={PATHS.PROJECT(project._id)}
          icon={<Briefcase size={18} variant="Bold" />}
          title={`پروژهٔ «${categoryTitle}»`}
          subtitle={project.description?.trim() || undefined}
        />,
      );
    }
    if (links.bankImport) {
      linkCards.push(
        <LinkCard
          key="bank"
          icon={<Bank size={18} variant="Bold" />}
          title="از صورتحساب بانکی وارد شده"
          subtitle={
            links.bankImport.createdAt
              ? `ورود در ${new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(links.bankImport.createdAt))}`
              : undefined
          }
        />,
      );
    }
  }

  return (
    <div className="space-y-3">
      {description ? (
        <div className="rounded-2xl bg-surface-secondary/60 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
            <DocumentText size={14} aria-hidden /> توضیحات
          </p>
          <p className="whitespace-pre-wrap break-words text-sm leading-7">{description}</p>
        </div>
      ) : null}

      <div className="divide-y divide-border/40">
        <InfoRow icon={<Moneys size={16} />} label="مبلغ">
          {formatPriceWithCurrency(budget.price, currency)}
          {budget.currency && budget.currency !== "toman" ? ` · ${CURRENCY_LABELS[budget.currency]}` : ""}
        </InfoRow>
        <InfoRow icon={<Calendar size={16} />} label="تاریخ">
          {formatBudgetDateTime(budget.year, budget.month, budget.day, budget.createdAt, calendar)}
        </InfoRow>
        {categoryTitle ? (
          <InfoRow icon={<Wallet3 size={16} />} label="دسته‌بندی">
            {categoryTitle}
          </InfoRow>
        ) : null}
        {paymentCardLabel ? (
          <InfoRow icon={<Card size={16} />} label="کارت">
            {paymentCardLabel}
          </InfoRow>
        ) : null}
        {updatedAt ? (
          <InfoRow icon={<Clock size={16} />} label="آخرین ویرایش">
            {new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(updatedAt))}
          </InfoRow>
        ) : null}
      </div>

      {failed ? (
        <p className="text-xs text-muted">ارتباط‌های این تراکنش بارگذاری نشد.</p>
      ) : !details ? (
        <p className="flex items-center gap-2 text-xs text-muted">
          <Spinner size="sm" /> در حال بررسی ارتباط‌ها…
        </p>
      ) : linkCards.length ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted">مرتبط با</p>
          {linkCards}
        </div>
      ) : null}
    </div>
  );
}
