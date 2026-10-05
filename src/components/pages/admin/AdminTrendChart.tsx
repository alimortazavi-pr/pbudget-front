"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { AdminActivitySeries } from "@/common/interfaces/admin";
import { formatNumberFa } from "./ui/admin-format";

const dayLabel = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "short", day: "numeric" });

export function AdminTrendChart({ activity }: { activity: AdminActivitySeries }) {
  const data = activity.labels.map((label, index) => ({
    label: dayLabel.format(new Date(`${label}T12:00:00`)),
    users: activity.users[index] ?? 0,
    transactions: activity.transactions[index] ?? 0,
  }));

  return (
    <div className="h-64 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="trendTx" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="trendUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted)" }} tickLine={false} axisLine={false} tickFormatter={(value) => formatNumberFa(Number(value))} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", direction: "rtl", fontSize: 12 }}
            formatter={(value, name) => [formatNumberFa(Number(value)), name === "users" ? "کاربر جدید" : "تراکنش"]}
          />
          <Area type="monotone" dataKey="transactions" stroke="var(--accent)" strokeWidth={2} fill="url(#trendTx)" />
          <Area type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} fill="url(#trendUsers)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
