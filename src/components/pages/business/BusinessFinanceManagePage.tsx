"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input } from "@heroui/react";
import { Add, Trash } from "iconsax-reactjs";

import * as businessApi from "@/common/api/business";
import type { ICategory } from "@/common/interfaces/category.interface";
import type { IBox } from "@/common/interfaces/box.interface";
import type { IDebt } from "@/common/interfaces/debt.interface";
import { formatPrice } from "@/common/utils/persian-digits";
import { showToast } from "@/common/utils/toast";
import {
  hasBusinessPermission,
  workspaceContextSelector,
} from "@/stores/businessContext";
import { useAppSelector } from "@/stores/hooks";

type Tab = "categories" | "boxes" | "debts";

type BusinessFinanceManagePageProps = {
  businessId: string;
};

export function BusinessFinanceManagePage({
  businessId,
}: BusinessFinanceManagePageProps) {
  const workspace = useAppSelector(workspaceContextSelector);
  const permissions = workspace?.permissions ?? [];
  const [tab, setTab] = useState<Tab>("categories");
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [boxes, setBoxes] = useState<IBox[]>([]);
  const [debts, setDebts] = useState<IDebt[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [debtPerson, setDebtPerson] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [debtType, setDebtType] = useState("0");

  const canCategories = hasBusinessPermission(permissions, "categories.manage");
  const canBoxes = hasBusinessPermission(permissions, "boxes.manage");
  const canDebts =
    hasBusinessPermission(permissions, "debts.create") ||
    hasBusinessPermission(permissions, "debts.edit");

  const load = useCallback(async () => {
    try {
      const [cats, boxList, debtList] = await Promise.all([
        canCategories ? businessApi.fetchBusinessCategories(businessId) : [],
        canBoxes ? businessApi.fetchBusinessBoxes(businessId) : [],
        hasBusinessPermission(permissions, "debts.view")
          ? businessApi.fetchBusinessDebts(businessId)
          : [],
      ]);
      setCategories(cats);
      setBoxes(boxList);
      setDebts(debtList);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }, [businessId, canBoxes, canCategories, permissions]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!canCategories && !canBoxes && !canDebts) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-muted">
        دسترسی مدیریت مالی ندارید
      </div>
    );
  }

  async function addCategory() {
    if (!newTitle.trim()) return;
    await businessApi.createBusinessCategory(
      { title: newTitle.trim() },
      businessId,
    );
    setNewTitle("");
    showToast("دسته اضافه شد", "success");
    void load();
  }

  async function addBox() {
    if (!newTitle.trim()) return;
    await businessApi.createBusinessBox({ title: newTitle.trim() }, businessId);
    setNewTitle("");
    showToast("صندوق اضافه شد", "success");
    void load();
  }

  async function addDebt() {
    if (!debtPerson.trim() || !debtAmount) return;
    await businessApi.createBusinessDebt(
      {
        type: Number(debtType),
        person: debtPerson.trim(),
        totalAmount: Number(debtAmount),
      },
      businessId,
    );
    setDebtPerson("");
    setDebtAmount("");
    showToast("بدهی ثبت شد", "success");
    void load();
  }

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: "categories", label: "دسته‌ها", show: canCategories },
    { key: "boxes", label: "صندوق‌ها", show: canBoxes },
    { key: "debts", label: "بدهی‌ها", show: canDebts },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <button
              key={t.key}
              type="button"
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                tab === t.key
                  ? "bg-violet-600 text-white"
                  : "bg-surface-secondary text-muted"
              }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
      </div>

      {tab === "categories" && canCategories ? (
        <section className="glass rounded-2xl p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              className="flex-1"
              placeholder="نام دسته جدید"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Button onPress={() => void addCategory()}>
              <Add size={18} />
            </Button>
          </div>
          <ul className="space-y-2">
            {categories.map((c) => (
              <li
                key={c._id}
                className="flex justify-between rounded-xl bg-surface-secondary px-3 py-2 text-sm"
              >
                <span>{c.title}</span>
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  onPress={() =>
                    void businessApi
                      .deleteBusinessCategory(c._id, businessId)
                      .then(() => load())
                  }
                >
                  <Trash size={16} />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "boxes" && canBoxes ? (
        <section className="glass rounded-2xl p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              className="flex-1"
              placeholder="نام صندوق"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Button onPress={() => void addBox()}>
              <Add size={18} />
            </Button>
          </div>
          <ul className="space-y-2">
            {boxes.map((b) => (
              <li
                key={b._id}
                className="flex justify-between rounded-xl bg-surface-secondary px-3 py-2 text-sm"
              >
                <span>{b.title}</span>
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  onPress={() =>
                    void businessApi
                      .deleteBusinessBox(b._id, businessId)
                      .then(() => load())
                  }
                >
                  <Trash size={16} />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "debts" && canDebts ? (
        <section className="glass rounded-2xl p-4 space-y-3">
          <Input
            placeholder="نام شخص"
            value={debtPerson}
            onChange={(e) => setDebtPerson(e.target.value)}
          />
          <Input
            type="number"
            placeholder="مبلغ"
            value={debtAmount}
            onChange={(e) => setDebtAmount(e.target.value)}
          />
          <select
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            value={debtType}
            onChange={(e) => setDebtType(e.target.value)}
          >
            <option value="0">طلب (دیگران به ما بدهکارند)</option>
            <option value="1">بدهی (ما بدهکاریم)</option>
          </select>
          <Button className="w-full" onPress={() => void addDebt()}>
            ثبت بدهی
          </Button>
          <ul className="space-y-2">
            {debts.map((d) => (
              <li
                key={d._id}
                className="flex justify-between rounded-xl bg-surface-secondary px-3 py-2 text-sm"
              >
                <span>
                  {d.person} — {formatPrice(d.totalAmount)}
                </span>
                {hasBusinessPermission(permissions, "debts.delete") ? (
                  <Button
                    isIconOnly
                    variant="ghost"
                    size="sm"
                    onPress={() =>
                      void businessApi
                        .deleteBusinessDebt(d._id, businessId)
                        .then(() => load())
                    }
                  >
                    <Trash size={16} />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
