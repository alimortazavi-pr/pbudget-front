import { Suspense } from "react";

import { APP_NAME_FA } from "@/common/constants/brand";
import { createPublicPageMetadata } from "@/common/seo";
import { GetStartedPage } from "@/components/pages/auth";

// The sign-up page is a useful search landing ("ثبت‌نام اپ مدیریت مالی");
// query strings (redirect targets) collapse onto the canonical URL.
export const metadata = createPublicPageMetadata({
  title: `ورود و ثبت‌نام رایگان در ${APP_NAME_FA}؛ شروع مدیریت مالی شخصی با شماره موبایل`,
  description:
    "با شماره موبایل و کد تأیید پیامکی وارد میز پردیس شوید و حسابداری شخصی، ثبت دخل و خرج، بودجه‌بندی و مدیریت اقساط و چک را رایگان شروع کنید.",
  path: "/get-started",
  keywords: ["ثبت نام اپ مدیریت مالی", "ورود میز پردیس"],
});

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <GetStartedPage />
    </Suspense>
  );
}
