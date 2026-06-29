"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import * as partnersApi from "@/common/api/partners";
import type { IPendingPartnerInvite } from "@/common/interfaces/partner.interface";
import { notifyPendingInvitesChanged } from "@/common/hooks/usePendingInvitesCount";
import { showToast } from "@/common/utils/toast";

type PendingInvitesBannerProps = {
  compact?: boolean;
};

export function PendingInvitesBanner({ compact = false }: PendingInvitesBannerProps) {
  const [partnerInvites, setPartnerInvites] = useState<IPendingPartnerInvite[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const partners = await partnersApi.fetchPendingInvites();
      setPartnerInvites(partners);
      notifyPendingInvitesChanged();
    } catch {
      setPartnerInvites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function acceptFromToken(token: string, inviteId: string) {
    setActingId(inviteId);
    try {
      await partnersApi.acceptPartnerInvite(token);
      showToast("دعوت تأیید شد", "success");
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در تأیید");
    } finally {
      setActingId(null);
    }
  }

  if (loading || partnerInvites.length === 0) {
    return null;
  }

  if (compact) {
    return null;
  }

  return (
    <section className="glass space-y-3 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">دعوت‌های در انتظار</h2>
        <span className="rounded-lg bg-accent/15 px-2 py-1 text-xs font-medium text-accent">
          {partnerInvites.length}
        </span>
      </div>

      {partnerInvites.map((invite) => {
        const token = invite.inviteLink?.split("/").pop();
        return (
          <article
            key={invite._id}
            className="rounded-xl bg-surface-secondary p-3"
          >
            <p className="font-medium">{invite.contextTitle}</p>
            <p className="mt-1 text-sm text-muted">
              از طرف {invite.ownerName}
              {invite.sharePercent > 0 ? ` · سهم ${invite.sharePercent}٪` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {token ? (
                <Button
                  size="sm"
                  onPress={() => void acceptFromToken(token, invite._id)}
                  isPending={actingId === invite._id}
                >
                  تأیید
                </Button>
              ) : null}
              {invite.inviteLink ? (
                <Link href={invite.inviteLink}>
                  <Button size="sm" variant="secondary">
                    جزئیات
                  </Button>
                </Link>
              ) : null}
            </div>
          </article>
        );
      })}
    </section>
  );
}
