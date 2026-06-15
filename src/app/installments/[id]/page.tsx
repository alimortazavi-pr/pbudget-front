import { PaymentPlanDetailPage } from "@/components/pages/planning/PaymentPlanDetailPage";

// static export (Capacitor): شناسه واقعی سمت کلاینت از useParams خوانده می‌شود.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function Page() {
  return <PaymentPlanDetailPage />;
}
