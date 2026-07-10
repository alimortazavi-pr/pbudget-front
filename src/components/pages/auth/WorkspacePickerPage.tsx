"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/react";
import {
  ArrowLeft2,
  Building,
  Home2,
  Login,
  Shield,
} from "iconsax-reactjs";

import * as authApi from "@/common/api/auth";
import { PATHS } from "@/common/constants";
import { APP_NAME_FA } from "@/common/constants/brand";
import type { PostLoginChoice } from "@/common/utils/post-auth";
import { completeWorkspaceSelection } from "@/common/utils/workspace-selection";
import { navigateWithSso, CROSS_PRODUCT } from "@/common/utils/sso";
import {
  getSuggestedChoice,
  groupWorkspaceChoices,
  shouldShowWorkspacePicker,
  sortWorkspaceGroups,
  type WorkspaceGroupId,
} from "@/common/utils/workspace-choice";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useAppSelector } from "@/stores/hooks";
import { isAuthSelector } from "@/stores/auth";
import { userSelector } from "@/stores/profile";

const GROUP_STYLES: Record<
  WorkspaceGroupId,
  { ring: string; iconBg: string; icon: typeof Home2 }
> = {
  personal: {
    ring: "ring-rose-500/30 hover:border-rose-500/50",
    iconBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    icon: Home2,
  },
  business: {
    ring: "ring-teal-500/35 hover:border-teal-500/55",
    iconBg: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
    icon: Building,
  },
  system: {
    ring: "ring-amber-500/30 hover:border-amber-500/50",
    iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    icon: Shield,
  },
};

function choiceIcon(kind: string) {
  if (kind === "admin") return Shield;
  if (kind === "invites") return Login;
  if (kind === "business" || kind === "attendance") return Building;
  return Home2;
}

export function WorkspacePickerPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const isAuth = useAppSelector(isAuthSelector);
  const user = useAppSelector(userSelector);
  const [choices, setChoices] = useState<PostLoginChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const context = await authApi.fetchPostLoginContext();
      if (!shouldShowWorkspacePicker(context.choices)) {
        const only = context.choices[0];
        if (only) {
          await completeWorkspaceSelection(only);
        }
        router.replace(context.suggestedPath || PATHS.HOME);
        return;
      }
      setChoices(context.choices);
    } catch {
      router.replace(PATHS.HOME);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isAuth) {
      router.replace(PATHS.GET_STARTED);
      return;
    }
    void load();
  }, [isAuth, load, router]);

  const groups = useMemo(
    () => sortWorkspaceGroups(groupWorkspaceChoices(choices)),
    [choices],
  );

  const suggested = useMemo(
    () => (choices.length ? getSuggestedChoice(choices) : null),
    [choices],
  );

  async function handleSelect(choice: PostLoginChoice) {
    setSelectingId(choice.id);
    try {
      await completeWorkspaceSelection(choice);
      if (choice.kind === "business" || choice.kind === "attendance") {
        const returnPath = choice.path.replace(/^https?:\/\/[^/]+/, "") || "/";
        void navigateWithSso(CROSS_PRODUCT.business, returnPath);
        return;
      }
      router.replace(choice.path);
    } finally {
      setSelectingId(null);
    }
  }

  return (
    <div className="relative min-h-dvh bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-5%,color-mix(in_oklch,var(--brand-violet)_12%,transparent),transparent)]"
      />

      <div className="relative mx-auto flex min-h-dvh max-w-3xl flex-col px-5 py-6 md:px-8 md:py-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">{APP_NAME_FA}</p>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">{t("auto.k0659078c70")}</h1>
          </div>
          <ThemeToggle />
        </div>

        <p className="mt-4 max-w-xl leading-8 text-muted">
          {user?.firstName ? `${user.firstName} عزیز، ` : ""}
          علاوه بر میز شخصی، به بخش دیگری هم دسترسی دارید. یکی را برای ادامه انتخاب کنید.
        </p>

        <div className="mt-8 flex-1 space-y-8">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-3xl bg-surface-secondary" />
              ))}
            </div>
          ) : (
            groups.map((group) => {
              const GroupIcon = GROUP_STYLES[group.id].icon;
              return (
                <section key={group.id}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`flex size-8 items-center justify-center rounded-xl ${GROUP_STYLES[group.id].iconBg}`}>
                      <GroupIcon size={18} variant="Bold" />
                    </span>
                    <div>
                      <h2 className="font-semibold">{group.title}</h2>
                      <p className="text-xs text-muted">{group.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {group.items.map((choice) => {
                      const Icon = choiceIcon(choice.kind);
                      const isSuggested = suggested?.id === choice.id;
                      const styles = GROUP_STYLES[group.id];
                      return (
                        <li key={choice.id}>
                          <button
                            type="button"
                            disabled={Boolean(selectingId)}
                            onClick={() => void handleSelect(choice)}
                            className={`flex w-full items-center gap-4 rounded-2xl border border-border bg-surface p-4 text-start shadow-sm transition hover:shadow-md disabled:opacity-70 ${styles.ring} ${isSuggested ? "ring-2" : ""}`}
                          >
                            <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${styles.iconBg}`}>
                              <Icon size={22} variant="Bold" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="block font-semibold">{choice.label}</span>
                                {isSuggested ? (
                                  <span className="rounded-full bg-accent/12 px-2 py-0.5 text-[10px] font-medium text-accent">
                                    پیشنهادی
                                  </span>
                                ) : null}
                              </span>
                              <span className="mt-1 block text-sm text-muted">{choice.description}</span>
                            </span>
                            <ArrowLeft2 size={18} className="shrink-0 text-muted" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })
          )}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <Link href={PATHS.GET_STARTED} className="text-sm text-muted transition-colors hover:text-foreground">
            خروج و تغییر حساب
          </Link>
          <Button
            variant="secondary"
            onPress={() => router.replace(PATHS.HOME)}
            isDisabled={loading || Boolean(selectingId)}
          >
            رفتن به داشبورد
          </Button>
        </div>
      </div>
    </div>
  );
}
