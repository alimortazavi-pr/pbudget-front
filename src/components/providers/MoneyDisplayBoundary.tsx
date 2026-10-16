"use client";

import { Fragment, type ReactNode, useEffect, useState } from "react";
import { DEFAULT_USER_PREFERENCES, type MoneyDisplayUnit } from "@/common/constants/user-preferences";
import { readStoredMoneyDisplayUnit, setMoneyDisplayUnit } from "@/common/utils/money-display";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

/**
 * Applies the money display unit (toman/rial) and remounts the app when it
 * changes. The first render always uses toman, like the server, so rial users
 * no longer hit a hydration mismatch; the stored unit is applied right after.
 */
export function MoneyDisplayBoundary({ children }: { children: ReactNode }) {
  const user = useAppSelector(userSelector);
  const [unit, setUnit] = useState<MoneyDisplayUnit>("toman");
  const preferred = user
    ? (user.preferences?.moneyDisplayUnit ?? DEFAULT_USER_PREFERENCES.moneyDisplayUnit)
    : null;

  useEffect(() => {
    const next = preferred ?? readStoredMoneyDisplayUnit();
    setMoneyDisplayUnit(next);
    setUnit(next);
  }, [preferred]);

  return <Fragment key={unit}>{children}</Fragment>;
}
