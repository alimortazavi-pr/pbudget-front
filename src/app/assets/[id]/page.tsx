import { AssetDetailPage } from "@/components/pages/assets/AssetDetailPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <AssetDetailPage assetId={id} />;
}
