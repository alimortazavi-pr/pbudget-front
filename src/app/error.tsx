"use client";

import { useEffect } from "react";
import { Button } from "@heroui/react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="text-sm font-medium text-accent">خطای موقت</p>
      <h1 className="text-2xl font-bold">این بخش درست بارگذاری نشد</h1>
      <p className="text-sm leading-7 text-muted">
        اطلاعات شما از بین نرفته است. اتصال را بررسی کنید و دوباره تلاش کنید.
      </p>
      <Button onPress={unstable_retry}>تلاش دوباره</Button>
    </main>
  );
}
