"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@heroui/react";
import { Add } from "iconsax-reactjs";

import * as budgetsApi from "@/common/api/budgets";
import * as debtsApi from "@/common/api/debts";
import * as partnersApi from "@/common/api/partners";
import * as paymentCardsApi from "@/common/api/payment-cards";
import { PATHS } from "@/common/constants";
import { resolveDefaultPaymentCardId } from "@/common/utils/default-payment-card";
import { formatCardNumberForDisplay } from "@/common/utils/payment-card";
import type { IBudget } from "@/common/interfaces/budget.interface";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { getJalaliNow, normalizeJalaliPart, toEnglishDigits, formatPrice } from "@/common/utils";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormCategoryComboBox, FormDatePicker, FormPriceInput, FormSelect, FormTextArea } from "@/components/common/form/FormFields";
import { BudgetMoreToggle } from "@/components/pages/budget/BudgetMoreToggle";
import {
  DebtLedgerSection,
  LinkedDebtSummary,
  type DebtLedgerMode,
  type DebtLedgerValue,
} from "@/components/pages/budget/DebtLedgerSection";
import {
  ProjectLedgerSection,
  resolveProjectId,
  type ProjectLedgerValue,
} from "@/components/pages/budget/ProjectLedgerSection";
import {
  LinkedVentureSummary,
  VentureLedgerSection,
  resolveVentureId,
  type VentureLedgerValue,
} from "@/components/pages/budget/VentureLedgerSection";
import { CreateCategoryModal } from "@/components/pages/categories/CreateCategoryModal";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { bumpBudgetRevision } from "@/stores/budget";
import { categoriesSelector } from "@/stores/category";
import { setProfile, userSelector } from "@/stores/profile";
import { BudgetType, CategoryKind, DebtType } from "@/types/enums";

type BudgetFormPageProps = {
  budget?: IBudget;
};

const initialDebtLedger: DebtLedgerValue = {
  enabled: false,
  mode: "create",
  debtType: String(DebtType.RECEIVABLE),
  person: "",
  settleDebtId: "",
};

function isSettleDebtMode(mode: DebtLedgerMode) {
  return mode === "settle-receivable" || mode === "settle-payable";
}

function resolveBudgetPaymentCardId(
  paymentCard?: IBudget["paymentCard"],
): string {
  if (!paymentCard) return "";
  if (typeof paymentCard === "string") return paymentCard;
  return paymentCard._id;
}

function buildMoreHint(parts: string[]) {
  return parts.length ? parts.join(" · ") : null;
}

