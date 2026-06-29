import { BusinessWorkspaceLayout } from "@/components/pages/business/BusinessWorkspaceLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <BusinessWorkspaceLayout>{children}</BusinessWorkspaceLayout>;
}
