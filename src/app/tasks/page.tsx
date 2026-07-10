"use client";

import { Suspense } from "react";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { TasksPage } from "@/components/pages/tasks/TasksPage";

function TasksLoading() {
  const { t } = useTranslation();
  return (
    <div className="p-6 text-center text-muted">{t("common.loading")}</div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<TasksLoading />}>
      <TasksPage />
    </Suspense>
  );
}
