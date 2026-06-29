"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@heroui/react";

import * as businessApi from "@/common/api/business";
import { PATHS } from "@/common/constants";
import type { ICategory } from "@/common/interfaces/category.interface";
import { toEnglishDigits } from "@/common/utils";
import { showErrorToast, showToast } from "@/common/utils/toast";
import {
  FormCategoryComboBox,
  FormDatePicker,
  FormPriceInput,
  FormTextArea,
} from "@/components/common/form/FormFields";
import {
  hasBusinessPermission,
  workspaceContextSelector,
} from "@/stores/businessContext";
import { useAppSelector } from "@/stores/hooks";
import { BudgetType } from "@/types/enums";

type BusinessBudgetEditPageProps = {
  businessId: string;
  budgetId: string;
};

export function BusinessBudgetEditPage({
  businessId,
  budgetId,
}: BusinessBudgetEditPageProps) {
  const router = useRouter();
  const workspace = useAppSelector(workspaceContextSelector);
  const permissions = workspace?.permissions ?? [];

  const [price, setPrice] = useState("");
  const [type, setType] = useState(String(BudgetType.COST));
  const [category, setCategory] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: c._id, label: c.title })),
    [categories],
  );

  const load = useCallback(async () => {
    setInitializing(true);
    try {
      const [list, budgets] = await Promise.all([
        businessApi.fetchBusinessCategories(businessId),
        businessApi.fetchBusinessBudgets(businessId),
      ]);
      setCategories(list);
      const budget = budgets.find((b) => b._id === budgetId);
      if (!budget) {
        showToast("تراکنش پیدا نشد");
        router.push(PATHS.BUSINESS_TRANSACTIONS(businessId));
        return;
      }
      setPrice(String(budget.price));
      setType(String(budget.type));
      setCategory(
        typeof budget.category === "object" && budget.category?._id
          ? budget.category._id
          : String(budget.category ?? ""),
      );
      setYear(String(budget.year));
      setMonth(String(budget.month));
      setDay(String(budget.day));
      setDescription(budget.description ?? "");
    } catch (err) {
      showErrorToast(err);
    } finally {
      setInitializing(false);
    }
  }, [budgetId, businessId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      await businessApi.updateBusinessBudget(
        budgetId,
        {
          price: Number(toEnglishDigits(price)),
          type: Number(type),
          categoryId: category,
          year: Number(year),
          month: Number(month),
          day: Number(day),
          description,
        },
        businessId,
      );
      showToast("تراکنش ویرایش شد", "success");
      router.push(PATHS.BUSINESS_TRANSACTIONS(businessId));
    } catch (err) {
      showErrorToast(err);
    } finally {
      setLoading(false);
    }
  }

  if (!hasBusinessPermission(permissions, "transactions.edit")) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-muted">
        دسترسی ویرایش تراکنش ندارید
      </div>
    );
  }

  if (initializing) {
    return <div className="text-center text-muted">در حال بارگذاری…</div>;
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="glass space-y-4 rounded-2xl p-4">
      <p className="text-sm text-muted">ویرایش تراکنش</p>
      <FormPriceInput label="مبلغ" value={price} onChange={setPrice} />
      <FormDatePicker
        label="تاریخ"
        year={year}
        month={month}
        day={day}
        onChange={(v) => {
          setYear(v.year);
          setMonth(v.month);
          setDay(v.day);
        }}
      />
      <FormCategoryComboBox
        label="دسته"
        selectedKey={category || undefined}
        onSelectionChange={(key) => setCategory(key)}
        options={categoryOptions}
      />
      <FormTextArea
        label="توضیحات"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button type="submit" className="w-full" isPending={loading}>
        ذخیره تغییرات
      </Button>
    </form>
  );
}
