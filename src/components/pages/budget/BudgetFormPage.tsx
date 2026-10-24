"use client";

import { useTranslation } from "@/i18n";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@heroui/react";
import { Add } from "iconsax-reactjs";

import * as budgetsApi from "@/common/api/budgets";
import * as debtsApi from "@/common/api/debts";
import * as partnersApi from "@/common/api/partners";
import * as paymentCardsApi from "@/common/api/payment-cards";
import * as paymentPlansApi from "@/common/api/payment-plans";
import * as templatesApi from "@/common/api/transaction-templates";
import { PATHS } from "@/common/constants";
import { resolveDefaultPaymentCardId } from "@/common/utils/default-payment-card";
import { formatCardNumberForDisplay } from "@/common/utils/payment-card";
import type { IBudget, IBudgetMutationResult } from "@/common/interfaces/budget.interface";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import type { ITransactionTemplate } from "@/common/interfaces/transaction-template.interface";
import { normalizeJalaliPart, toEnglishDigits, getNowDateParts } from "@/common/utils";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { fetchOpenDebtsForPerson } from "@/common/utils/debt-person-match";
import {
  CURRENCY_OPTIONS,
  DEFAULT_USER_PREFERENCES,
  resolveBudgetCurrency,
  resolveBudgetDateCalendar,
  type UserCurrency,
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
  InstallmentLedgerSection,
  type InstallmentLedgerValue,
} from "@/components/pages/budget/InstallmentLedgerSection";
import {
  LinkedVentureSummary,
  VentureLedgerSection,
  resolveVentureId,
  type VentureLedgerValue,
} from "@/components/pages/budget/VentureLedgerSection";
import { SaveTemplateModal } from "@/components/pages/budget/SaveTemplateModal";
import { TemplateChipsRow } from "@/components/pages/budget/TemplateChipsRow";
import { CreateCategoryModal } from "@/components/pages/categories/CreateCategoryModal";
import { UserPreferencesOnboardingModal } from "@/components/pages/settings/UserPreferencesSection";
import { useFeatureFlag } from "@/components/providers/SubscriptionAccessProvider";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { bumpBudgetRevision } from "@/stores/budget";
import { categoriesSelector } from "@/stores/category";
import { setProfile, userSelector } from "@/stores/profile";
import { BudgetType, CategoryKind, DebtType } from "@/types/enums";
import {
  initialInvestmentLedger,
  InvestmentLedgerSection,
  investmentPayload,
  isInvestmentComplete,
  type InvestmentLedgerValue,
} from "@/components/pages/budget/InvestmentLedgerSection";

type BudgetFormPageProps = {
  budget?: IBudget;
};

