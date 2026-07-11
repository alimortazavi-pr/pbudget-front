"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

import { useTranslation } from "@/components/providers/LanguageProvider";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, Modal } from "@heroui/react";
import { Add } from "iconsax-reactjs";

import * as budgetsApi from "@/common/api/budgets";
import * as paymentCardsApi from "@/common/api/payment-cards";
import { PATHS } from "@/common/constants";
import { formatCardNumberForDisplay } from "@/common/utils/payment-card";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { getJalaliNow, toEnglishDigits, formatPrice, formatJalaliDateWithTime } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import {
  FormCategoryComboBox,
  FormDatePicker,
  FormPriceInput,
  FormSelect,
  FormTextArea,
} from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { BudgetMoreToggle } from "@/components/pages/budget/BudgetMoreToggle";
import {
  DebtLedgerSection,
  type DebtLedgerMode,
  type DebtLedgerValue,
} from "@/components/pages/budget/DebtLedgerSection";
import {
  ProjectLedgerSection,
  type ProjectLedgerValue,
} from "@/components/pages/budget/ProjectLedgerSection";
import {
  VentureLedgerSection,
  type VentureLedgerValue,
} from "@/components/pages/budget/VentureLedgerSection";
import { CreateCategoryModal } from "@/components/pages/categories/CreateCategoryModal";
import { useAppSelector } from "@/stores/hooks";
import { categoriesSelector } from "@/stores/category";
import { userSelector } from "@/stores/profile";
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";
import { BudgetType, CategoryKind, DebtType } from "@/types/enums";
import type { ImportRowDraft } from "./import-row.types";
import { validateImportRowDraft } from "./import-row.util";

type BankImportRowEditorModalProps = {
  open: boolean;
  draft: ImportRowDraft | null;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: ImportRowDraft) => void;
};

function buildMoreHint(parts: string[]) {
  return parts.length ? parts.join(" · ") : null;
}

function isSettleDebtMode(mode: DebtLedgerMode) {
  return mode === "settle-receivable" || mode === "settle-payable";
}

