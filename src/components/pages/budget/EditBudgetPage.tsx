"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { fetchBudgetById } from "@/common/api/budgets";
import { PATHS } from "@/common/constants";
import type { IBudget } from "@/common/interfaces/budget.interface";
import { BudgetFormPage } from "./BudgetFormPage";

export function EditBudgetPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [budget, setBudget] = useState<IBudget | null>(null);

  useEffect(() => {
    void fetchBudgetById(params.id)
      .then((data) => setBudget(data.budget as IBudget))
      .catch(() => router.replace(PATHS.HOME));
  }, [params.id, router]);

  if (!budget) {
    return <div className="pb-shimmer h-64 w-full rounded-2xl" />;
  }

  return <BudgetFormPage budget={budget} />;
}
