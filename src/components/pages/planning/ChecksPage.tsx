"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/react";
import { Add } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as checksApi from "@/common/api/checks";
import type { ICheck, ICheckSummary } from "@/common/interfaces/check.interface";
import { formatJalaliMonthYear, formatPrice } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { ClearCheckModal } from "@/components/pages/planning/ClearCheckModal";
import { CreateCheckModal } from "@/components/pages/planning/CreateCheckModal";
import { PeriodNavigator } from "@/components/pages/planning/PeriodNavigator";
import { usePeriodQuery } from "@/components/pages/planning/usePeriodQuery";
import { CheckType } from "@/types/enums";

export function ChecksPage() {
  const { t } = useTranslation();
  const { year, month, goToToday, shiftMonth } = usePeriodQuery(PATHS.CHECKS);

  const [loading, setLoading] = useState(true);
  const [checkSummary, setCheckSummary] = useState<ICheckSummary | null>(null);
  const [checks, setChecks] = useState<ICheck[]>([]);
  const [checkPersons, setCheckPersons] = useState<string[]>([]);
  const [createCheckOpen, setCreateCheckOpen] = useState(false);
  const [clearTarget, setClearTarget] = useState<ICheck | null>(null);

  const periodLabel = useMemo(
    () => formatJalaliMonthYear(year, month),
    [year, month],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summary, list, persons] = await Promise.all([
        checksApi.fetchCheckSummary(),
        checksApi.fetchChecks({ duration: "monthly", year, month, status: "all" }),
        checksApi.fetchCheckPersons(),
      ]);
      setCheckSummary(summary);
      setChecks(list.checks);
      setCheckPersons(persons);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-lg">
        <p className="text-sm font-medium text-white/80">{t("auto.kb63b7bcb2f")}</p>
        <h1 className="mt-1 text-2xl font-bold">{t("nav.checks")}</h1>
        <p className="mt-2 text-sm leading-7 text-white/80">
          ثبت چک دریافتی و پرداختی با سررسید و وصول خودکار به تراکنش.
        </p>
      </section>

      <PeriodNavigator
        label={periodLabel}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
        onToday={goToToday}
      />

      {checkSummary && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-muted">{t("auto.k4fd9e4fcd7")}</p>
            <p className="mt-2 text-xl font-bold">
              {formatPrice(checkSummary.pendingReceivable)}
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-muted">{t("auto.k214f60ab58")}</p>
            <p className="mt-2 text-xl font-bold">
              {formatPrice(checkSummary.pendingPayable)}
            </p>
          </div>
        </div>
      )}

      <Button className="w-full" onPress={() => setCreateCheckOpen(true)}>
        <Add size={18} />
        ثبت چک
      </Button>

      {loading ? (
        <p className="text-center text-sm text-muted">{t("common.loading")}</p>
      ) : !checks.length ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
          چکی برای این ماه ثبت نشده.
        </p>
      ) : (
        <div className="space-y-3">
          {checks.map((check) => (
            <div key={check._id} className="glass rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{check.person}</p>
                  <p className="mt-1 text-xs text-muted">
                    {check.type === CheckType.RECEIVABLE ? "دریافتی" : "پرداختی"}
                    {check.bankName ? ` · ${check.bankName}` : ""}
                    {check.checkNumber ? ` · #${check.checkNumber}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    سررسید {check.dueYear}/{check.dueMonth}/{check.dueDay}
                  </p>
                </div>
                <p className="text-lg font-bold">{formatPrice(check.amount)}</p>
              </div>

              {check.status === "cleared" ? (
                <p className="mt-3 text-sm text-income">{t("auto.ke6110f2af4")}</p>
              ) : check.status === "pending" ? (
                <Button
                  size="sm"
                  className="mt-3 w-full"
                  onPress={() => setClearTarget(check)}
                >
                  {check.type === CheckType.RECEIVABLE ? "وصول شد" : "پرداخت شد"}
                </Button>
              ) : (
                <p className="mt-3 text-sm text-muted">{check.status}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateCheckModal
        open={createCheckOpen}
        onOpenChange={setCreateCheckOpen}
        persons={checkPersons}
        onCreated={() => void load()}
      />
      <ClearCheckModal
        check={clearTarget}
        open={!!clearTarget}
        onOpenChange={(open) => !open && setClearTarget(null)}
        onCleared={() => {
          setClearTarget(null);
          void load();
        }}
      />
    </div>
  );
}
