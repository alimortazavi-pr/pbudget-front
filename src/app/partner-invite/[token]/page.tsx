import { PartnerInvitePage } from "@/components/pages/partners/PartnerInvitePage";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function Page({ params }: PageProps) {
  const { token } = await params;
  return <PartnerInvitePage token={token} />;
}
