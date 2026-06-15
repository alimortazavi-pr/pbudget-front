"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import * as budgetsApi from "@/common/api/budgets";
import * as checksApi from "@/common/api/checks";
import * as paymentPlansApi from "@/common/api/payment-plans";
import * as tasksApi from "@/common/api/tasks";
import type { IBudget } from "@/common/interfaces/budget.interface";
import type { ICheck } from "@/common/interfaces/check.interface";
import type { IPaymentPlanOccurrence } from "@/common/interfaces/payment-plan.interface";
import type { ITask } from "@/common/interfaces/task.interface";
import type { PeriodDuration } from "@/common/constants/experience";

type UseTimelineDataArgs = {
  duration: PeriodDuration;
  year: string;
  month: string;
  day: string;
};

export type TimelineData = {
  loading: boolean;
  income: number;
  expense: number;
  net: number;
  budgets: IBudget[];
  tasks: ITask[];
  taskSummary: {
    total: number;
    done: number;
    pending: number;
    overdue: number;
  };
  checks: ICheck[];
  checkPendingCount: number;
  installments: IPaymentPlanOccurrence[];
  installmentPendingCount: number;
  dueCount: number;
};

function buildBudgetParams(args: UseTimelineDataArgs) {
  const params: Record<string, string> = {
    duration: args.duration === "all" ? "all" : args.duration,
    year: args.year,
    month: args.month,
  };
  if (args.duration === "daily") params.day = args.day;
  return params;
}

function taskDuration(duration: PeriodDuration): "daily" | "monthly" | "yearly" {
  if (duration === "all") return "yearly";
  if (duration === "yearly") return "yearly";
  if (duration === "daily") return "daily";
  return "monthly";
}

export function useTimelineData(args: UseTimelineDataArgs) {
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<IBudget[]>([]);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [taskSummary, setTaskSummary] = useState({
    total: 0,
    done: 0,
    pending: 0,
    overdue: 0,
  });
  const [checks, setChecks] = useState<ICheck[]>([]);
  const [installments, setInstallments] = useState<IPaymentPlanOccurrence[]>(
    [],
  );

  const queryKey = useMemo(
    () =>
      `${args.duration}-${args.year}-${args.month}-${args.day}`,
    [args.day, args.duration, args.month, args.year],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const td = taskDuration(args.duration);
      const taskParams = {
        duration: td,
        year: args.year,
        month: td !== "yearly" ? args.month : undefined,
        day: td === "daily" ? args.day : undefined,
        status: "all" as const,
      };

      const checkParams =
        args.duration === "all"
          ? undefined
          : {
              duration: args.duration,
              year: args.year,
              month: args.duration !== "yearly" ? args.month : undefined,
              day: args.duration === "daily" ? args.day : undefined,
              status: "pending",
            };

      const [
        budgetRes,
        taskList,
        summary,
        checkList,
        monthlyPayments,
      ] = await Promise.all([
        budgetsApi.fetchBudgets(buildBudgetParams(args)),
        tasksApi.fetchTasks(taskParams),
        tasksApi.fetchTaskSummary(taskParams),
        checksApi.fetchChecks(checkParams),
        args.duration === "daily" || args.duration === "monthly"
          ? paymentPlansApi.fetchMonthlyPayments(args.year, args.month)
          : Promise.resolve(null),
      ]);

      setBudgets(budgetRes.budgets ?? []);
      setIncome(budgetRes.totalIncomePrice ?? 0);
      setExpense(budgetRes.totalCostPrice ?? 0);
      setTasks(taskList);
      setTaskSummary(summary);
      setChecks(checkList.checks ?? []);

      if (monthlyPayments) {
        const pending = monthlyPayments.occurrences.filter(
          (item) => item.status === "pending",
        );
        const filtered =
          args.duration === "daily"
            ? pending.filter((item) => String(item.day) === args.day)
            : pending;
        setInstallments(filtered);
      } else {
        setInstallments([]);
      }
    } catch {
      setBudgets([]);
      setIncome(0);
      setExpense(0);
      setTasks([]);
      setTaskSummary({ total: 0, done: 0, pending: 0, overdue: 0 });
      setChecks([]);
      setInstallments([]);
    } finally {
      setLoading(false);
    }
  }, [args]);

  useEffect(() => {
    void load();
  }, [load, queryKey]);

  const checkPendingCount = checks.filter((c) => c.status === "pending").length;
  const installmentPendingCount = installments.length;
  const dueCount = checkPendingCount + installmentPendingCount;

  return {
    loading,
    income,
    expense,
    net: income - expense,
    budgets,
    tasks,
    taskSummary,
    checks,
    checkPendingCount,
    installments,
    installmentPendingCount,
    dueCount,
    reload: load,
  };
}
