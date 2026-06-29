"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";

import * as businessApi from "@/common/api/business";
import { formatPrice } from "@/common/utils/persian-digits";
import { showToast } from "@/common/utils/toast";
import {
  hasBusinessPermission,
  workspaceContextSelector,
} from "@/stores/businessContext";
import { useAppSelector } from "@/stores/hooks";

type BusinessPettyCashPageProps = {
  businessId: string;
};

export function BusinessPettyCashPage({ businessId }: BusinessPettyCashPageProps) {
  const workspace = useAppSelector(workspaceContextSelector);
  const permissions = workspace?.permissions ?? [];
  const [accounts, setAccounts] = useState<
    { _id: string; title: string; balance: number; limit: number }[]
  >([]);
  const [expenses, setExpenses] = useState<
    { _id: string; amount: number; description: string; status: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [acc, exp] = await Promise.all([
        businessApi.fetchPettyCashAccounts(businessId),
        businessApi.fetchPettyCashExpenses(businessId),
      ]);
      setAccounts((acc as { accounts: typeof accounts }).accounts ?? []);
      setExpenses((exp as { expenses: typeof expenses }).expenses ?? []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(expenseId: string) {
    try {
      await businessApi.reviewPettyCashExpense(
        expenseId,
        { status: "approved" },
        businessId,
      );
      showToast("تأیید شد", "success");
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  const canHold = hasBusinessPermission(permissions, "petty_cash.hold");
  const canApprove = hasBusinessPermission(permissions, "petty_cash.approve");

  if (!canHold && !hasBusinessPermission(permissions, "petty_cash.submit")) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-muted">
        دسترسی تنخواه ندارید
      </div>
    );
  }

  if (loading) {
    return <div className="text-muted">در حال بارگذاری…</div>;
  }

  return (
    <div className="space-y-5">
      {canHold ? (
        <section className="glass rounded-2xl p-4">
          <h2 className="font-semibold">حساب‌های تنخواه</h2>
          {accounts.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              از پنل مدیر حساب تنخواه تعریف کنید
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {accounts.map((a) => (
                <li key={a._id} className="text-sm">
                  {a.title}: {formatPrice(a.balance)} / {formatPrice(a.limit)}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section className="glass rounded-2xl p-4">
        <h2 className="font-semibold">هزینه‌ها</h2>
        <ul className="mt-3 space-y-2">
          {expenses.map((e) => (
            <li
              key={e._id}
              className="flex items-center justify-between rounded-xl bg-surface-secondary p-3 text-sm"
            >
              <div>
                <p>{formatPrice(e.amount)}</p>
                <p className="text-muted">{e.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted">{e.status}</span>
                {canApprove && e.status === "pending" ? (
                  <Button size="sm" onPress={() => void approve(e._id)}>
                    تأیید
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
