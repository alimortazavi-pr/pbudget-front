"use client";

import { useCallback, useEffect, useImperativeHandle, useState, type Ref } from "react";
import { Button } from "@heroui/react";
import { TickCircle } from "iconsax-reactjs";

import * as bankImportApi from "@/common/api/bank-import";
import * as profileApi from "@/common/api/profile";
import { DEFAULT_USER_PREFERENCES } from "@/common/constants/user-preferences";
import type { IBankImportPendingBudget } from "@/common/interfaces/bank.interface";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormSelect } from "@/components/common/form/FormFields";
import { useTranslation } from "@/i18n";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { bumpBudgetRevision } from "@/stores/budget";
import { categoriesSelector } from "@/stores/category";
import { setProfile, userSelector } from "@/stores/profile";

export type PendingCategorizeHandle = { reload: () => void };

/** Imported rows (from SMS or a bank statement) that still have no category. */
export function SmsPendingCategorize({ handleRef }: { handleRef?: Ref<PendingCategorizeHandle> }) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const categories = useAppSelector(categoriesSelector);
  const currency = user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;
  const options = getCategorySelectOptions(categories ?? []);
  const [rows, setRows] = useState<IBankImportPendingBudget[]>([]);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await bankImportApi.fetchPendingBankImports();
      setRows(data.budgets);
      setChosen({});
    } catch {
      setRows([]);
    }
  }, []);

  useImperativeHandle(handleRef, () => ({ reload: () => void load() }), [load]);
  useEffect(() => {
    void load();
  }, [load]);

  const picked = Object.entries(chosen).filter(([, categoryId]) => Boolean(categoryId));

  async function save() {
    if (!picked.length) return;
    setSaving(true);
    try {
      await bankImportApi.categorizeBankImports(picked.map(([budgetId, categoryId]) => ({ budgetId, categoryId })));
      showToast(t("feat.sms.categorized", { count: toPersianDigits(picked.length) }), "success");
      dispatch(bumpBudgetRevision());
      void profileApi.fetchProfile().then((profile) => dispatch(setProfile(profile))).catch(() => undefined);
      await load();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  if (!rows.length) return null;

  return (
    <section className="glass space-y-3 rounded-2xl p-4 sm:p-5" data-testid="pending-categorize">
      <div>
        <h2 className="text-base font-bold">{t("feat.sms.pendingTitle", { count: toPersianDigits(rows.length) })}</h2>
        <p className="mt-1 text-xs leading-6 text-muted">{t("feat.sms.pendingHint")}</p>
      </div>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row._id} className="space-y-2 rounded-xl border border-border/50 bg-surface-secondary/40 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{row.description || t("feat.sms.noDescription")}</p>
                <p className="text-xs text-muted">
                  {toPersianDigits(`${row.year}/${String(row.month).padStart(2, "0")}/${String(row.day).padStart(2, "0")}`)}
                </p>
              </div>
              <p className={`shrink-0 text-sm font-bold ${row.type === 0 ? "text-success" : "text-danger"}`}>
                {row.type === 0 ? "+" : "−"}
                {formatPriceWithCurrency(row.price, currency)}
              </p>
            </div>
            <FormSelect
              label={t("auto.kb561a47a9b")}
              placeholder={t("feat.sms.pickCategory")}
              selectedKey={chosen[row._id]}
              onSelectionChange={(key) => setChosen((prev) => ({ ...prev, [row._id]: key }))}
              options={options}
              emptyMessage={t("common.noCategoryRegistered")}
            />
          </li>
        ))}
      </ul>
      <Button className="w-full" isDisabled={!picked.length} isPending={saving} onPress={() => void save()}>
        <TickCircle size={18} />
        {t("feat.sms.saveCategories", { count: toPersianDigits(picked.length) })}
      </Button>
    </section>
  );
}
