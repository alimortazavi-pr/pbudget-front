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
} as const;