export function BudgetFormPage({ budget }: BudgetFormPageProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const categories = useAppSelector(categoriesSelector);
  const categoryOptions = getCategorySelectOptions(categories ?? []);
  const now = getJalaliNow();
  const defaultYear = String(now.jYear());
  const defaultMonth = String(now.jMonth() + 1);
  const defaultDay = String(now.jDate());
  const existingProjectId = resolveProjectId(budget?.project);
  const existingVentureId = resolveVentureId(budget?.venture);
  const existingPaymentCardId = resolveBudgetPaymentCardId(budget?.paymentCard);

  const [price, setPrice] = useState(String(budget?.price ?? ""));
  const [type, setType] = useState(String(budget?.type ?? BudgetType.COST));
  const [category, setCategory] = useState(budget?.category?._id ?? "");
  const [year, setYear] = useState(() =>
    normalizeJalaliPart(budget?.year, defaultYear),
  );
  const [month, setMonth] = useState(() =>
    normalizeJalaliPart(budget?.month, defaultMonth),
  );
  const [day, setDay] = useState(() => normalizeJalaliPart(budget?.day, defaultDay));
  const selectedCategory = useMemo(
    () => (categories ?? []).find((item) => item._id === category),
    [categories, category],
  );
  const isProjectCategory = selectedCategory?.kind === CategoryKind.PROJECT;
  const [description, setDescription] = useState(budget?.description ?? "");
  const [loading, setLoading] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [debtLedger, setDebtLedger] = useState<DebtLedgerValue>(initialDebtLedger);
  const [projectLedger, setProjectLedger] = useState<ProjectLedgerValue>(() => ({
    enabled: Boolean(existingProjectId) && !existingVentureId,
    projectId: existingProjectId,
  }));
  const [ventureLedger, setVentureLedger] = useState<VentureLedgerValue>({
    enabled: false,
    ventureId: "",
  });
  const [moreOpen, setMoreOpen] = useState(
    () =>
      Boolean(
        budget?.debt ||
          existingPaymentCardId ||
          existingProjectId ||
          existingVentureId,
      ),
  );
  const [paymentCards, setPaymentCards] = useState<IPaymentCard[]>([]);
  const [paymentCardId, setPaymentCardId] = useState(() => existingPaymentCardId);

  const paymentCardOptions = useMemo(
    () =>
      paymentCards.map((card) => ({
        id: card._id,
        label: [card.title, formatCardNumberForDisplay(card.lastFour, true)]
          .filter(Boolean)
          .join(" · "),
      })),
    [paymentCards],
  );

  useEffect(() => {
    void paymentCardsApi.fetchPaymentCards().then(setPaymentCards).catch(() => {
      setPaymentCards([]);
    });
  }, []);

  useEffect(() => {
    if (budget || !paymentCards.length || type !== String(BudgetType.COST)) return;

    setPaymentCardId((current) => {
      if (current) return current;
      return resolveDefaultPaymentCardId(paymentCards, user?._id);
    });
  }, [budget, paymentCards, type, user?._id]);

  const [categorySpendHint, setCategorySpendHint] = useState<string | null>(null);

  useEffect(() => {
    if (
      type !== String(BudgetType.COST) ||
      !category ||
      !selectedCategory?.monthlyLimit
    ) {
      setCategorySpendHint(null);
      return;
    }

    const limit = selectedCategory.monthlyLimit;
    const now = getJalaliNow();

    void budgetsApi
      .fetchBudgets({
        duration: "monthly",
        year: String(now.jYear()),
        month: String(now.jMonth() + 1),
        category,
      })
      .then((data) => {
        const spent = data.totalCostPrice;
        const remaining = limit - spent;
        setCategorySpendHint(
          remaining >= 0
            ? `سقف ${formatPrice(limit)} · خرج این ماه ${formatPrice(spent)} · مانده ${formatPrice(remaining)}`
            : `سقف ${formatPrice(limit)} · خرج این ماه ${formatPrice(spent)} · ${formatPrice(Math.abs(remaining))} بیش از سقف`,
        );
      })
      .catch(() => setCategorySpendHint(null));
  }, [category, selectedCategory?.monthlyLimit, type]);

  const projectBlockedForVenture =
    Boolean(existingProjectId) ||
    Boolean(projectLedger.enabled && projectLedger.projectId) ||
    isProjectCategory;

  const moreHint = buildMoreHint(
    [
      paymentCardId ? "کارت مبدا" : "",
      debtLedger.enabled ? "طلب/بدهی" : "",
      projectLedger.enabled || isProjectCategory ? "پروژه" : "",
      ventureLedger.enabled || existingVentureId ? "کسب‌وکار" : "",
      budget?.debt ? "طلب/بدهی" : "",
    ].filter(Boolean),
  );

  function updateProjectLedger(patch: Partial<ProjectLedgerValue>) {
    setProjectLedger((current) => {
      const next = { ...current, ...patch };
      if (patch.enabled === false) {
        next.projectId = "";
      }
      return next;
    });
    if (patch.enabled) {
      setVentureLedger((current) =>
        current.enabled ? { enabled: false, ventureId: "" } : current,
      );
    }
  }

  function updateVentureLedger(patch: Partial<VentureLedgerValue>) {
    setVentureLedger((current) => ({ ...current, ...patch }));
    if (patch.enabled) {
      setProjectLedger((current) =>
        current.enabled ? { enabled: false, projectId: "" } : current,
      );
    }
  }

  function handleDateChange(value: { year: string; month: string; day: string }) {
    setYear(value.year);
    setMonth(value.month);
    setDay(value.day);
  }

  function updateDebtLedger(patch: Partial<DebtLedgerValue>) {
    if (patch.mode === "settle-receivable") {
      setType(String(BudgetType.INCOME));
    } else if (patch.mode === "settle-payable") {
      setType(String(BudgetType.COST));
    } else if (patch.mode === "create" || patch.debtType !== undefined) {
      const nextDebtType = patch.debtType ?? debtLedger.debtType;
      setType(
        nextDebtType === String(DebtType.RECEIVABLE)
          ? String(BudgetType.COST)
          : String(BudgetType.INCOME),
      );
    }

    setDebtLedger((current) => {
      const next = { ...current, ...patch };
      if (patch.mode && patch.mode !== current.mode) {
        next.settleDebtId = "";
      }
      return next;
    });
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    const payload: Record<string, string> = {
      price: toEnglishDigits(price),
      type: String(type),
      category,
      year: String(year),
      month: String(month),
      day: String(day),
      description,
      paymentCardId: paymentCardId || "",
    };

    if (projectLedger.enabled && projectLedger.projectId) {
      payload.projectId = projectLedger.projectId;
    }

    if (ventureLedger.enabled && projectBlockedForVenture) {
      showToast("تراکنش نمی‌تواند هم‌زمان به پروژه و کسب‌وکار مشترک وصل شود");
      return;
    }

    if (ventureLedger.enabled && !existingVentureId) {
      if (!ventureLedger.ventureId) {
        setMoreOpen(true);
        showToast("کسب‌وکار مورد نظر را انتخاب کنید");
        return;
      }
    }

    if (!payload.price || !payload.category || !payload.year || !payload.month || !payload.day) {
      showToast("مبلغ، دسته‌بندی و تاریخ الزامی است");
      return;
    }

    const canAttachDebt = !budget?.debt;

    if (debtLedger.enabled && canAttachDebt) {
      if (debtLedger.mode === "create" && !debtLedger.person.trim()) {
        setMoreOpen(true);
        showToast("نام طرف حساب الزامی است");
        return;
      }
      if (isSettleDebtMode(debtLedger.mode) && !debtLedger.settleDebtId) {
        setMoreOpen(true);
        showToast("طلب یا بدهی مورد نظر را انتخاب کنید");
        return;
      }
    }

    setLoading(true);
    try {
      let userBudget: number | undefined;
      let savedBudgetId = budget?._id ?? "";

      if (budget) {
        const res = await budgetsApi.updateBudget(budget._id, payload);
        userBudget = res.userBudget;
        savedBudgetId = budget._id;

        if (debtLedger.enabled && canAttachDebt) {
          if (debtLedger.mode === "create") {
            await debtsApi.createDebt({
              sourceBudgetId: budget._id,
              type: debtLedger.debtType,
              person: debtLedger.person.trim(),
              amount: toEnglishDigits(price),
            });
            showToast("تراکنش ویرایش و طلب/بدهی ثبت شد", "success");
          } else {
            await debtsApi.settleDebt(debtLedger.settleDebtId, {
              budgetId: budget._id,
              amount: toEnglishDigits(price),
            });
            showToast("تراکنش ویرایش و طلب/بدهی تسویه شد", "success");
          }
        } else {
          showToast("تراکنش ویرایش شد", "success");
        }
      } else {
        const res = await budgetsApi.createBudget(payload);
        userBudget = res.userBudget;
        savedBudgetId = res.budget._id;

        if (debtLedger.enabled) {
          if (debtLedger.mode === "create") {
            await debtsApi.createDebt({
              sourceBudgetId: res.budget._id,
              type: debtLedger.debtType,
              person: debtLedger.person.trim(),
              amount: toEnglishDigits(price),
            });
            showToast("تراکنش و طلب/بدهی ثبت شد", "success");
          } else {
            await debtsApi.settleDebt(debtLedger.settleDebtId, {
              budgetId: res.budget._id,
              amount: toEnglishDigits(price),
            });
            showToast("تراکنش ثبت و طلب/بدهی تسویه شد", "success");
          }
        } else {
          showToast("تراکنش ثبت شد", "success");
        }
      }

      if (
        ventureLedger.enabled &&
        ventureLedger.ventureId &&
        !existingVentureId &&
        savedBudgetId
      ) {
        await partnersApi.attachVentureBudget(
          ventureLedger.ventureId,
          savedBudgetId,
        );
      }

      if (user && userBudget !== undefined) {
        dispatch(setProfile({ ...user, budget: userBudget }));
      }
      dispatch(bumpBudgetRevision());
      router.push(`/?duration=monthly&year=${year}&month=${month}`);
    } catch (err) {
      showErrorToast(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-form-page">
      <form onSubmit={(e) => void submit(e)}>
        <div className="glass space-y-4 rounded-2xl p-4">
          <p className="text-sm text-muted">
            {budget ? "ویرایش تراکنش" : "ثبت تراکنش جدید"}
          </p>

          <div className="flex gap-2">
            {[
              { id: String(BudgetType.INCOME), label: "دریافتی" },
              { id: String(BudgetType.COST), label: "پرداختی" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setType(item.id);
                  setDebtLedger((current) => {
                    if (!current.enabled) return current;

                    if (item.id === String(BudgetType.INCOME)) {
                      if (current.mode === "create" || current.mode === "settle-payable") {
                        return { ...current, mode: "settle-receivable", settleDebtId: "" };
                      }
                    } else if (current.mode === "settle-receivable") {
                      return { ...current, mode: "settle-payable", settleDebtId: "" };
                    }

                    return current;
                  });
                }}
                className={`flex-1 cursor-pointer rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                  type === item.id
                    ? item.id === String(BudgetType.INCOME)
                      ? "border-[var(--brand-teal)] bg-income-soft text-income"
                      : "border-[var(--brand-rose)] bg-expense-soft text-expense"
                    : "border-border bg-surface-secondary text-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <FormPriceInput
            label="مبلغ (تومان)"
            value={price}
            onChange={setPrice}
          />

          <FormDatePicker
            label="تاریخ (شمسی)"
            year={year}
            month={month}
            day={day}
            onChange={handleDateChange}
          />

          <FormCategoryComboBox
            label="دسته‌بندی"
            placeholder="جستجو یا انتخاب دسته‌بندی"
            selectedKey={category || undefined}
            onSelectionChange={(key) => setCategory(key)}
            options={categoryOptions}
            emptyMessage="دسته‌ای ثبت نشده"
          />

          {categorySpendHint ? (
            <p
              className={`rounded-xl px-3 py-2 text-xs leading-6 ${
                categorySpendHint.includes("بیش از سقف")
                  ? "bg-expense-soft text-expense"
                  : "bg-surface-secondary text-muted"
              }`}
            >
              {categorySpendHint}
            </p>
          ) : null}

          <FormTextArea
            label="توضیحات"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <BudgetMoreToggle
            open={moreOpen}
            onToggle={() => setMoreOpen((current) => !current)}
            hint={moreOpen ? null : moreHint}
          />

          {moreOpen ? (
            <div className="space-y-4">
              <FormSelect
                label={
                  type === String(BudgetType.COST)
                    ? "کارت پرداخت (مبدا)"
                    : "کارت دریافت (مقصد)"
                }
                placeholder="بدون کارت"
                selectedKey={paymentCardId || "none"}
                onSelectionChange={(key) =>
                  setPaymentCardId(key === "none" ? "" : key)
                }
                options={[{ id: "none", label: "بدون کارت" }, ...paymentCardOptions]}
                emptyMessage="کارتی ثبت نشده"
              />
              {paymentCards.length === 0 ? (
                <p className="text-xs text-muted">
                  هنوز کارتی ثبت نکرده‌اید. از{" "}
                  <Link href={PATHS.PAYMENT_CARDS} className="text-accent underline">
                    کارت‌های من
                  </Link>{" "}
                  اضافه کنید.
                </p>
              ) : null}

              {!budget?.debt ? (
                <DebtLedgerSection
                  amount={price}
                  value={debtLedger}
                  onChange={updateDebtLedger}
                />
              ) : (
                <LinkedDebtSummary debt={budget.debt} />
              )}

              {existingVentureId ? (
                <LinkedVentureSummary
                  venture={budget?.venture ?? existingVentureId}
                />
              ) : (
                <VentureLedgerSection
                  value={ventureLedger}
                  onChange={updateVentureLedger}
                  projectBlocked={projectBlockedForVenture}
                />
              )}

              {!existingVentureId ? (
                <ProjectLedgerSection
                  value={projectLedger}
                  onChange={updateProjectLedger}
                  isProjectCategory={isProjectCategory}
                  categoryTitle={selectedCategory?.title}
                />
              ) : null}
            </div>
          ) : null}

          <div className="border-t border-border/50 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onPress={() => setCategoryModalOpen(true)}
            >
              <Add size={18} />
              ایجاد دسته‌بندی
            </Button>
          </div>

          <div className="flex flex-col gap-2 border-t border-border/50 pt-4">
            <Button type="submit" className="w-full" size="lg" isPending={loading}>
              {budget ? "ذخیره تغییرات" : "ثبت تراکنش"}
            </Button>
            <Button
              type="button"
              className="w-full"
              variant="ghost"
              onPress={() => router.back()}
            >
              انصراف
            </Button>
          </div>
        </div>
      </form>

      <CreateCategoryModal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
        onCreated={(created) => setCategory(created._id)}
      />
    </div>
  );
}
