"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";

import * as businessApi from "@/common/api/business";
import type { IPendingBusinessInvite } from "@/common/interfaces/business.interface";
import { PATHS } from "@/common/constants";

export function PendingBusinessInvitesBanner() {
  const [invites, setInvites] = useState<IPendingBusinessInvite[]>([]);

  const load = useCallback(async () => {
    try {
      const list = await businessApi.fetchPendingBusinessInvites();
      setInvites(list);
    } catch {
      /* optional */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!invites.length) return null;

  return (
    <section className="glass space-y-3 rounded-2xl border border-violet-200 p-4 dark:border-violet-800">
      <p className="text-sm font-medium">دعوت‌های کسب‌وکار</p>
      {invites.map((inv) => (
        <div
          key={inv.id}
          className="flex flex-wrap items-center justify-between gap-2 text-sm"
        >
          <span>
            {inv.businessTitle} — نقش: {inv.preset}
          </span>
          {inv.inviteLink ? (
            <Link href={inv.inviteLink.replace(/^https?:\/\/[^/]+/, "")}>
              <Button size="sm">مشاهده دعوت</Button>
            </Link>
          ) : (
            <Link href={PATHS.BUSINESS}>
              <Button size="sm">کسب‌وکارهای من</Button>
            </Link>
          )}
        </div>
      ))}
    </section>
  );
}
