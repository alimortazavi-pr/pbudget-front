"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";

import * as categoriesApi from "@/common/api/categories";
import * as partnersApi from "@/common/api/partners";
import type {
  IPartnerSettlement,
  IPartnerSettlementBatch,
  PartnerContextType,
} from "@/common/interfaces/partner.interface";
import { formatPrice } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { FormSelect } from "@/components/common/form/FormFields";
import { useAppSelector } from "@/stores/hooks";
import { categoriesSelector } from "@/stores/category";

type PartnerSettlementPanelProps = {
  contextType: PartnerContextType;
  contextId: string;
  isOwner?: boolean;
  onSettlementApplied?: () => void;
};

export function PartnerSettlementPanel({
  contextType,
  contextId,
  isOwner = false,
  onSettlementApplied,
}: PartnerSettlementPanelProps) {
  const categories = useAppSelector(categoriesSelector);
  const [settlement, setSettlement] = useState<IPartnerSettlement | null>(null);
  const [batches, setBatches] = useState<IPartnerSettlementBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState("");
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data =
        contextType === "project"
          ? await partnersApi.fetchProjectSettlement(contextId)
          : await partnersApi.fetchVentureSettlement(contextId);
      setSettlement(data);

      if (isOwner) {
        const history = await partnersApi.fetchSettlementBatches(contextType, contextId);
        setBatches(history);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری تسویه");
    } finally {
      setLoading(false);
    }
  }, [contextId, contextType, isOwner]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!categories?.length) {
      void categoriesApi.fetchCategories();
    }
  }, [categories?.length]);

  const categoryOptions =
    categories?.map((category) => ({
      id: category._id,
      label: category.title,
    })) ?? [];

  async function applySettlement() {
    if (!categoryId) {
      showToast("دسته‌بندی بدهی را انتخاب کنید");
      return;
    }

    if (
      !confirm(
        "بدهی‌های قابل پرداخت به شرکا در بخش طلب و بدهی ثبت می‌شود. ادامه می‌دهید؟",
      )
    ) {
      return;
    }

    setApplying(true);
    try {
      const result = await partnersApi.applyPartnerSettlement(
        contextType,
        contextId,
        categoryId,
      );
      showToast(result.message, "success");
      await load();
      onSettlementApplied?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در ثبت تسویه");
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">در حال محاسبه تسویه…</p>;
  }

  if (!settlement) {
    return null;
  }

  const partnerDebts = settlement.partners.filter(
    (row) => !row.isOwner && row.profitShare > 0,
  );

  return (
    <section className="space-y-3 rounded-2xl border border-border/50 bg-surface-secondary/40 p-4">
      <div>
        <h3 className="font-bold">تسویه و تقسیم سود</h3>
        {settlement.hasFinancials === false ? (
          <p className="mt-1 text-xs leading-6 text-muted">{settlement.note}</p>
        ) : (
          <p className="mt-1 text-xs text-muted">
            سود خالص {formatPrice(settlement.profitAmount)} · دریافت{" "}
            {formatPrice(settlement.receivedAmount)} · هزینه{" "}
            {formatPrice(settlement.spentAmount)}
          </p>
        )}
      </div>

      {settlement.partners.length === 0 ? (
        <p className="text-sm text-muted">
          سهم شرکا را ثبت کنید تا تقسیم خودکار نمایش داده شود.
        </p>
      ) : (
        <div className="space-y-2">
          {settlement.partners.map((row) => (
            <div
              key={`${row.partnerId ?? "owner"}-${row.displayName}`}
              className="rounded-xl bg-background/60 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {row.displayName}
                    {row.isOwner ? " (شما)" : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">سهم {row.sharePercent}٪</p>
                </div>
                {settlement.hasFinancials !== false ? (
                  <p
                    className={`font-bold ${row.profitShare >= 0 ? "text-income" : "text-expense"}`}
                  >
                    {formatPrice(row.profitShare)}
                  </p>
                ) : null}
              </div>
              {settlement.hasFinancials !== false ? (
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                  <span>دریافت {formatPrice(row.receivedShare)}</span>
                  <span>هزینه {formatPrice(row.spentShare)}</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {settlement.allocatedPercent > 100 ? (
        <p className="text-xs text-danger">
          جمع سهم‌ها بیش از ۱۰۰٪ است — تقسیم را اصلاح کنید.
        </p>
      ) : null}

      {isOwner && settlement.hasFinancials && partnerDebts.length > 0 ? (
        <div className="space-y-3 border-t border-border/40 pt-3">
          <p className="text-sm font-medium">ثبت بدهی واقعی به شرکا</p>
          <FormSelect
            label="دسته‌بندی بدهی"
            placeholder="انتخاب دسته"
            selectedKey={categoryId}
            onSelectionChange={setCategoryId}
            options={categoryOptions}
          />
          <Button
            className="w-full"
            onPress={() => void applySettlement()}
            isPending={applying}
          >
            ثبت {partnerDebts.length} بدهی در طلب و بدهی
          </Button>
        </div>
      ) : null}

      {isOwner && batches.length > 0 ? (
        <div className="space-y-2 border-t border-border/40 pt-3">
          <p className="text-sm font-medium">تسویه‌های ثبت‌شده</p>
          {batches.map((batch) => (
            <div
              key={batch._id}
              className="rounded-xl bg-background/50 px-3 py-2 text-xs text-muted"
            >
              <p>
                {batch.debts.length} بدهی · سود{" "}
                {formatPrice(batch.profitAmount)}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
