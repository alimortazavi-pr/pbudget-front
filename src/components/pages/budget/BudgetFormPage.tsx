"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

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
import type { IBudget, IBudgetMutationResult } from "@/common/interfaces/budget.interface";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { getJalaliNow, normalizeJalaliPart, toEnglishDigits, formatPrice, getNowDateParts } from "@/common/utils";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import {
  DEFAULT_USER_PREFERENCES,
  resolveBudgetCurrency,
  resolveBudgetDateCalendar,
} from "@/common/constants/user-preferences";
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { mergeProfileWallet } from "@/common/utils/wallet-balances";
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
import { UserPreferencesOnboardingModal } from "@/components/pages/settings/UserPreferencesSection";
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
  const { t } = useTranslation();
  const { currencyLabel } = useCurrencyLabels();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const categories = useAppSelector(categoriesSelector);
  const categoryOptions = getCategorySelectOptions(categories ?? []);
  const userPrefs = user?.preferences ?? DEFAULT_USER_PREFERENCES;
  const formCalendar = budget
    ? resolveBudgetDateCalendar(budget.dateCalendar)
    : userPrefs.dateCalendar;
  const formCurrency = budget
    ? resolveBudgetCurrency(budget.currency)
    : userPrefs.currency;
  const nowParts = getNowDateParts(formCalendar);
  const defaultYear = nowParts.year;
  const defaultMonth = nowParts.month;
  const defaultDay = nowParts.day;
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
  const [prefsModalOpen, setPrefsModalOpen] = useState(false);

  const needsPreferencesOnboarding =
    !budget &&
    Boolean(user) &&
    !user?.preferences?.configured &&
    !user?.hasAnyBudget;

  useEffect(() => {
    if (needsPreferencesOnboarding) {
      setPrefsModalOpen(true);
    }
  }, [needsPreferencesOnboarding]);

  useEffect(() => {
    if (budget) return;
    const parts = getNowDateParts(userPrefs.dateCalendar);
    setYear(parts.year);
    setMonth(parts.month);
    setDay(parts.day);
  }, [budget, userPrefs.dateCalendar, userPrefs.currency]);

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
        year: now.format("jYYYY"),
        month: String(Number(now.format("jM"))),
        category,
      })
      .then((data) => {
        const spent = data.totalCostPrice;
        const remaining = limit - spent;
        setCategorySpendHint(
          remaining >= 0
            ? `سقف ${formatPriceWithCurrency(limit, formCurrency)} · خرج این ماه ${formatPriceWithCurrency(spent, formCurrency)} · مانده ${formatPriceWithCurrency(remaining, formCurrency)}`
            : `سقف ${formatPriceWithCurrency(limit, formCurrency)} · خرج این ماه ${formatPriceWithCurrency(spent, formCurrency)} · ${formatPriceWithCurrency(Math.abs(remaining), formCurrency)} بیش از سقف`,
        );
      })
      .catch(() => setCategorySpendHint(null));
  }, [category, selectedCategory?.monthlyLimit, type, formCurrency]);

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

    if (needsPreferencesOnboarding && !user?.preferences?.configured) {
      setPrefsModalOpen(true);
      showToast(t("auto.k5e9c511366"));
      return;
    }

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

    if (!budget) {
      payload.currency = formCurrency;
      payload.dateCalendar = formCalendar;
    }

    if (projectLedger.enabled && projectLedger.projectId) {
      payload.projectId = projectLedger.projectId;
    }

    if (ventureLedger.enabled && projectBlockedForVenture) {
      showToast(t("auto.k5b91c2c10b"));
      return;
    }

    if (ventureLedger.enabled && !existingVentureId) {
      if (!ventureLedger.ventureId) {
        setMoreOpen(true);
        showToast(t("auto.ka4a8534355"));
        return;
      }
    }

    if (!payload.price || !payload.category || !payload.year || !payload.month || !payload.day) {
      showToast(t("auto.kae3c7316cd"));
      return;
    }

    const canAttachDebt = !budget?.debt;

    if (debtLedger.enabled && canAttachDebt) {
      if (debtLedger.mode === "create" && !debtLedger.person.trim()) {
        setMoreOpen(true);
        showToast(t("auto.ka7190d81dc"));
        return;
      }
      if (isSettleDebtMode(debtLedger.mode) && !debtLedger.settleDebtId) {
        setMoreOpen(true);
        showToast(t("auto.k55cf141e8e"));
        return;
      }
    }

    setLoading(true);
    try {
      let mutationResult: IBudgetMutationResult | undefined;
      let savedBudgetId = budget?._id ?? "";

      if (budget) {
        const res = await budgetsApi.updateBudget(budget._id, payload);
        mutationResult = res;
        savedBudgetId = budget._id;

        if (debtLedger.enabled && canAttachDebt) {
          if (debtLedger.mode === "create") {
            await debtsApi.createDebt({
              sourceBudgetId: budget._id,
              type: debtLedger.debtType,
              person: debtLedger.person.trim(),
              amount: toEnglishDigits(price),
            });
            showToast(t("auto.k0771d7584c"), "success");
          } else {
            await debtsApi.settleDebt(debtLedger.settleDebtId, {
              budgetId: budget._id,
              amount: toEnglishDigits(price),
            });
            showToast(t("auto.k3cfdaf1315"), "success");
          }
        } else {
          showToast(t("auto.ka1c79727b7"), "success");
        }
      } else {
        const res = await budgetsApi.createBudget(payload);
        mutationResult = res;
        savedBudgetId = res.budget._id;

        if (debtLedger.enabled) {
          if (debtLedger.mode === "create") {
            await debtsApi.createDebt({
              sourceBudgetId: res.budget._id,
              type: debtLedger.debtType,
              person: debtLedger.person.trim(),
              amount: toEnglishDigits(price),
            });
            showToast(t("auto.kd0a4241bd6"), "success");
          } else {
            await debtsApi.settleDebt(debtLedger.settleDebtId, {
              budgetId: res.budget._id,
              amount: toEnglishDigits(price),
            });
            showToast(t("auto.kaafb9fefce"), "success");
          }
        } else {
          showToast(t("auto.k99542d84e0"), "success");
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

      if (user && mutationResult) {
        dispatch(
          setProfile(
            mergeProfileWallet(
              {
                ...user,
                hasAnyBudget: true,
                preferences: {
                  ...(user.preferences ?? DEFAULT_USER_PREFERENCES),
                  configured: true,
                },
              },
              mutationResult,
            ),
          ),
        );
      }
      dispatch(bumpBudgetRevision());
      router.push(`${PATHS.HOME}?duration=monthly&year=${year}&month=${month}`);
    } catch (err) {
      showErrorToast(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-form-page">
      <UserPreferencesOnboardingModal
        open={prefsModalOpen}
        onConfigured={() => setPrefsModalOpen(false)}
      />
      <form onSubmit={(e) => void submit(e)}>
        <div className="glass space-y-4 rounded-2xl p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm text-muted">
              {budget ? "ویرایش تراکنش" : "ثبت تراکنش جدید"}
            </p>
            {!budget ? (
              <Link
                href={PATHS.BANK_IMPORT}
                className="text-xs font-semibold text-accent underline-offset-2 hover:underline"
              >
                ورود گروهی از صورتحساب بانک
              </Link>
            ) : null}
          </div>

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
            label={`مبلغ (${currencyLabel(formCurrency)})`}
            value={price}
            onChange={setPrice}
            currency={formCurrency}
          />

          <FormDatePicker
            label={formCalendar === "gregorian" ? "تاریخ (میلادی)" : "تاریخ (شمسی)"}
            year={year}
            month={month}
            day={day}
            onChange={handleDateChange}
            calendarType={formCalendar}
          />

          <FormCategoryComboBox
            label={t("auto.kb561a47a9b")}
            placeholder={t("common.searchCategoryPlaceholder")}
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
            label={t("common.description")}
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
                placeholder={t("auto.k33fcba0b6e")}
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
