import { EditBudgetPage } from "@/components/pages/budget/EditBudgetPage";

// static export (Capacitor): مسیر داینامیک باید پارامتر ثابت داشته باشد.
// شناسه واقعی سمت کلاینت از useParams خوانده می‌شود، پس placeholder کافی است.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function Page() {
  return <EditBudgetPage />;
}
