"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Modal } from "@heroui/react";

import * as paymentCardsApi from "@/common/api/payment-cards";
import type { AnalyticsTypeFilter } from "@/common/interfaces/analytics.interface";
import type { ICategory } from "@/common/interfaces/category.interface";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { FormCategoryComboBox, FormSelect } from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useTranslation } from "@/components/providers/LanguageProvider";

export type AnalysisFilterValue = { category: string; paymentCard: string; type: AnalyticsTypeFilter; compare: boolean };

export function AnalysisFilterModal({
  open,
  onOpenChange,
  categories,
  value,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ICategory[];
  value: AnalysisFilterValue;
  onApply: (value: AnalysisFilterValue) => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value);
  const [cards, setCards] = useState<IPaymentCard[]>([]);
  const options = useMemo(() => getCategorySelectOptions(categories), [categories]);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    void paymentCardsApi.fetchPaymentCards().then(setCards).catch(() => setCards([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when opening
  }, [open]);

  const types: { id: AnalyticsTypeFilter; label: string }[] = [
    { id: "all", label: t("dashboard.typeAll") },
    { id: "income", label: t("dashboard.typeIncome") },
    { id: "cost", label: t("dashboard.typeExpense") },
  ];

  return (
    <AppModal open={open} onOpenChange={onOpenChange} mobileFull>
      <AppModalDialog className="overflow-visible">
        <AppModalHeader>
          <Modal.Heading>{t("dashboard.transactionFilters")}</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className="space-y-5 overflow-visible px-5 py-5">
          <section className="space-y-2">
            <h4 className="pb-filter-title">{t("dashboard.filterType")}</h4>
            <div className="grid grid-cols-3 gap-2">
              {types.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className="pb-opt"
                  data-selected={draft.type === type.id}
                  data-tone={type.id === "income" ? "income" : type.id === "cost" ? "expense" : undefined}
                  onClick={() => setDraft((d) => ({ ...d, type: type.id }))}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </section>
          <FormCategoryComboBox
            label={t("dashboard.filterByCategory")}
            placeholder={t("dashboard.allCategories")}
            selectedKey={draft.category || "all"}
            onSelectionChange={(key) => setDraft((d) => ({ ...d, category: key === "all" ? "" : key }))}
            allowCreate={false}
            options={[{ id: "all", label: t("dashboard.allCategories") }, ...options]}
            emptyMessage={t("dashboard.noCategoryCreatedYet")}
          />
          <FormSelect
            label={t("dashboard.filterCard")}
            placeholder={t("dashboard.anyCard")}
            selectedKey={draft.paymentCard || "any"}
            onSelectionChange={(key) => setDraft((d) => ({ ...d, paymentCard: key === "any" ? "" : key }))}
            options={[
              { id: "any", label: t("dashboard.anyCard") },
              ...cards.map((card) => ({ id: card._id, label: `${card.title}${card.lastFour ? ` · ${card.lastFour}` : ""}` })),
            ]}
          />
          <button type="button" className="pb-opt pb-opt-pill" data-selected={draft.compare} onClick={() => setDraft((d) => ({ ...d, compare: !d.compare }))}>
            {t("pages.analysis.compareToPrevious")}
          </button>
        </Modal.Body>
        <Modal.Footer className="flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" onPress={() => setDraft({ category: "", paymentCard: "", type: "all", compare: draft.compare })}>
            {t("dashboard.clearFilters")}
          </Button>
          <Button
            type="button"
            onPress={() => {
              onApply(draft);
              onOpenChange(false);
            }}
          >
            {t("dashboard.applyFilters")}
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>
  );
}