export function BankImportRowEditorModal({
  open,
  draft,
  onOpenChange,
  onSave,
}: BankImportRowEditorModalProps) {
  const { t } = useTranslation();
  const { currencyLabel } = useCurrencyLabels();
  const categories = useAppSelector(categoriesSelector);
  const user = useAppSelector(userSelector);
  const preferredCurrency = user?.preferences?.currency ?? "toman";
  const categoryOptions = getCategorySelectOptions(categories ?? []);

  const [form, setForm] = useState<ImportRowDraft | null>(null);
  const [paymentCards, setPaymentCards] = useState<
    Awaited<ReturnType<typeof paymentCardsApi.fetchPaymentCards>>
  >([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categorySpendHint, setCategorySpendHint] = useState<string | null>(null);

  useEffect(() => {
    if (open && draft) {
      setForm({ ...draft });
      setMoreOpen(
        Boolean(
          draft.paymentCardId ||
            draft.debtLedger.enabled ||
            draft.projectLedger.enabled ||
            draft.ventureLedger.enabled,
        ),
      );
    }
  }, [open, draft]);

  useEffect(() => {
    void paymentCardsApi.fetchPaymentCards().then(setPaymentCards).catch(() => {
      setPaymentCards([]);
    });
  }, []);

  const selectedCategory = useMemo(
    () => (categories ?? []).find((item) => item._id === form?.categoryId),
    [categories, form?.categoryId],
  );
  const isProjectCategory = selectedCategory?.kind === CategoryKind.PROJECT;

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
    if (
      !form ||
      form.type !== String(BudgetType.COST) ||
      !form.categoryId ||
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
        category: form.categoryId,
      })
      .then((data) => {
        const spent = data.totalCostPrice;
        const remaining = limit - spent;
        setCategorySpendHint(
          remaining >= 0
            ? t("budget.limitSpendHint", {
                limit: formatPrice(limit),
                spent: formatPrice(spent),
                remaining: formatPrice(remaining),
              })
            : t("budget.limitSpendOverHint", {
                limit: formatPrice(limit),
                spent: formatPrice(spent),
                over: formatPrice(Math.abs(remaining)),
              }),
        );
      })
      .catch(() => setCategorySpendHint(null));
  }, [form?.categoryId, form?.type, selectedCategory?.monthlyLimit, t]);

  if (!form) return null;

  const projectBlockedForVenture =
    Boolean(form.projectLedger.enabled && form.projectLedger.projectId) ||
    isProjectCategory;

  const moreHint = buildMoreHint(
    [
      form.paymentCardId ? t("auto.k16902e87e2") : "",
      form.debtLedger.enabled ? t("auto.k4ffe94cc2d") : "",
      form.projectLedger.enabled || isProjectCategory ? t("auto.kcce7e8ff41") : "",
      form.ventureLedger.enabled ? t("auto.k9f48ae23bb") : "",
    ].filter(Boolean),
  );

  function patchForm(patch: Partial<ImportRowDraft>) {
    setForm((current) => (current ? { ...current, ...patch } : current));
  }

  function updateDebtLedger(patch: Partial<DebtLedgerValue>) {
    setForm((current) => {
      if (!current) return current;
      let nextType: string = current.type;

      if (patch.mode === "settle-receivable") {
        nextType = String(BudgetType.INCOME);
      } else if (patch.mode === "settle-payable") {
        nextType = String(BudgetType.COST);
      } else if (patch.mode === "create" || patch.debtType !== undefined) {
        const nextDebtType = patch.debtType ?? current.debtLedger.debtType;
        nextType =
          nextDebtType === String(DebtType.RECEIVABLE)
            ? String(BudgetType.COST)
            : String(BudgetType.INCOME);
      }

      const nextDebt = { ...current.debtLedger, ...patch };
      if (patch.mode && patch.mode !== current.debtLedger.mode) {
        nextDebt.settleDebtId = "";
      }

      return { ...current, type: nextType, debtLedger: nextDebt };
    });
  }

  function updateProjectLedger(patch: Partial<ProjectLedgerValue>) {
    setForm((current) => {
      if (!current) return current;
      const next = {
        ...current.projectLedger,
        ...patch,
      };
      if (patch.enabled === false) next.projectId = "";
      const nextForm = { ...current, projectLedger: next };
      if (patch.enabled) {
        nextForm.ventureLedger = { enabled: false, ventureId: "" };
      }
      return nextForm;
    });
  }

  function updateVentureLedger(patch: Partial<VentureLedgerValue>) {
    setForm((current) => {
      if (!current) return current;
      const nextForm = {
        ...current,
        ventureLedger: { ...current.ventureLedger, ...patch },
      };
      if (patch.enabled) {
        nextForm.projectLedger = { enabled: false, projectId: "" };
      }
      return nextForm;
    });
  }

  function handleSave() {
    if (!form) return;
    const error = validateImportRowDraft(form);
    if (error) {
      showToast(error, "danger");
      if (error.includes(t("auto.kac5759fe2a")) || error.includes(t("auto.kf48e3aa79d")) || error.includes(t("auto.k7d84c3b4f7"))) {
        setMoreOpen(true);
      }
      return;
    }

    onSave({
      ...form,
      price: toEnglishDigits(form.price),
    });
    onOpenChange(false);
  }

  return (
    <>
      <AppModal open={open} onOpenChange={onOpenChange} size="lg" mobileFull>
        <AppModalDialog className="flex max-h-[92dvh] flex-col sm:max-w-lg">
          <AppModalHeader>
            <Modal.Heading>{t("auto.kb29198488a")}</Modal.Heading>
            <p className="mt-1 text-xs text-muted">{form.transactionKind}</p>
            <p className="mt-0.5 text-xs text-muted">
              {formatJalaliDateWithTime(
                form.year,
                form.month,
                form.day,
                form.hour,
                form.minute,
              )}
            </p>
          </AppModalHeader>

          <Modal.Body className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="flex gap-2">
              {[
                { id: String(BudgetType.INCOME), label: t("auto.kf5267c04e8") },
                { id: String(BudgetType.COST), label: t("auto.kf6956d4a4c") },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    patchForm({ type: item.id });
                    updateDebtLedger(
                      form.debtLedger.enabled
                        ? item.id === String(BudgetType.INCOME)
                          ? { mode: "settle-receivable", settleDebtId: "" }
                          : { mode: "settle-payable", settleDebtId: "" }
                        : {},
                    );
                  }}
                  className={`flex-1 rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                    form.type === item.id
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

            <FormPriceInput label={t("budget.amountWithCurrency", { currency: currencyLabel(preferredCurrency) })} value={form.price} onChange={(v) => patchForm({ price: v })} />

            <FormDatePicker
              label={t("auto.k349c7bedff")}
              year={form.year}
              month={form.month}
              day={form.day}
              onChange={(value) =>
                patchForm({ year: value.year, month: value.month, day: value.day })
              }
              inModal
            />

            <FormCategoryComboBox
              label={t("auto.k9f1d861765")}
              placeholder={t("auto.k34ca0cc3ac")}
              selectedKey={form.categoryId || undefined}
              onSelectionChange={(key) => patchForm({ categoryId: key === "all" ? "" : key })}
              options={categoryOptions}
            />

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
              value={form.description}
              onChange={(e) => patchForm({ description: e.target.value })}
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
                    form.type === String(BudgetType.COST)
                      ? t("auto.keee01ed4e1")
                      : t("auto.k45e983f053")
                  }
                  placeholder={t("auto.k33fcba0b6e")}
                  selectedKey={form.paymentCardId || "none"}
                  onSelectionChange={(key) =>
                    patchForm({ paymentCardId: key === "none" ? "" : key })
                  }
                  options={[{ id: "none", label: t("auto.k33fcba0b6e") }, ...paymentCardOptions]}
                />
                {paymentCards.length === 0 ? (
                  <p className="text-xs text-muted">
                    {t("auto.k9aeccd708e")}{" "}
                    <Link href={PATHS.PAYMENT_CARDS} className="text-accent underline">
                      {t("nav.myCards")}
                    </Link>{" "}
                    {t("auto.k3054a91d90")}
                  </p>
                ) : null}

                <DebtLedgerSection
                  amount={form.price}
                  value={form.debtLedger}
                  onChange={updateDebtLedger}
                />

                <VentureLedgerSection
                  value={form.ventureLedger}
                  onChange={updateVentureLedger}
                  projectBlocked={projectBlockedForVenture}
                />

                <ProjectLedgerSection
                  value={form.projectLedger}
                  onChange={updateProjectLedger}
                  isProjectCategory={isProjectCategory}
                  categoryTitle={selectedCategory?.title}
                />
              </div>
            ) : null}

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onPress={() => setCategoryModalOpen(true)}
            >
              <Add size={18} />
              {t("budget.createCategory")}
            </Button>
          </Modal.Body>

          <Modal.Footer className="border-t border-border/40 px-5 py-4">
            <Button variant="ghost" onPress={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button onPress={handleSave}>{t("auto.k5c388be097")}</Button>
          </Modal.Footer>
        </AppModalDialog>
      </AppModal>

      <CreateCategoryModal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
        onCreated={(created) => patchForm({ categoryId: created._id })}
      />
    </>
  );
}
