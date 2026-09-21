"use client";

import type { ReactNode } from "react";

type SimpleModeGuardProps = {
  children: ReactNode;
};

export function SimpleModeGuard({ children }: SimpleModeGuardProps) {
  // Display modes are presentation choices, not permission boundaries. A user
  // must still be able to open reports, debts, projects, or any deep link from
  // an HMI action without being redirected back to the dashboard.
  return children;
}
