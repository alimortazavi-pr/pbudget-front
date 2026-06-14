import { Suspense } from "react";

import { TasksPage } from "@/components/pages/tasks/TasksPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted">در حال بارگذاری…</div>}>
      <TasksPage />
    </Suspense>
  );
}
