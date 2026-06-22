"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { Profile2User } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as partnersApi from "@/common/api/partners";
import type { IPendingPartnerInvite } from "@/common/interfaces/partner.interface";
import { showToast } from "@/common/utils/toast";

type PendingInvitesBannerProps = {
  compact?: boolean;
};

export function PendingInvitesBanner({ compact = false }: PendingInvitesBannerProps) {
  const [invites, setInvites] = useState<IPendingPartnerInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await partnersApi.fetchPendingInvites();
      setInvites(list);
    } catch {
      setInvites([]);
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

  if (loading || invites.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <Link
        href={PATHS.INVITES}
        className="glass block rounded-2xl border border-accent/30 bg-accent/5 p-4 transition hover:bg-accent/10"
      >
        <div className="flex items-center gap-3">
          <Profile2User size={22} className="text-accent" />
          <div>
            <p className="font-bold">{invites.length} دعوت همکاری در انتظار</p>
            <p className="mt-0.5 text-sm text-muted">مشاهده و تأیید دعوت‌ها</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <section className="glass space-y-3 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">دعوت‌های همکاری</h2>
        <span className="rounded-lg bg-accent/15 px-2 py-1 text-xs font-medium text-accent">
          {invites.length}
        </span>
      </div>

      {invites.map((invite) => {
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
