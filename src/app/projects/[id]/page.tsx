import { ProjectDetailPage } from "@/components/pages/projects/ProjectDetailPage";

// static export (Capacitor): شناسه واقعی سمت کلاینت از useParams خوانده می‌شود.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function Page() {
  return <ProjectDetailPage />;
}
