import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { VentureDetailPage } from "@/components/pages/partners/VentureDetailPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return (
    <FeatureGate feature="partners">
      <VentureDetailPage ventureId={id} />
    </FeatureGate>
  );
}
