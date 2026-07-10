import { useTranslation } from "@/components/providers/LanguageProvider";
import { formatPrice } from "@/common/utils";
import { useLocalizedDate } from "@/i18n/hooks/useLocalizedDate";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";

type BudgetStatsProps = {
  count: number;
  periodBalance?: number;
};

export function BudgetStats({ count, periodBalance }: BudgetStatsProps) {
  const { t } = useTranslation();
  const { formatCount } = useLocalizedDate();
  const { currencyLabel } = useCurrencyLabels();
  const user = useAppSelector(userSelector);
  const preferredCurrency = user?.preferences?.currency ?? "toman";

  return (
    <div className="pb-stat-card lg:p-6">
      <p className="text-sm text-muted lg:text-base">
        {t("dashboard.periodBalance")}
      </p>
      <p className="mt-2 text-2xl font-bold text-foreground lg:text-3xl">
        {formatPrice(periodBalance ?? 0)}{" "}
        <span className="text-sm font-normal text-muted lg:text-base">
          {currencyLabel(preferredCurrency)}
        </span>
      </p>
      <p className="mt-2 text-xs text-muted lg:text-sm">
        {t("dashboard.transactionCountInRange", {
          count: formatCount(count),
        })}
      </p>
    </div>
  );
}
