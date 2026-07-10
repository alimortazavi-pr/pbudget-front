"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { Chart, TrendDown, TrendUp } from "iconsax-reactjs";

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
  const { t } = useTranslation();
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
      showToast(t("دسته‌بندی بدهی را انتخاب کنید"));
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
    return <p className="text-sm text-muted">{t("در حال محاسبه سهم‌ها…")}</p>;
  }

  if (!settlement) {
    return null;
  }

  const partnerDebts = settlement.partners.filter(
    (row) => !row.isOwner && row.profitShare > 0,
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-background">
      <div className="border-b border-border/50 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-surface-secondary text-accent">
            <Chart size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold">{t("تقسیم درآمد و هزینه")}</h3>
            <p className="mt-0.5 text-xs text-muted">
              سهم هر نفر از کل تراکنش‌های مرتبط
            </p>
          </div>
        </div>
      </div>

      {settlement.hasFinancials === false ? (
        <p className="px-4 py-5 text-sm leading-6 text-muted sm:px-5">
          {settlement.note}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-px border-b border-border/50 bg-border/40">
            <div className="bg-background px-3 py-3 text-center sm:px-4">
              <p className="text-[11px] text-muted">{t("دریافت")}</p>
              <p className="mt-1 text-sm font-bold text-income sm:text-base">
                {formatPrice(settlement.receivedAmount)}
              </p>
            </div>
            <div className="bg-background px-3 py-3 text-center sm:px-4">
              <p className="text-[11px] text-muted">{t("هزینه")}</p>
              <p className="mt-1 text-sm font-bold text-expense sm:text-base">
                {formatPrice(settlement.spentAmount)}
              </p>
            </div>
            <div className="bg-background px-3 py-3 text-center sm:px-4">
              <p className="text-[11px] text-muted">{t("سود خالص")}</p>
              <p
                className={`mt-1 text-sm font-bold sm:text-base ${
                  settlement.profitAmount >= 0 ? "text-income" : "text-expense"
                }`}
              >
                {formatPrice(settlement.profitAmount)}
              </p>
            </div>
          </div>

          <div className="space-y-2 p-4 sm:p-5">
            {settlement.partners.length === 0 ? (
              <p className="text-sm text-muted">
                سهم شرکا را ثبت کنید تا تقسیم نمایش داده شود.
              </p>
            ) : (
              settlement.partners.map((row) => (
                <div
                  key={`${row.partnerId ?? "owner"}-${row.displayName}`}
                  className="rounded-xl border border-border/40 bg-surface-secondary/40 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {row.displayName}
                        {row.isOwner ? " (شما)" : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">سهم {row.sharePercent}٪</p>
                    </div>
                    <div className="text-left">
                      <p
                        className={`text-sm font-bold ${
                          row.profitShare >= 0 ? "text-income" : "text-expense"
                        }`}
                      >
                        {row.profitShare >= 0 ? (
                          <TrendUp size={14} className="mb-0.5 inline" />
                        ) : (
                          <TrendDown size={14} className="mb-0.5 inline" />
                        )}{" "}
                        {formatPrice(Math.abs(row.profitShare))}
                      </p>
                      <p className="text-[11px] text-muted">{t("سهم از سود")}</p>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-income-soft/40 px-2 py-1.5">
                      <span className="text-muted">{t("سهم دریافت:")}</span>
                      <span className="font-medium text-income">
                        {formatPrice(row.receivedShare)}
                      </span>
                    </div>
                    <div className="rounded-lg bg-expense-soft/40 px-2 py-1.5">
                      <span className="text-muted">{t("سهم هزینه:")}</span>
                      <span className="font-medium text-expense">
                        {formatPrice(row.spentShare)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {settlement.allocatedPercent > 100 ? (
        <p className="px-4 pb-3 text-xs text-danger sm:px-5">
          جمع سهم‌ها بیش از ۱۰۰٪ است — تقسیم را اصلاح کنید.
        </p>
      ) : null}

      {isOwner && settlement.hasFinancials && partnerDebts.length > 0 ? (
        <div className="space-y-3 border-t border-border/40 px-4 py-4 sm:px-5">
          <p className="text-sm font-medium">{t("ثبت رسمی در طلب و بدهی")}</p>
          <FormSelect
            label={t("دسته‌بندی")}
            placeholder={t("انتخاب دسته")}
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
        <div className="space-y-2 border-t border-border/40 px-4 py-4 sm:px-5">
          <p className="text-sm font-medium">{t("تسویه‌های ثبت‌شده")}</p>
          {batches.map((batch) => (
            <div
              key={batch._id}
              className="rounded-xl bg-surface-secondary/60 px-3 py-2 text-xs text-muted"
            >
              {batch.debts.length} بدهی · سود {formatPrice(batch.profitAmount)}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
