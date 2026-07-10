"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AdminActivitySeries } from "@/common/interfaces/admin";
import { formatPrice, toPersianDigits } from "@/common/utils";

type AdminActivityChartsProps = {
  activity: AdminActivitySeries;
};

export function AdminActivityCharts({ activity }: AdminActivityChartsProps) {
  const { t } = useTranslation();
  const chartData = activity.labels.map((label, index) => ({
    date: label.slice(5),
    users: activity.users[index],
    transactions: activity.transactions[index],
    income: activity.income[index],
    cost: activity.cost[index],
  }));

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <div className="glass rounded-2xl p-5">
        <h4 className="mb-4 font-bold">{t("رشد کاربران و تراکنش‌ها (۳۰ روز)")}</h4>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, name) => [
                  toPersianDigits(Number(value)),
                  name === "users"
                    ? "کاربر"
                    : name === "transactions"
                      ? "تراکنش"
                      : String(name),
                ]}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="users"
                name="کاربر جدید"
                stroke="#8b5cf6"
                fill="#8b5cf633"
              />
              <Area
                type="monotone"
                dataKey="transactions"
                name="تراکنش"
                stroke="#f43f5e"
                fill="#f43f5e33"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h4 className="mb-4 font-bold">{t("درآمد و هزینه (۳۰ روز)")}</h4>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, name) => [
                  `${formatPrice(Number(value))} تومان`,
                  name === "income" ? "درآمد" : "هزینه",
                ]}
              />
              <Legend />
              <Bar dataKey="income" name="درآمد" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost" name="هزینه" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
