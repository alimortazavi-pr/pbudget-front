"use client";

import Link from "next/link";
import { Button } from "@heroui/react";

import { PATHS } from "@/common/constants";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold text-muted">۴۰۴</p>
      <p className="text-lg font-medium">صفحه پیدا نشد</p>
      <Link href={PATHS.HOME}>
        <Button>بازگشت به خانه</Button>
      </Link>
    </div>
  );
}
