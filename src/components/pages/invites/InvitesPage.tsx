"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import {
  Building,
  Calendar,
  CloseCircle,
  Profile2User,
  TickCircle,
} from "iconsax-reactjs";

import * as businessApi from "@/common/api/business";
import * as partnersApi from "@/common/api/partners";
import { PATHS } from "@/common/constants";
import type { IPendingBusinessInvite } from "@/common/interfaces/business.interface";
import type { IPendingPartnerInvite } from "@/common/interfaces/partner.interface";
import { notifyPendingInvitesChanged } from "@/common/hooks/usePendingInvitesCount";
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

type UnifiedInvite =
  | { type: "business"; data: IPendingBusinessInvite; token: string | null }
  | { type: "partner"; data: IPendingPartnerInvite; token: string | null };

export function InvitesPage() {
  const [partnerInvites, setPartnerInvites] = useState<IPendingPartnerInvite[]>(
    [],
  );
  const [businessInvites, setBusinessInvites] = useState<
    IPendingBusinessInvite[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [partners, business] = await Promise.all([
        partnersApi.fetchPendingInvites(),
        businessApi.fetchPendingBusinessInvites(),
      ]);
      setPartnerInvites(partners);
      setBusinessInvites(business);
      notifyPendingInvitesChanged();
    } catch {
      setPartnerInvites([]);
      setBusinessInvites([]);
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
      showToast("دعوت همکاری تأیید شد", "success");
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setActingId(null);
    }
  }

  async function declinePartner(token: string, id: string) {
    setActingId(id);
    try {
      await partnersApi.declinePartnerInvite(token);
      showToast("دعوت رد شد", "success");
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setActingId(null);
    }
  }

  async function acceptBusiness(token: string, id: string) {
    setActingId(id);
    try {
      const res = await businessApi.acceptBusinessInvite(token);
      showToast("دعوت کسب‌وکار تأیید شد", "success");
      window.location.href = PATHS.BUSINESS_DETAIL(res.businessId);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setActingId(null);
    }
  }

  async function declineBusiness(token: string, id: string) {
    setActingId(id);
    try {
      await businessApi.declineBusinessInvite(token);
      showToast("دعوت رد شد", "success");
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setActingId(null);
    }
  }

  const unified: UnifiedInvite[] = [
    ...businessInvites.map((data) => ({
      type: "business" as const,
      data,
      token: extractToken(data.inviteLink),
    })),
    ...partnerInvites.map((data) => ({
      type: "partner" as const,
      data,
      token: extractToken(data.inviteLink),
    })),
  ];

  return (
    <div className="space-y-5 pb-6" data-tour="invites-list">
      <section className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white shadow-lg">
        <h1 className="text-2xl font-bold">دعوت‌ها</h1>
        <p className="mt-2 text-sm text-white/85">
          دعوت‌های پرسنلی کسب‌وکار و همکاری پروژه — بپذیرید یا رد کنید
        </p>
        {!loading ? (
          <p className="mt-3 text-xs text-white/70">
            {toPersianDigits(String(unified.length))} دعوت در انتظار
          </p>
        ) : null}
      </section>

      {loading ? (
        <div className="glass rounded-2xl p-10 text-center text-muted">
          در حال بارگذاری…
        </div>
      ) : unified.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Profile2User size={40} className="mx-auto text-muted" />
          <p className="mt-4 text-muted">دعوت در انتظاری ندارید</p>
          <Link href={PATHS.HOME} className="mt-4 inline-block text-sm text-accent">
            بازگشت به داشبورد
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {unified.map((item) => {
            const id =
              item.type === "business" ? item.data.id : item.data._id;
            const isBusiness = item.type === "business";
            const title = isBusiness
              ? item.data.businessTitle
              : item.data.contextTitle;
            const subtitle = isBusiness
              ? `نقش: ${item.data.preset} · ${item.data.displayName}`
              : `از طرف ${item.data.ownerName}${
                  item.data.sharePercent > 0
                    ? ` · سهم ${toPersianDigits(String(item.data.sharePercent))}٪`
                    : ""
                }`;
            const detailPath = invitePath(
              isBusiness ? item.data.inviteLink : item.data.inviteLink ?? null,
            );
            const expiresAt = item.data.expiresAt;

            return (
              <article
                key={`${item.type}-${id}`}
                className="glass overflow-hidden rounded-2xl border border-border/60"
              >
                <div className="flex items-start gap-3 border-b border-border/40 bg-surface-secondary/50 p-4">
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                      isBusiness
                        ? "bg-violet-500/15 text-violet-600"
                        : "bg-rose-500/15 text-rose-600"
                    }`}
                  >
                    {isBusiness ? <Building size={22} /> : <Profile2User size={22} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold">{title}</h2>
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                        {isBusiness ? "کسب‌وکار" : "همکاری"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{subtitle}</p>
                    {expiresAt ? (
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted">
                        <Calendar size={14} />
                        انقضا: {formatExpiry(expiresAt)}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 p-4">
                  {item.token ? (
                    <>
                      <Button
                        size="sm"
                        onPress={() =>
                          void (isBusiness
                            ? acceptBusiness(item.token!, id)
                            : acceptPartner(item.token!, id))
                        }
                        isPending={actingId === id}
                      >
                        <TickCircle size={16} />
                        پذیرش
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onPress={() =>
                          void (isBusiness
                            ? declineBusiness(item.token!, id)
                            : declinePartner(item.token!, id))
                        }
                        isPending={actingId === id}
                      >
                        <CloseCircle size={16} />
                        رد
                      </Button>
                    </>
                  ) : null}
                  {detailPath ? (
                    <Link href={detailPath}>
                      <Button size="sm" variant="ghost">
                        جزئیات و لینک مستقیم
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
