"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as paymentCardsApi from "@/common/api/payment-cards";
import * as projectsApi from "@/common/api/projects";
import * as templatesApi from "@/common/api/transaction-templates";
import { DEFAULT_USER_PREFERENCES } from "@/common/constants/user-preferences";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import type { IProject } from "@/common/interfaces/project.interface";
import type { ITransactionTemplate } from "@/common/interfaces/transaction-template.interface";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { formatCardNumberForDisplay } from "@/common/utils/payment-card";
import { showErrorToast, showToast } from "@/common/utils/toast";
import {
  FormCategoryComboBox,
  FormInput,
  FormPriceInput,
  FormSelect,
  FormTextArea,
} from "@/components/common/form/FormFields";
import {
  AppModal,
  AppModalDialog,
  AppModalHeader,
  modalSheetBodyClass,
  modalSheetFooterClass,
} from "@/components/common/ui/AppModal";
import { useTranslation } from "@/i18n";
import { categoriesSelector } from "@/stores/category";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

export type TemplatePreset = { title?: string; type?: "0" | "1" };

type Props = {
  open: boolean;
  /** null = create a new template. */
  template: ITransactionTemplate | null;
  /** Prefill for a new template (starter ideas, "save as template" from a transaction). */
  preset?: TemplatePreset & Partial<Pick<ITransactionTemplate, "price" | "category" | "paymentCard" | "project" | "description">>;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

/** Every field of a template, with the same pickers as the transaction form. */
export function TemplateFormModal({ open, template, preset, onOpenChange, onSaved }: Props) {
  const { t } = useTranslation();
  const user = useAppSelector(userSelector);
  const categories = useAppSelector(categoriesSelector);
  const currency = user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;

  const [type, setType] = useState<"0" | "1">("1");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cardId, setCardId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState<IPaymentCard[]>([]);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const source = template ?? preset;
    setType(source?.type !== undefined ? (String(source.type) as "0" | "1") : "1");
    setTitle(source?.title ?? "");
    setPrice(template ? (template.price > 0 ? String(template.price) : "") : preset?.price && preset.price > 0 ? String(preset.price) : "");
    setCategoryId((template ?? preset)?.category ?? "");
    setCardId((template ?? preset)?.paymentCard ?? "");
    setProjectId((template ?? preset)?.project ?? "");
    setDescription((template ?? preset)?.description ?? "");
    void paymentCardsApi.fetchPaymentCards().then(setCards).catch(() => setCards([]));
    void projectsApi.fetchProjects().then(setProjects).catch(() => setProjects([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fill when the dialog opens
  }, [open, template?._id]);

  const cardOptions = useMemo(
    () => [
      { id: "none", label: t("budget.noCard") },
      ...cards.map((card) => ({
        id: card._id,
        label: [card.title, formatCardNumberForDisplay(card.lastFour, true)].filter(Boolean).join(" · "),
      })),
    ],
    [cards, t],
  );
  const projectOptions = useMemo(
    () => [
      { id: "none", label: t("feat.templates.noProject") },
      ...projects.map((project) => ({ id: project._id, label: project.category?.title ?? t("common.project") })),
    ],
    [projects, t],
  );

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const priceValue = Number(price);
      const payload = {
        title: title.trim(),
        type,
        price: priceValue > 0 ? String(priceValue) : "0",
        // An empty string clears the field on the server.
        categoryId: categoryId || (template ? "" : undefined),
        paymentCardId: cardId || (template ? "" : undefined),
        projectId: projectId || (template ? "" : undefined),
        description: description.trim(),
      };
      if (template) await templatesApi.updateTemplate(template._id, payload);
      else await templatesApi.createTemplate(payload);
      showToast(t("feat.templates.saved"), "success");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange} mobileFull>
      <AppModalDialog className="flex max-h-[100dvh] flex-col sm:max-w-md">
        <form onSubmit={(e) => void submit(e)} className="flex min-h-0 flex-1 flex-col">
          <AppModalHeader>
            <Modal.Heading>{template ? t("feat.templates.editTitle") : t("feat.templates.newTitle")}</Modal.Heading>
            <p className="mt-0.5 text-xs text-muted">{t("feat.templates.formHint")}</p>
          </AppModalHeader>

          <Modal.Body className={`${modalSheetBodyClass} space-y-4`}>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("feat.templates.typeLabel")}>
              {(
                [
                  { id: "1" as const, label: t("budget.expense") },
                  { id: "0" as const, label: t("budget.income") },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={type === item.id}
                  onClick={() => setType(item.id)}
                  className={`cursor-pointer rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                    type === item.id
                      ? item.id === "0"
                        ? "border-[var(--brand-teal)] bg-income-soft text-income"
                        : "border-[var(--brand-rose)] bg-expense-soft text-expense"
                      : "border-border bg-surface-secondary text-muted"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <FormInput
              label={t("feat.templates.titleLabel")}
              value={title}
              maxLength={60}
              placeholder={t("feat.templates.titlePlaceholder")}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="space-y-1.5">
              <FormPriceInput
                label={t("feat.templates.amountLabel")}
                value={price}
                onChange={setPrice}
                currency={currency}
              />
              <p className="text-xs leading-6 text-muted">{t("feat.templates.amountHint")}</p>
            </div>

            <FormCategoryComboBox
              label={t("feat.templates.categoryLabel")}
              placeholder={t("common.searchCategoryPlaceholder")}
              selectedKey={categoryId || undefined}
              onSelectionChange={setCategoryId}
              options={getCategorySelectOptions(categories ?? [])}
              emptyMessage={t("common.noCategoryRegistered")}
            />

            {cards.length > 0 ? (
              <FormSelect
                label={t("feat.templates.accountLabel")}
                selectedKey={cardId || "none"}
                onSelectionChange={(key) => setCardId(key === "none" ? "" : key)}
                options={cardOptions}
              />
            ) : null}
            {projects.length > 0 ? (
              <FormSelect
                label={t("feat.templates.projectLabel")}
                selectedKey={projectId || "none"}
                onSelectionChange={(key) => setProjectId(key === "none" ? "" : key)}
                options={projectOptions}
              />
            ) : null}

            <FormTextArea
              label={t("common.description")}
              value={description}
              maxLength={500}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Modal.Body>

          <Modal.Footer className={modalSheetFooterClass}>
            <Button type="button" variant="ghost" onPress={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" isPending={saving} isDisabled={!title.trim()}>
              {t("common.save")}
            </Button>
          </Modal.Footer>
        </form>
      </AppModalDialog>
    </AppModal>
  );
}
