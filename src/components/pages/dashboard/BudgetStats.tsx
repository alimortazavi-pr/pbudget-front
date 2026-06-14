import { formatPrice, toPersianDigits } from "@/common/utils";

type BudgetStatsProps = {
  count: number;
  periodBalance?: number;
};

export function BudgetStats({ count, periodBalance }: BudgetStatsProps) {
  return (
    <div className="pb-stat-card lg:p-6">
      <p className="text-sm text-muted lg:text-base">تراز دوره</p>
      <p className="mt-2 text-2xl font-bold text-foreground lg:text-3xl">
        {formatPrice(periodBalance ?? 0)}{" "}
        <span className="text-sm font-normal text-muted lg:text-base">
          تومان
        </span>
      </p>
      <p className="mt-2 text-xs text-muted lg:text-sm">
        {toPersianDigits(count)} تراکنش در این بازه
      </p>
    </div>
  );
}
