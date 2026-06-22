import { VentureDetailPage } from "@/components/pages/partners/VentureDetailPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <VentureDetailPage ventureId={id} />;
}
