"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Switch } from "@heroui/react";
import { Add, Calendar, TickCircle, Trash } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as paymentPlansApi from "@/common/api/payment-plans";
import type {
  IPaymentPlanDetail,
  IPaymentPlanOccurrence,
} from "@/common/interfaces/payment-plan.interface";
import type { IBudget } from "@/common/interfaces/budget.interface";
import {
  formatJalaliMonthYear,
  formatPrice,
  formatCount,
  toEnglishDigits,
} from "@/common/utils";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { AttachBudgetButton } from "@/components/common/budget/AttachBudgetModal";
import {
  FormCategoryComboBox,
  FormInput,
  FormPersonComboBox,
  FormPriceInput,
  FormTextArea,
} from "@/components/common/form/FormFields";
import { useMergedPersons } from "@/common/hooks/useMergedPersons";
import { PayOccurrenceModal } from "@/components/pages/planning/PayOccurrenceModal";
import { BudgetType } from "@/types/enums";
import { useAppSelector } from "@/stores/hooks";
import { categoriesSelector } from "@/stores/category";

type PaymentPlanDetailPageProps = {
  planId: string;
};

type TabId = "overview" | "installments" | "transactions";

function occurrenceStatusLabel(status: IPaymentPlanOccurrence["status"]) {
  if (status === "paid") return "پرداخت‌شده";
  if (status === "skipped") return "رد شده";
  return "در انتظار";
}

