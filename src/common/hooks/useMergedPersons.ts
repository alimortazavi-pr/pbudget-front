import { useEffect, useState } from "react";

import * as checksApi from "@/common/api/checks";
import * as debtsApi from "@/common/api/debts";
import * as paymentPlansApi from "@/common/api/payment-plans";

export function useMergedPersons(enabled = true) {
  const [persons, setPersons] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) return;

    void Promise.all([
      debtsApi.fetchDebtPersons().catch(() => [] as string[]),
      checksApi.fetchCheckPersons().catch(() => [] as string[]),
      paymentPlansApi.fetchPaymentPlanPersons().catch(() => [] as string[]),
    ]).then(([debtPersons, checkPersons, planPersons]) => {
      const merged = [...debtPersons, ...checkPersons, ...planPersons]
        .map((person) => person.trim())
        .filter(Boolean);
      setPersons([...new Set(merged)].sort((a, b) => a.localeCompare(b, "fa")));
    });
  }, [enabled]);

  return persons;
}
