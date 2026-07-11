"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import {
  Calendar,
  CloseCircle,
  Profile2User,
  TickCircle,
} from "iconsax-reactjs";

import * as partnersApi from "@/common/api/partners";
import { PATHS } from "@/common/constants";
import type { IPendingPartnerInvite } from "@/common/interfaces/partner.interface";
import { notifyPendingInvitesChanged } from "@/common/hooks/usePendingInvitesCount";
import { PageHeroSection } from "@/components/common/layout/PageHeroSection";
import { toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";

function formatExpiry(expiresAt: string) {
  try {
    return new Date(expiresAt).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return expiresAt;
  }
}

function extractToken(link: string | null | undefined) {

  if (!link) return null;
  const parts = link.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? null;
}

function invitePath(link: string | null | undefined) {
  if (!link) return null;
  if (link.startsWith("/")) return link;
  try {
    const url = new URL(link);
    return `${url.pathname}${url.search}`;
  } catch {
    return link;
  }
}

export function InvitesPage() {
  const { t } = useTranslation();
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

  async function acceptPartner(token: string, id: string) {
    setActingId(id);
    try {
      await partnersApi.acceptPartnerInvite(token);
      showToast(t("auto.kcea98e90e2"), "success");
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("pages.invites.loadError"));
    } finally {
      setActingId(null);
    }
  }

  async function declinePartner(token: string, id: string) {
    setActingId(id);
    try {
      await partnersApi.declinePartnerInvite(token);
      showToast(t("auto.kbaa8f3b1c7"), "success");
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("pages.invites.loadError"));
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-5 pb-6" data-tour="invites-list">
      <PageHeroSection
        variant="violetDeep"
        title={t("pageHero.invites.title")}
        description={t("pageHero.invites.description")}
        descriptionClassName="mt-2 text-sm text-white/85"
        titleClassName="text-2xl font-bold"
        footer={
          !loading ? (
            <p className="mt-3 text-xs text-white/70">
              {t("pageHero.invites.pendingCount", { count: partnerInvites.length })}
            </p>
          ) : null
        }
      />

      {loading ? (
        <div className="glass rounded-2xl p-10 text-center text-muted">
          {t("common.loading")}
        </div>
      ) : partnerInvites.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Profile2User size={40} className="mx-auto text-muted" />
          <p className="mt-4 text-muted">{t("auto.k172aaa97a3")}</p>
          <Link href={PATHS.HOME} className="mt-4 inline-block text-sm text-accent">
            {t("auto.k63d6c2c2ab")}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {partnerInvites.map((item) => {
            const id = item._id;
            const token = extractToken(item.inviteLink);
            const detailPath = invitePath(item.inviteLink ?? null);

            return (
              <article
                key={id}
                className="glass overflow-hidden rounded-2xl border border-border/60"
              >
                <div className="flex items-start gap-3 border-b border-border/40 bg-surface-secondary/50 p-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600">
                    <Profile2User size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold">{item.contextTitle}</h2>
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                        {t("auto.kdd0a6a4b66")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {t("auto.k24ea740db4")}{item.ownerName}
                      {item.sharePercent > 0
                        ? t("pages.invites.sharePercent", {
                            percent: toPersianDigits(String(item.sharePercent)),
                          })
                        : ""}
                    </p>
                    {item.expiresAt ? (
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted">
                        <Calendar size={14} />
                        {t("auto.k91c4fa24ce")}{formatExpiry(item.expiresAt)}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 p-4">
                  {token ? (
                    <>
                      <Button
                        size="sm"
                        onPress={() => void acceptPartner(token, id)}
                        isPending={actingId === id}
                      >
                        <TickCircle size={16} />
                        {t("auto.kff24a8f243")}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => void declinePartner(token, id)}
                        isPending={actingId === id}
                      >
                        <CloseCircle size={16} />
                        {t("auto.kfa384f7e8b")}
                      </Button>
                    </>
                  ) : null}
                  {detailPath ? (
                    <Link href={detailPath}>
                      <Button size="sm" variant="ghost">
                        {t("auto.k965db97fef")}
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