export function PaymentPlanDetailPage({ planId }: PaymentPlanDetailPageProps) {
  const router = useRouter();
  const categories = useAppSelector(categoriesSelector);
  const categoryOptions = getCategorySelectOptions(categories ?? []);
  const persons = useMergedPersons(true);

  const [data, setData] = useState<IPaymentPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("installments");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [payTarget, setPayTarget] = useState<IPaymentPlanOccurrence | null>(null);

  const [title, setTitle] = useState("");
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [dueDayOfMonth, setDueDayOfMonth] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await paymentPlansApi.fetchPaymentPlan(planId);
      setData(detail);
      const plan = detail.plan;
      setTitle(plan.title);
      setPerson(plan.person ?? "");
      setAmount(String(plan.amount));
      setCategory(plan.category?._id ?? "");
      setDueDayOfMonth(String(plan.dueDayOfMonth));
      setDescription(plan.description ?? "");
      setActive(plan.active);
    } catch (err) {
      showErrorToast(err, "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = data?.plan.stats;
  const paidAmount = stats?.paidAmount ?? 0;
  const pendingAmount = stats?.pendingAmount ?? 0;
  const totalTracked = paidAmount + pendingAmount;
  const progress = totalTracked > 0 ? Math.min((paidAmount / totalTracked) * 100, 100) : 0;

  const pendingOccurrences = useMemo(
    () => (data?.occurrences ?? []).filter((item) => item.status === "pending"),
    [data?.occurrences],
  );

  async function saveOverview() {
    if (!title.trim()) {
      showToast("عنوان الزامی است");
      return;
    }

    setSaving(true);
    try {
      const updated = await paymentPlansApi.updatePaymentPlan(planId, {
        title: title.trim(),
        person: person.trim(),
        amount: toEnglishDigits(amount),
        category: category || undefined,
        dueDayOfMonth: toEnglishDigits(dueDayOfMonth),
        description: description.trim(),
        active,
      });
      setData((current) =>
        current ? { ...current, plan: { ...current.plan, ...updated } } : current,
      );
      showToast("ذخیره شد", "success");
      await load();
    } catch (err) {
      showErrorToast(err);
    } finally {
      setSaving(false);
    }
  }

  async function removePlan() {
    if (
      !confirm(
        "برنامه پرداخت حذف شود؟\nاقساط در انتظار حذف می‌شوند؛ تراکنش‌های ثبت‌شده باقی می‌مانند.",
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      await paymentPlansApi.deletePaymentPlan(planId);
      showToast("برنامه حذف شد", "success");
      router.push(PATHS.INSTALLMENTS);
    } catch (err) {
      showErrorToast(err, "خطا در حذف");
    } finally {
      setDeleting(false);
    }
  }

  async function skipOccurrence(item: IPaymentPlanOccurrence) {
    try {
      await paymentPlansApi.skipOccurrence(item._id);
      showToast("قسط رد شد", "success");
      await load();
    } catch (err) {
      showErrorToast(err);
    }
  }

  if (loading || !data) {
    return (
      <div className="glass rounded-2xl p-10 text-center text-muted">در حال بارگذاری…</div>
    );
  }

  const plan = data.plan;

  return (
    <div className="space-y-5 pb-6">
      <section className="glass rounded-3xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">برنامه پرداخت</p>
            <h1 className="mt-1 text-2xl font-bold">{plan.title}</h1>
            {plan.person ? (
              <p className="mt-1 text-sm text-muted">{plan.person}</p>
            ) : null}
            {plan.project?.category?.title ? (
              <Link
                href={`${PATHS.PROJECTS}/${plan.project._id}`}
                className="mt-1 inline-block text-sm text-primary"
              >
                پروژه: {plan.project.category.title}
              </Link>
            ) : null}
          </div>
          <span
            className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${
              plan.active ? "bg-income-soft text-income" : "bg-surface-secondary text-muted"
            }`}
          >
            {plan.active ? "فعال" : "غیرفعال"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-surface-secondary p-3">
            <p className="text-xs text-muted">مبلغ هر قسط</p>
            <p className="mt-1 font-bold">{formatPrice(plan.amount)}</p>
          </div>
          <div className="rounded-xl bg-income-soft/50 p-3">
            <p className="text-xs text-muted">پرداخت‌شده</p>
            <p className="mt-1 font-bold text-income">{formatPrice(paidAmount)}</p>
          </div>
          <div className="rounded-xl bg-expense-soft/50 p-3">
            <p className="text-xs text-muted">باقی‌مانده</p>
            <p className="mt-1 font-bold text-expense">{formatPrice(pendingAmount)}</p>
          </div>
          <div className="rounded-xl bg-surface-secondary p-3">
            <p className="text-xs text-muted">اقساط</p>
            <p className="mt-1 font-bold">
              {plan.totalInstallments
                ? `${formatCount(plan.completedInstallments)}/${formatCount(plan.totalInstallments)}`
                : formatCount(stats?.occurrenceCount ?? 0)}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>پیشرفت پرداخت</span>
            <span>
              {Math.round(progress)}٪ · روز {plan.dueDayOfMonth} هر ماه
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto">
        {(
          [
            { id: "installments" as const, label: "اقساط" },
            { id: "transactions" as const, label: "تراکنش‌ها" },
            { id: "overview" as const, label: "تنظیمات" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`shrink-0 cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === item.id
                ? "bg-accent text-accent-foreground"
                : "bg-surface-secondary text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="glass space-y-4 rounded-2xl p-4">
          <FormInput
            label="عنوان"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <FormPersonComboBox
            label="شخص / طرف حساب"
            value={person}
            onChange={setPerson}
            options={persons}
          />
          <FormPriceInput label="مبلغ هر قسط" value={amount} onChange={setAmount} />
          <FormCategoryComboBox
            label="دسته"
            selectedKey={category || undefined}
            onSelectionChange={(key) => setCategory(key)}
            options={categoryOptions}
          />
          <FormInput
            label="روز سررسید (۱–۳۱)"
            value={dueDayOfMonth}
            onChange={(e) => setDueDayOfMonth(e.target.value)}
          />
          <FormTextArea
            label="توضیحات"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex items-center justify-between rounded-xl bg-surface-secondary px-3 py-2">
            <span className="text-sm">برنامه فعال باشد</span>
            <Switch isSelected={active} onChange={setActive} size="sm">
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
          </div>

          <Button className="w-full" size="lg" onPress={() => void saveOverview()} isPending={saving}>
            ذخیره تغییرات
          </Button>

          <section className="rounded-2xl border border-dashed border-danger/35 bg-danger/5 p-4">
            <p className="text-sm font-medium text-danger">منطقه خطر</p>
            <p className="mt-1 text-xs leading-6 text-muted">
              با حذف برنامه، اقساط در انتظار حذف می‌شوند؛ تراکنش‌های ثبت‌شده از پرداخت اقساط باقی
              می‌مانند.
            </p>
            <Button
              className="mt-3"
              variant="danger"
              onPress={() => void removePlan()}
              isPending={deleting}
            >
              <Trash size={18} />
              حذف برنامه
            </Button>
          </section>
        </div>
      )}

      {tab === "installments" && (
        <div className="space-y-3">
          {pendingOccurrences.length > 0 && (
            <p className="text-sm text-muted">
              {formatCount(pendingOccurrences.length)} قسط در انتظار پرداخت
            </p>
          )}
          {data.occurrences.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-muted">
              هنوز قسطی برای این برنامه ثبت نشده
            </div>
          ) : (
            data.occurrences.map((item) => (
              <article key={item._id} className="glass rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      قسط {item.sequence}
                      {plan.totalInstallments ? ` از ${plan.totalInstallments}` : ""}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                      <Calendar size={14} />
                      {formatJalaliMonthYear(String(item.year), String(item.month))} · روز {item.day}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold">{formatPrice(item.amount)}</p>
                    <p className="text-xs text-muted">{occurrenceStatusLabel(item.status)}</p>
                  </div>
                </div>

                {item.status === "paid" ? (
                  <div className="mt-3 flex items-center gap-2 text-sm text-income">
                    <TickCircle size={18} variant="Bold" />
                    پرداخت شد
                    {item.payNote ? ` · ${item.payNote}` : ""}
                  </div>
                ) : item.status === "skipped" ? (
                  <p className="mt-3 text-sm text-muted">
                    رد شده{item.payNote ? ` · ${item.payNote}` : ""}
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" className="flex-1 min-w-[7rem]" onPress={() => setPayTarget(item)}>
                      پرداخت شد
                    </Button>
                    <AttachBudgetButton
                      title="وصل تراکنش"
                      description="یک تراکنش پرداختی قبلی را به این قسط وصل کنید."
                      context={{ type: "occurrence", contextId: planId }}
                      selectionMode="single"
                      onAttach={async (budgetId) => {
                        await paymentPlansApi.linkOccurrenceBudget(item._id, { budgetId });
                        await load();
                      }}
                      attachLabel="وصل"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 min-w-[7rem]"
                      onPress={() => void skipOccurrence(item)}
                    >
                      رد کردن
                    </Button>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      )}

      {tab === "transactions" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              {formatCount(data.budgets.length)} تراکنش از پرداخت اقساط
            </p>
            <Link href={PATHS.CREATE_BUDGET}>
              <Button size="sm" variant="secondary">
                <Add size={16} />
                تراکنش جدید
              </Button>
            </Link>
          </div>
          <p className="text-xs leading-6 text-muted">
            برای وصل کردن تراکنش‌های قبلی، در تب «اقساط» روی «وصل تراکنش» همان قسط بزنید.
          </p>
          {data.budgets.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-muted">
              هنوز تراکنشی از پرداخت این برنامه ثبت نشده
            </div>
          ) : (
            data.budgets.map((budget: IBudget) => (
              <BudgetRow key={budget._id} budget={budget} />
            ))
          )}
        </div>
      )}

      <PayOccurrenceModal
        occurrence={payTarget}
        open={!!payTarget}
        onOpenChange={(open) => !open && setPayTarget(null)}
        onPaid={() => {
          setPayTarget(null);
          void load();
        }}
      />
    </div>
  );
}

function BudgetRow({ budget }: { budget: IBudget }) {
  const isIncome = budget.type === BudgetType.INCOME;
  const categoryTitle =
    typeof budget.category === "object" && budget.category ? budget.category.title : "";

  return (
    <Link
      href={PATHS.BUDGET(budget._id)}
      className="block glass rounded-2xl p-4 transition hover:border-accent/40"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{categoryTitle || "بدون دسته"}</p>
          {budget.description ? (
            <p className="mt-1 line-clamp-1 text-xs text-muted">{budget.description}</p>
          ) : null}
        </div>
        <p className={`shrink-0 font-bold ${isIncome ? "text-income" : "text-expense"}`}>
          {formatPrice(budget.price)}
        </p>
      </div>
    </Link>
  );
}
