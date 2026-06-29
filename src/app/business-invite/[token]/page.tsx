import { BusinessInvitePage } from "@/components/pages/business/BusinessInvitePage";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function Page({ params }: PageProps) {
  const { token } = await params;
  return <BusinessInvitePage token={token} />;
}
