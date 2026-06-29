"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { Add, Trash, Edit2 } from "iconsax-reactjs";

import * as businessApi from "@/common/api/business";
import { PATHS } from "@/common/constants";
import type { IBudget } from "@/common/interfaces/budget.interface";
import { formatPrice } from "@/common/utils/persian-digits";
import { formatJalaliDateSlashed } from "@/common/utils/jalali-date";
import { showToast } from "@/common/utils/toast";
import {
  hasBusinessPermission,
  workspaceContextSelector,
} from "@/stores/businessContext";
import { useAppSelector } from "@/stores/hooks";

type BusinessTransactionsPageProps = {
  businessId: string;
};

export function BusinessTransactionsPage({
  businessId,
}: BusinessTransactionsPageProps) {
  const workspace = useAppSelector(workspaceContextSelector);
  const permissions = workspace?.permissions ?? [];
  const [budgets, setBudgets] = useState<IBudget[]>([]);
  const [loading, setLoading] = useState(true);

  const canCreate = hasBusinessPermission(permissions, "transactions.create");
  const canDelete = hasBusinessPermission(permissions, "transactions.delete");
  const canEdit = hasBusinessPermission(permissions, "transactions.edit");
  const canApprove = hasBusinessPermission(permissions, "transactions.edit");
  const [pending, setPending] = useState<IBudget[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, pendingList] = await Promise.all([
        businessApi.fetchBusinessBudgets(businessId),
        canApprove
          ? businessApi.fetchPendingBusinessBudgets(businessId)
          : Promise.resolve([]),
      ]);
      setBudgets(list);
      setPending(pendingList);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }, [businessId, canApprove]);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(budgetId: string, status: "approved" | "rejected") {
    try {
      await businessApi.reviewBusinessBudget(budgetId, { status }, businessId);
      showToast(status === "approved" ? "تأیید شد" : "رد شد", "success");
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  async function remove(id: string) {
    try {
      await businessApi.deleteBusinessBudget(id, businessId);
      showToast("حذف شد", "success");
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  if (!hasBusinessPermission(permissions, "transactions.view")) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-muted">
        دسترسی مشاهده تراکنش ندارید
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canCreate ? (
        <Link href={PATHS.BUSINESS_CREATE_TRANSACTION(businessId)}>
          <Button className="w-full">
            <Add size={18} />
            ثبت تراکنش جدید
          </Button>
        </Link>
      ) : null}

      {canApprove && pending.length > 0 ? (
        <section className="glass rounded-2xl border border-amber-300/50 p-4">
          <h2 className="font-semibold text-amber-700">
            در انتظار تأیید ({pending.length})
          </h2>
          <ul className="mt-3 space-y-2">
            {pending.map((b) => (
              <li
                key={b._id}
                className="flex items-center justify-between rounded-xl bg-surface-secondary p-3 text-sm"
              >
                <span>{formatPrice(b.price)}</span>
                <div className="flex gap-2">
                  <Button size="sm" onPress={() => void approve(b._id, "approved")}>
                    تأیید
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onPress={() => void approve(b._id, "rejected")}
                  >
                    رد
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {loading ? (
        <div className="text-muted">در حال بارگذاری…</div>
      ) : budgets.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-muted">
          تراکنشی ثبت نشده
        </div>
      ) : (
        <ul className="space-y-2">
          {budgets.map((b) => (
            <li
              key={b._id}
              className="glass flex items-center justify-between rounded-2xl p-4"
            >
              <div>
                <p
                  className={`font-semibold ${
                    b.type === 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {b.type === 0 ? "+" : "−"}
                  {formatPrice(b.price)}
                </p>
                <p className="text-sm text-muted">
                  {typeof b.category === "object" && b.category?.title
                    ? b.category.title
                    : "—"}
                  {" · "}
                  {formatJalaliDateSlashed(String(b.year), String(b.month), String(b.day))}
                </p>
                {b.description ? (
                  <p className="text-xs text-muted">{b.description}</p>
                ) : null}
                {(b as IBudget & { approvalStatus?: string }).approvalStatus ===
                "pending" ? (
                  <span className="text-xs text-amber-600">در انتظار تأیید</span>
                ) : null}
              </div>
              <div className="flex gap-1">
                {canEdit &&
                (b as IBudget & { approvalStatus?: string }).approvalStatus !==
                  "pending" ? (
                  <Link
                    href={PATHS.BUSINESS_EDIT_TRANSACTION(businessId, b._id)}
                  >
                    <Button isIconOnly variant="ghost" aria-label="ویرایش">
                      <Edit2 size={18} />
                    </Button>
                  </Link>
                ) : null}
                {canDelete ? (
                <Button
                  isIconOnly
                  variant="ghost"
                  aria-label="حذف"
                  onPress={() => void remove(b._id)}
                >
                  <Trash size={18} />
                </Button>
              ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
