"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { fetchUnreadSupportCount } from "@/common/api/support";

/** Number of support conversations with an admin reply the user has not read yet. */
export function useSupportUnread() {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  // Re-check on navigation, so the badge clears after the user opens /support.
  useEffect(() => {
    let cancelled = false;
    fetchUnreadSupportCount()
      .then((value) => {
        if (!cancelled) setCount(value);
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return count;
}
