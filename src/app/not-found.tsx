"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { useEffect, useState } from "react";

import { PATHS } from "@/common/constants";
import { createTranslator, type Language } from "@/i18n";

export default function NotFound() {
  const [t, setT] = useState(() => createTranslator("fa", false));

  useEffect(() => {
    const saved = localStorage.getItem("pb_lang") as Language | null;
    if (saved === "fa" || saved === "en" || saved === "ar") {
      setT(() => createTranslator(saved, true));
    }
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold text-muted">{t("۴۰۴")}</p>
      <p className="text-lg font-medium">{t("صفحه پیدا نشد")}</p>
      <Link href={PATHS.HOME}>
        <Button>{t("بازگشت به خانه")}</Button>
      </Link>
    </div>
  );
}
