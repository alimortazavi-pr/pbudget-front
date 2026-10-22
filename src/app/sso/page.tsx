import { Suspense } from "react";

import { SsoPage } from "@/components/pages/sso/SsoPage";

export default function Page() {
  return (
    <Suspense>
      <SsoPage />
    </Suspense>
  );
}
