"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@heroui/react";
import { Add } from "iconsax-reactjs";

import * as businessApi from "@/common/api/business";
import { PATHS } from "@/common/constants";
import type { ICategory } from "@/common/interfaces/category.interface";
import {
  getJalaliNow,
  toEnglishDigits,
} from "@/common/utils";
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
import {
  AppModal,
  AppModalDialog,
  AppModalHeader,
} from "@/components/common/ui/AppModal";
import { FormInput } from "@/components/common/form/FormFields";

type BusinessBudgetFormPageProps = {
  businessId: string;
};

export function BusinessBudgetFormPage({ businessId }: BusinessBudgetFormPageProps) {
  const router = useRouter();
  const workspace = useAppSelector(workspaceContextSelector);
  const permissions = workspace?.permissions ?? [];

  const now = getJalaliNow();
  const [price, setPrice] = useState("");
  const [type, setType] = useState(String(BudgetType.COST));
  const [category, setCategory] = useState("");
  const [year, setYear] = useState(String(now.jYear()));
  const [month, setMonth] = useState(String(now.jMonth() + 1));
  const [day, setDay] = useState(String(now.jDate()));
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: c._id, label: c.title })),
    [categories],
  );

  const loadCategories = useCallback(async () => {
    try {
      const list = await businessApi.fetchBusinessCategories(businessId);
      setCategories(list);
    } catch {
      setCategories([]);
    }
  }, [businessId]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  async function createCategory() {
    if (!newCategoryTitle.trim()) {
      showToast("نام دسته الزامی است");
      return;
    }
    setSavingCategory(true);
    try {
      const created = await businessApi.createBusinessCategory(
        { title: newCategoryTitle.trim() },
        businessId,
      );
      setCategories((prev) => [...prev, created]);
      setCategory(created._id);
      setCategoryModalOpen(false);
      setNewCategoryTitle("");
      showToast("دسته ایجاد شد", "success");
    } catch (err) {
      showErrorToast(err);
    } finally {
      setSavingCategory(false);
    }
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();

    if (!price || !category || !year || !month || !day) {
      showToast("مبلغ، دسته‌بندی و تاریخ الزامی است");
      return;
    }

    setLoading(true);
    try {
      await businessApi.createBusinessBudget(
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
      const threshold = workspace?.settings?.transactionApprovalThreshold ?? 0;
      const amount = Number(toEnglishDigits(price));
      if (threshold > 0 && amount >= threshold) {
        showToast("تراکنش ثبت شد — در انتظار تأیید مدیر", "success");
      } else {
        showToast("تراکنش ثبت شد", "success");
      }
      router.push(PATHS.BUSINESS_TRANSACTIONS(businessId));
    } catch (err) {
      showErrorToast(err);
    } finally {
      setLoading(false);
    }
  }

  if (!hasBusinessPermission(permissions, "transactions.create")) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-muted">
        دسترسی ثبت تراکنش ندارید
      </div>
    );
  }

  return (
    <div className="pb-form-page">
      <form onSubmit={(e) => void submit(e)}>
        <div className="glass space-y-4 rounded-2xl p-4">
          <p className="text-sm text-muted">ثبت تراکنش کسب‌وکار</p>

          <div className="flex gap-2">
            {[
              { id: String(BudgetType.INCOME), label: "دریافتی" },
              { id: String(BudgetType.COST), label: "پرداختی" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setType(item.id)}
                className={`flex-1 rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
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

          <FormPriceInput label="مبلغ (تومان)" value={price} onChange={setPrice} />

          <FormDatePicker
            label="تاریخ (شمسی)"
            year={year}
            month={month}
            day={day}
            onChange={(value) => {
              setYear(value.year);
              setMonth(value.month);
              setDay(value.day);
            }}
          />

          <FormCategoryComboBox
            label="دسته‌بندی"
            placeholder="انتخاب دسته‌بندی"
            selectedKey={category || undefined}
            onSelectionChange={(key) => setCategory(key)}
            options={categoryOptions}
            emptyMessage="دسته‌ای ثبت نشده — یک دسته جدید بسازید"
          />

          <FormTextArea
            label="توضیحات"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onPress={() => setCategoryModalOpen(true)}
          >
            <Add size={18} />
            ایجاد دسته‌بندی
          </Button>

          <div className="flex flex-col gap-2 border-t border-border/50 pt-4">
            <Button type="submit" className="w-full" size="lg" isPending={loading}>
              ثبت تراکنش
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onPress={() => router.back()}
            >
              انصراف
            </Button>
          </div>
        </div>
      </form>

      <AppModal open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <AppModalDialog>
          <AppModalHeader>دسته‌بندی جدید</AppModalHeader>
          <div className="space-y-4 p-4">
            <FormInput
              label="نام دسته"
              value={newCategoryTitle}
              onChange={(e) => setNewCategoryTitle(e.target.value)}
            />
            <Button
              className="w-full"
              onPress={() => void createCategory()}
              isPending={savingCategory}
            >
              ایجاد
            </Button>
          </div>
        </AppModalDialog>
      </AppModal>
    </div>
  );
}
