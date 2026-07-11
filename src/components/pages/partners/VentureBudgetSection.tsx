"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button, Modal } from "@heroui/react";
import { Add } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as partnersApi from "@/common/api/partners";
import type { IBudget } from "@/common/interfaces/budget.interface";
import { BudgetType } from "@/types/enums";
import { formatJalaliDate, formatPrice } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import {
  AppModal,
  AppModalDialog,
  AppModalHeader,
  modalSheetBodyClass,
} from "@/components/common/ui/AppModal";
import { PartnerBudgetCard } from "@/components/pages/partners/PartnerBudgetCard";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

type VentureBudgetSectionProps = {
  ventureId: string;
  readOnly?: boolean;
};

export function VentureBudgetSection({
  ventureId,
  readOnly = false,
}: VentureBudgetSectionProps) {
  const { t } = useTranslation();
  const currentUser = useAppSelector(userSelector);
  const [budgets, setBudgets] = useState<IBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [attachOpen, setAttachOpen] = useState(false);
  const [candidates, setCandidates] = useState<IBudget[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [attachingId, setAttachingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await partnersApi.fetchVentureBudgets(ventureId);
      setBudgets(list);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.k0b952d2d1b"));
    } finally {
      setLoading(false);
    }
  }, [ventureId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openAttachModal() {
    setAttachOpen(true);
    setCandidatesLoading(true);
    try {
      const list = await partnersApi.fetchVentureBudgetCandidates(ventureId);
      setCandidates(list);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.k5c84d568d1"));
    } finally {
      setCandidatesLoading(false);
    }
  }

  async function attach(budgetId: string) {
    setAttachingId(budgetId);
    try {
      await partnersApi.attachVentureBudget(ventureId, budgetId);
      showToast(t("auto.k8d4d55dab7"), "success");
      setAttachOpen(false);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.k7c458b912d"));
    } finally {
      setAttachingId(null);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">{t("auto.k25af44580b")}</h2>
          <p className="mt-1 text-sm text-muted">
            {t("auto.k964a4a551d")}
          </p>
        </div>
        {!readOnly ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onPress={() => void openAttachModal()}>
              <Add size={16} />
              {t("auto.k90a573a5af")}
            </Button>
            <Link href={PATHS.CREATE_BUDGET}>
              <Button size="sm" variant="secondary">
                <Add size={16} />
                {t("auto.kc26f42387e")}
              </Button>
            </Link>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-8 text-center text-muted">
          {t("common.loading")}
        </div>
      ) : budgets.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-muted">
          {t("auto.kc2656d1268")}
        </div>
      ) : (
        <div className="space-y-2">
          {budgets.map((budget) => (
            <PartnerBudgetCard
              key={budget._id}
              budget={budget}
              currentUserId={currentUser?._id}
            />
          ))}
        </div>
      )}

      <AppModal open={attachOpen} onOpenChange={setAttachOpen}>
        <AppModalDialog className="flex max-h-[min(90dvh,640px)] max-w-lg flex-col overflow-hidden">
          <AppModalHeader onClose={() => setAttachOpen(false)}>
            <Modal.Heading>{t("auto.kd4b3befc1f")}</Modal.Heading>
            <p className="mt-1 text-sm text-muted">
              {t("auto.kf4aa629cd6")}
            </p>
          </AppModalHeader>
          <Modal.Body className={`${modalSheetBodyClass} space-y-2`}>
            {candidatesLoading ? (
              <p className="py-8 text-center text-sm text-muted">{t("common.loading")}</p>
            ) : candidates.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                {t("auto.kcff0ca4d87")}
              </p>
            ) : (
              candidates.map((budget) => {
                const isIncome = budget.type === BudgetType.INCOME;
                return (
                  <div
                    key={budget._id}
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-surface-secondary px-3 py-3"
                  >
                    <div className="min-w-0 flex-1 text-start">
                      <p className="truncate text-sm font-medium">
                        {isIncome ? t("auto.k63397316b7") : t("auto.k1025955b55")}
                        {budget.description ? ` · ${budget.description}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatJalaliDate(budget.year, budget.month, budget.day)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <p
                        className={`text-sm font-bold ${isIncome ? "text-income" : "text-expense"}`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatPrice(budget.price)}
                      </p>
                      <Button
                        size="sm"
                        onPress={() => void attach(budget._id)}
                        isPending={attachingId === budget._id}
                      >
                        {t("auto.kb8b0ca1ea2")}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </Modal.Body>
        </AppModalDialog>
      </AppModal>
    </section>
  );
}
