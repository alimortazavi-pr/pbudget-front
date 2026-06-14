"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@heroui/react";
import { Add } from "iconsax-reactjs";

import * as budgetsApi from "@/common/api/budgets";
import * as debtsApi from "@/common/api/debts";
import type { IBudget } from "@/common/interfaces/budget.interface";
import { getJalaliNow, toEnglishDigits } from "@/common/utils";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { showToast } from "@/common/utils/toast";
import { FormInput, FormSelect, FormTextArea } from "@/components/common/form/FormFields";
import {
  DebtLedgerSection,
  type DebtLedgerMode,
  type DebtLedgerValue,
} from "@/components/pages/budget/DebtLedgerSection";
import { CreateCategoryModal } from "@/components/pages/categories/CreateCategoryModal";
import { useAppSelector } from "@/stores/hooks";
import { categoriesSelector } from "@/stores/category";
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

export function BudgetFormPage({ budget }: BudgetFormPageProps) {
  const router = useRouter();
  const categories = useAppSelector(categoriesSelector);
  const categoryOptions = getCategorySelectOptions(categories ?? []);
  const now = getJalaliNow();

  const [price, setPrice] = useState(String(budget?.price ?? ""));
  const [type, setType] = useState(String(budget?.type ?? BudgetType.COST));
  const [category, setCategory] = useState(budget?.category?._id ?? "");
  const selectedCategory = useMemo(
    () => (categories ?? []).find((item) => item._id === category),
    [categories, category],
  );
  const isProjectCategory = selectedCategory?.kind === CategoryKind.PROJECT;
  const [description, setDescription] = useState(budget?.description ?? "");
  const [loading, setLoading] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [debtLedger, setDebtLedger] = useState<DebtLedgerValue>(initialDebtLedger);

  const year = budget?.year ?? String(now.jYear());
  const month = budget?.month ?? String(now.jMonth() + 1);
  const day = budget?.day ?? String(now.jDate());

  function updateDebtLedger(patch: Partial<DebtLedgerValue>) {
    if (patch.mode === "settle-receivable") {
      setType(String(BudgetType.INCOME));
    } else if (patch.mode === "settle-payable" || patch.mode === "create") {
      setType(String(BudgetType.COST));
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
    const payload = {
      price: toEnglishDigits(price),
      type,
      category,
      year,
      month,
      day,
      description,
    };

    if (!payload.price || !payload.category) {
      showToast("مبلغ و دسته‌بندی الزامی است");
      return;
    }

    if (!budget && debtLedger.enabled) {
      if (debtLedger.mode === "create" && !debtLedger.person.trim()) {
        showToast("نام طرف حساب الزامی است");
        return;
      }
      if (isSettleDebtMode(debtLedger.mode) && !debtLedger.settleDebtId) {
        showToast("طلب یا بدهی مورد نظر را انتخاب کنید");
        return;
      }
    }

    setLoading(true);
    try {
      if (budget) {
        await budgetsApi.updateBudget(budget._id, payload);
        showToast("تراکنش ویرایش شد", "success");
      } else {
        const res = await budgetsApi.createBudget(payload);

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
      router.push(`/?duration=monthly&year=${year}&month=${month}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
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

          <FormInput
            label="مبلغ (تومان)"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <FormSelect
            label="دسته‌بندی"
            placeholder="یک دسته انتخاب کنید"
            selectedKey={category || undefined}
            onSelectionChange={(key) => setCategory(key)}
            options={categoryOptions}
            emptyMessage="دسته‌ای ثبت نشده"
          />

          {isProjectCategory && (
            <p className="rounded-xl bg-accent/10 px-3 py-2 text-xs leading-6 text-accent">
              این تراکنش به پروژه مرتبط با دسته «{selectedCategory?.title}» وصل می‌شود و
              در صفحه پروژه‌ها هم نمایش داده می‌شود.
            </p>
          )}

          <FormTextArea
            label="توضیحات"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {!budget && (
            <DebtLedgerSection
              amount={price}
              value={debtLedger}
              onChange={updateDebtLedger}
            />
          )}

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