const initialDebtLedger: DebtLedgerValue = {
  enabled: false,
  mode: "create",
  debtType: String(DebtType.RECEIVABLE),
  person: "",
  settleDebtId: "",
  forceCreateNew: false,
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
  const { enabled: templatesEnabled } = useFeatureFlag("templates");
  const { enabled: balancesEnabled } = useFeatureFlag("account_balances");
  const { enabled: assetsEnabled } = useFeatureFlag("assets");
  const { displayCurrencyLabel } = useCurrencyLabels();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const categories = useAppSelector(categoriesSelector);
  const categoryOptions = getCategorySelectOptions(categories ?? []);
  const userPrefs = user?.preferences ?? DEFAULT_USER_PREFERENCES;
  const formCalendar = budget
    ? resolveBudgetDateCalendar(budget.dateCalendar)
    : userPrefs.dateCalendar;
  const [formCurrency, setFormCurrency] = useState<UserCurrency>(() =>
    budget
      ? resolveBudgetCurrency(budget.currency)
      : userPrefs.currency,
  );
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
  const [installmentLedger, setInstallmentLedger] = useState<InstallmentLedgerValue>({
    enabled: false,
    occurrenceId: "",
  });
  const [projectLedger, setProjectLedger] = useState<ProjectLedgerValue>(() => ({
    enabled: Boolean(existingProjectId) && !existingVentureId,
    projectId: existingProjectId,
  }));
  const [ventureLedger, setVentureLedger] = useState<VentureLedgerValue>({
    enabled: false,
    ventureId: "",
  });
  const [investment, setInvestment] = useState<InvestmentLedgerValue>(initialInvestmentLedger);
  // Editing a transaction that already bought an asset.
  const [investmentLinked, setInvestmentLinked] = useState(false);
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
  const [templates, setTemplates] = useState<ITransactionTemplate[]>([]);
  const [appliedTemplateId, setAppliedTemplateId] = useState("");
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [keepOpenLoading, setKeepOpenLoading] = useState(false);

  const needsPreferencesOnboarding =
    !budget &&
    Boolean(user) &&
    !user?.preferences?.configured &&
    !user?.hasAnyBudget;

  // Deep links such as /create-budget?projectId=…&type=0 prefill a new entry.
  useEffect(() => {
    if (budget || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const presetProject = params.get("projectId");
    const presetType = params.get("type");
    if (presetProject) {
      setProjectLedger({ enabled: true, projectId: presetProject });
      setMoreOpen(true);
    }
    if (presetType === "0" || presetType === "1") setType(presetType);
    // Quick entry from the command palette ("۲۵۰ هزار خوراک ناهار").
    const presetPrice = params.get("price");
    if (presetPrice && /^\d+$/.test(presetPrice)) setPrice(presetPrice);
    const presetCategory = params.get("category");
    if (presetCategory) setCategory(presetCategory);
    const presetDescription = params.get("description");
    if (presetDescription) setDescription(presetDescription.slice(0, 500));
  }, [budget]);

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
    setFormCurrency(userPrefs.currency);
  }, [budget, userPrefs.dateCalendar, userPrefs.currency]);

  const [accountBalances, setAccountBalances] = useState<Record<string, number>>({});
  const paymentCardOptions = useMemo(
    () =>
      paymentCards.map((card) => ({
        id: card._id,
        label: [
          card.title,
          formatCardNumberForDisplay(card.lastFour, true),
          card._id in accountBalances
            ? t("feat.accounts.pickerBalance", { amount: formatPriceWithCurrency(accountBalances[card._id], userPrefs.currency) })
            : "",
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    [paymentCards, accountBalances, t, userPrefs.currency],
  );

  useEffect(() => {
    if (!balancesEnabled) {
      setAccountBalances({});
      return;
    }
    void paymentCardsApi
      .fetchAccountBalances()
      .then((rows) => setAccountBalances(Object.fromEntries(rows.map((row) => [row.cardId, row.balance]))))
      .catch(() => setAccountBalances({}));
  }, [balancesEnabled]);

  useEffect(() => {
    void paymentCardsApi.fetchPaymentCards().then(setPaymentCards).catch(() => {
      setPaymentCards([]);
    });
  }, []);

  const loadTemplates = useCallback(async () => {
    if (!templatesEnabled) {
      setTemplates([]);
      return;
    }
    try {
      setTemplates(await templatesApi.fetchTemplates());
    } catch {
      // Templates are optional: the form works the same without them.
      setTemplates([]);
    }
  }, [templatesEnabled]);

  useEffect(() => {
    if (!budget) void loadTemplates();
  }, [budget, loadTemplates]);

  // /create-budget?template=ID (from "ثبت امروز" on the templates page) fills the form once.
  const [deepLinkDone, setDeepLinkDone] = useState(false);
  useEffect(() => {
    if (budget || deepLinkDone || !templates.length || typeof window === "undefined") return;
    const id = new URLSearchParams(window.location.search).get("template");
    setDeepLinkDone(true);
    const found = id ? templates.find((item) => item._id === id) : undefined;
    if (found) applyTemplate(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply once after the templates load
  }, [budget, deepLinkDone, templates]);

  function focusAmountField() {
    window.setTimeout(() => {
      document.querySelector<HTMLInputElement>('[data-tour="budget-amount"] input')?.focus();
    }, 50);
  }

  function applyTemplate(template: ITransactionTemplate) {
    setAppliedTemplateId(template._id);
    setType(String(template.type));
    setPrice(template.price > 0 ? String(template.price) : "");
    setCategory(template.category ?? "");
    setPaymentCardId(template.paymentCard ?? "");
    setDescription(template.description ?? "");
    setProjectLedger({ enabled: Boolean(template.project), projectId: template.project ?? "" });
    setVentureLedger({ enabled: false, ventureId: "" });
    setDebtLedger(initialDebtLedger);
    setInstallmentLedger({ enabled: false, occurrenceId: "" });
    if (template.paymentCard || template.project) setMoreOpen(true);
    // The date stays today; an amount of 0 means "ask every time".
    if (template.price <= 0) focusAmountField();
  }

  async function saveAsTemplate(title: string) {
    try {
      const priceValue = Number(toEnglishDigits(price));
      await templatesApi.createTemplate({
        title,
        type: type === String(BudgetType.INCOME) ? "0" : "1",
        price: priceValue > 0 ? String(priceValue) : "0",
        categoryId: category || undefined,
        paymentCardId: paymentCardId || undefined,
        projectId: projectLedger.enabled && projectLedger.projectId ? projectLedger.projectId : undefined,
        description: description.trim() || undefined,
      });
      showToast(t("feat.templates.saved"), "success");
      await loadTemplates();
    } catch (err) {
      showErrorToast(err);
      throw err;
    }
  }

  /** After "save and next": same type, date and card, everything else empty. */
  useEffect(() => {
    if (!budget?._id || !assetsEnabled) return;
    let alive = true;
    void budgetsApi
      .fetchBudgetDetails(budget._id)
      .then((details) => {
        const linked = details.links.investment;
        if (!alive || !linked) return;
        setInvestmentLinked(true);
        setInvestment({
          enabled: true,
          assetId: linked.assetDeleted ? "" : linked.assetId,
          kind: linked.kind as InvestmentLedgerValue["kind"],
          title: linked.title,
          unit: linked.unit,
          quantity: String(linked.quantity),
        });
        setMoreOpen(true);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [budget?._id, assetsEnabled]);

  function resetForNext() {
    setPrice("");
    setCategory("");
    setDescription("");
    setAppliedTemplateId("");
    setDebtLedger(initialDebtLedger);
    setInstallmentLedger({ enabled: false, occurrenceId: "" });
    setProjectLedger({ enabled: false, projectId: "" });
    setVentureLedger({ enabled: false, ventureId: "" });
    setInvestment(initialInvestmentLedger);
    window.scrollTo({ top: 0, behavior: "smooth" });
    focusAmountField();
  }

  useEffect(() => {
    if (budget || !paymentCards.length || type !== String(BudgetType.COST)) return;

    setPaymentCardId((current) => {
      if (current) return current;
      return resolveDefaultPaymentCardId(paymentCards, user?._id);
    });
  }, [budget, paymentCards, type, user?._id]);

  // "موجودی ملت: ۲٬۰۰۰٬۰۰۰ ← بعد از این ۱٬۵۰۰٬۰۰۰" for accounts that keep their own balance.
  const accountHint = (() => {
    if (!paymentCardId || !(paymentCardId in accountBalances)) return "";
    const card = paymentCards.find((item) => item._id === paymentCardId);
    const current = accountBalances[paymentCardId];
    const amount = Number(toEnglishDigits(price));
    const name = card?.title ?? "";
    const fmt = (value: number) => formatPriceWithCurrency(value, formCurrency);
    if (budget || !(amount > 0)) return t("feat.accounts.hintBalance", { name, amount: fmt(current) });
    const after = type === String(BudgetType.COST) ? current - amount : current + amount;
    return t("feat.accounts.hintAfter", { name, amount: fmt(current), after: fmt(after) });
  })();

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
    // The limit applies to the month of this entry, in the calendar it is
    // stored in (a Jalali "now" never matched Gregorian-calendar entries).
    // The returned totals and the limit are in the user's own currency.
    const hintCurrency = userPrefs.currency;
    let cancelled = false;

    void budgetsApi
      .fetchBudgets({
        duration: "monthly",
        year: String(year),
        month: String(Number(month)),
        category,
      })
      .then((data) => {
        if (cancelled) return;
        const spent = data.totalCostPrice;
        const remaining = limit - spent;
        setCategorySpendHint(
          remaining >= 0
            ? t("budget.limitSpendHint", {
                limit: formatPriceWithCurrency(limit, hintCurrency),
                spent: formatPriceWithCurrency(spent, hintCurrency),
                remaining: formatPriceWithCurrency(remaining, hintCurrency),
              })
            : t("budget.limitSpendOverHint", {
                limit: formatPriceWithCurrency(limit, hintCurrency),
                spent: formatPriceWithCurrency(spent, hintCurrency),
                over: formatPriceWithCurrency(Math.abs(remaining), hintCurrency),
              }),
        );
      })
      .catch(() => {
        if (!cancelled) setCategorySpendHint(null);
      });
    return () => {
      cancelled = true;
    };
  }, [category, selectedCategory?.monthlyLimit, type, year, month, userPrefs.currency, t]);

  const projectBlockedForVenture =
    Boolean(existingProjectId) ||
    Boolean(projectLedger.enabled && projectLedger.projectId) ||
    isProjectCategory;

  const moreHint = buildMoreHint(
    [
      paymentCardId ? t("auto.k275357e0fe") : "",
      debtLedger.enabled ? t("auto.k4ffe94cc2d") : "",
      installmentLedger.enabled ? t("budget.relatedInstallment") : "",
      projectLedger.enabled || isProjectCategory ? t("auto.kcce7e8ff41") : "",
      ventureLedger.enabled || existingVentureId ? t("auto.k9f48ae23bb") : "",
      budget?.debt ? t("auto.k4ffe94cc2d") : "",
      investment.enabled && type === String(BudgetType.COST) ? "سرمایه‌گذاری" : "",
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

  function updateInstallmentLedger(patch: Partial<InstallmentLedgerValue>) {
    if (patch.enabled) {
      setType(String(BudgetType.COST));
    }
    setInstallmentLedger((current) => ({ ...current, ...patch }));
  }

  async function submit(e?: FormEvent, keepOpen = false) {
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

    const isCost = String(type) === String(BudgetType.COST);
    const body: Record<string, unknown> = { ...payload };
    if (assetsEnabled && investment.enabled && isCost) {
      if (!isInvestmentComplete(investment)) {
        setMoreOpen(true);
        showToast("مقدار سرمایه‌گذاری را وارد کنید");
        return;
      }
      body.investment = investmentPayload(investment);
    } else if (budget && investmentLinked && assetsEnabled) {
      body.removeInvestment = true;
    }

    if (!budget && installmentLedger.enabled && !installmentLedger.occurrenceId) {
      setMoreOpen(true);
      showToast(t("budget.selectInstallmentRequired"));
      return;
    }

    setLoading(true);
    setKeepOpenLoading(keepOpen);
    try {
      if (
        debtLedger.enabled &&
        canAttachDebt &&
        debtLedger.mode === "create" &&
        !debtLedger.forceCreateNew
      ) {
        const matches = await fetchOpenDebtsForPerson(
          debtsApi.fetchDebts,
          debtLedger.person,
          debtLedger.debtType,
          formCurrency,
        );
        if (matches.length > 0) {
          setMoreOpen(true);
          showToast(
            t("debts.chooseLinkOrCreate", {
              count: matches.length,
              person: debtLedger.person.trim(),
            }),
          );
          setLoading(false);
          return;
        }
      }

      let mutationResult: IBudgetMutationResult | undefined;
      let savedBudgetId = budget?._id ?? "";

      if (budget) {
        const res = await budgetsApi.updateBudget(budget._id, body);
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
        const res = await budgetsApi.createBudget(body);
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

        if (installmentLedger.enabled && installmentLedger.occurrenceId) {
          await paymentPlansApi.linkOccurrenceBudget(
            installmentLedger.occurrenceId,
            { budgetId: res.budget._id },
          );
          showToast(t("budget.installmentLinked"), "success");
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
      if (!budget && templatesEnabled && appliedTemplateId) {
        // Counts the use so favourite templates float to the front; never blocks saving.
        void templatesApi.markTemplateUsed(appliedTemplateId).then(loadTemplates).catch(() => undefined);
      }
      if (keepOpen && !budget) {
        resetForNext();
        return;
      }
      router.push(`${PATHS.HOME}?duration=monthly&year=${year}&month=${month}`);
    } catch (err) {
      showErrorToast(err);
    } finally {
      setLoading(false);
      setKeepOpenLoading(false);
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
              {budget ? t("budget.editTransaction") : t("budget.newTransaction")}
            </p>
            {!budget ? (
              <Link
                href={PATHS.BANK_IMPORT}
                data-tour="budget-bank-import"
                className="text-xs font-semibold text-accent underline-offset-2 hover:underline"
              >
                {t("budget.bankImportBulkLink")}
              </Link>
            ) : null}
          </div>

          {!budget && templatesEnabled ? (
            <TemplateChipsRow
              templates={templates}
              activeId={appliedTemplateId}
              onApply={applyTemplate}
            />
          ) : null}

          <div className="flex gap-2" data-tour="budget-type">
            {[
              { id: String(BudgetType.INCOME), label: t("budget.income") },
              { id: String(BudgetType.COST), label: t("budget.expense") },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setType(item.id);
                  if (item.id === String(BudgetType.INCOME)) {
                    setInstallmentLedger({ enabled: false, occurrenceId: "" });
                  }
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

          <div className="space-y-2" data-tour="budget-currency">
            <p className="text-sm font-medium">{t("common.currencyType")}</p>
            <div className="grid grid-cols-3 gap-2">
              {CURRENCY_OPTIONS.map((option) => {
                const selected = formCurrency === option.id;
                const locked = Boolean(budget);
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={locked}
                    aria-pressed={selected}
                    onClick={() => {
                      if (!locked) setFormCurrency(option.id);
                    }}
                    className={`px-3 py-2.5 text-sm ${
                      selected
                        ? "rounded-xl border border-accent bg-accent/15 font-semibold text-accent shadow-sm ring-1 ring-accent/35"
                        : "rounded-xl border border-border/50 bg-surface-secondary/60 text-muted hover:border-accent/40"
                    } ${locked ? "cursor-default opacity-80" : "cursor-pointer"}`}
                  >
                    {displayCurrencyLabel(option.id)}
                  </button>
                );
              })}
            </div>
          </div>

          <div data-tour="budget-amount">
          <FormPriceInput
            label={t("budget.amountWithCurrency", {
              currency: displayCurrencyLabel(formCurrency),
            })}
            value={price}
            onChange={setPrice}
            currency={formCurrency}
          />
          </div>

          <FormDatePicker
            label={
              formCalendar === "gregorian"
                ? t("budget.dateGregorian")
                : t("budget.dateJalali")
            }
            year={year}
            month={month}
            day={day}
            onChange={handleDateChange}
            calendarType={formCalendar}
          />

          <div data-tour="budget-category">
          <FormCategoryComboBox
            label={t("auto.kb561a47a9b")}
            placeholder={t("common.searchCategoryPlaceholder")}
            selectedKey={category || undefined}
            onSelectionChange={(key) => setCategory(key)}
            options={categoryOptions}
            emptyMessage={t("common.noCategoryRegistered")}
          />
          </div>

          {categorySpendHint ? (
            <p
              className={`rounded-xl px-3 py-2 text-xs leading-6 ${
                categorySpendHint.includes(t("auto.k5305d78f31"))
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

          {!budget && templatesEnabled ? (
            <button
              type="button"
              onClick={() => setSaveTemplateOpen(true)}
              className="block text-xs font-semibold text-accent hover:underline"
            >
              {t("feat.templates.saveAction")}
            </button>
          ) : null}

          <>
            <div data-tour="budget-more">
            <BudgetMoreToggle
              open={moreOpen}
              onToggle={() => setMoreOpen((current) => !current)}
              hint={moreOpen ? null : moreHint}
            />
            </div>

            {moreOpen ? (
              <div className="space-y-4">
                  <FormSelect
                    label={
                      type === String(BudgetType.COST)
                        ? t("budget.paymentCardSource")
                        : t("budget.paymentCardDestination")
                    }
                    placeholder={t("auto.k33fcba0b6e")}
                    selectedKey={paymentCardId || "none"}
                    onSelectionChange={(key) =>
                      setPaymentCardId(key === "none" ? "" : key)
                    }
                    options={[{ id: "none", label: t("budget.noCard") }, ...paymentCardOptions]}
                    emptyMessage={t("budget.noCardRegistered")}
                  />
                  {accountHint ? (
                    <p className="-mt-2 rounded-xl bg-surface-secondary px-3 py-2 text-xs leading-6 text-muted" data-testid="account-balance-hint">
                      {accountHint}
                    </p>
                  ) : null}
                  {paymentCards.length === 0 ? (
                    <p className="text-xs text-muted">
                      {t("budget.noCardsYetPrefix")}{" "}
                      <Link href={PATHS.PAYMENT_CARDS} className="text-accent underline">
                        {t("budget.myCardsLink")}
                      </Link>{" "}
                      {t("budget.noCardsYetSuffix")}
                    </p>
                  ) : null}

                  {!budget?.debt ? (
                    <DebtLedgerSection
                      amount={price}
                      value={debtLedger}
                      onChange={updateDebtLedger}
                      formCurrency={formCurrency}
                    />
                  ) : (
                    <LinkedDebtSummary debt={budget.debt} />
                  )}

                  {assetsEnabled && type === String(BudgetType.COST) ? (
                    <InvestmentLedgerSection
                      value={investment}
                      onChange={(patch) => setInvestment((current) => ({ ...current, ...patch }))}
                      linked={investmentLinked}
                    />
                  ) : null}

                  {!budget ? (
                    <InstallmentLedgerSection
                      value={installmentLedger}
                      onChange={updateInstallmentLedger}
                    />
                  ) : null}

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
          </>

          <div className="border-t border-border/50 pt-4" data-tour="budget-new-category">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onPress={() => setCategoryModalOpen(true)}
            >
              <Add size={18} />
              {t("budget.createCategory")}
            </Button>
          </div>

          <div className="flex flex-col gap-2 border-t border-border/50 pt-4" data-tour="budget-submit">
            <Button type="submit" className="w-full" size="lg" isPending={loading && !keepOpenLoading}>
              {budget ? t("common.saveChanges") : t("nav.createTransaction")}
            </Button>
            {!budget ? (
              <Button
                type="button"
                className="w-full"
                variant="secondary"
                isPending={loading && keepOpenLoading}
                isDisabled={loading && !keepOpenLoading}
                onPress={() => void submit(undefined, true)}
              >
                {t("feat.templates.saveAndNext")}
              </Button>
            ) : null}
            <Button
              type="button"
              className="w-full"
              variant="ghost"
              onPress={() => router.back()}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      </form>

      {templatesEnabled ? (
      <SaveTemplateModal
        open={saveTemplateOpen}
        onOpenChange={setSaveTemplateOpen}
        defaultTitle={selectedCategory?.title ?? description.trim().slice(0, 40)}
        onSave={saveAsTemplate}
      />
      ) : null}

      <CreateCategoryModal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
        onCreated={(created) => setCategory(created._id)}
      />
    </div>
  );
}
