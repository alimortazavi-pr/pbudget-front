"use client";

import { Fragment, type ReactNode, useEffect } from "react";
import { DEFAULT_USER_PREFERENCES } from "@/common/constants/user-preferences";
import { setMoneyDisplayUnit } from "@/common/utils/money-display";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

export function MoneyDisplayBoundary({ children }: { children: ReactNode }) {
  const user = useAppSelector(userSelector);
  const unit =
    user?.preferences?.moneyDisplayUnit ??
    DEFAULT_USER_PREFERENCES.moneyDisplayUnit;

  useEffect(() => {
    setMoneyDisplayUnit(unit);
  }, [unit]);

  return <Fragment key={unit}>{children}</Fragment>;
}
