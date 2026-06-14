export const PATHS = {
  HOME: "/",
  ANALYSIS: "/analysis",
  GET_STARTED: "/get-started",
  CREATE_BUDGET: "/create-budget",
  BUDGET: (id: string) => `/budgets/${id}`,
  BOXES: "/boxes",
  PROFILE: "/profile",
  CATEGORIES: "/profile/categories",
  DEBTS: "/debts",
  INSTALLMENTS: "/installments",
  CHECKS: "/checks",
  NOTES: "/notes",
  PROJECTS: "/projects",
  PROJECT: (id: string) => `/projects/${id}`,
  /** @deprecated use INSTALLMENTS */
  PLANNING: "/planning",
} as const;
