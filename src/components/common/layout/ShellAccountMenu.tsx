"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { Call, Logout, Mobile, Moon, Profile, Sun1, Wallet2 } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import {
  CURRENCY_OPTIONS,
  DEFAULT_USER_PREFERENCES,
} from "@/common/constants/user-preferences";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";
import { getWalletBalance } from "@/common/utils/wallet-balances";
import { storage } from "@/common/utils/storage";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useBalanceModal } from "@/components/providers/BalanceModalProvider";
import { ShellNavGroup } from "@/components/common/layout/ShellNavGroup";
import {
  ACCOUNT_NAV_ITEMS,
  DOWNLOAD_NAV_ITEM,
  PLANNING_NAV_GROUPS,
  SUPPORT_PHONE,
} from "@/components/common/layout/shell-nav";
import { useTelegramStatus } from "@/common/hooks/useTelegramStatus";
import { usePendingInvitesCount } from "@/common/hooks/usePendingInvitesCount";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { logOut, resetAuth } from "@/stores/auth";
import { setProfile, userSelector } from "@/stores/profile";

type ShellAccountMenuProps = {
  onNavigate?: () => void;
  variant?: "drawer" | "sidebar";
  showPlanning?: boolean;
};

export function ShellAccountMenu({
  onNavigate,
  variant = "drawer",
  showPlanning = true,
}: ShellAccountMenuProps) {
  const { t } = useTranslation();
  const { currencyLabel } = useCurrencyLabels();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector(userSelector);
  const { theme, toggleTheme } = useTheme();
  const { linked: telegramLinked } = useTelegramStatus();
  const { count: pendingInvitesCount } = usePendingInvitesCount();
  const navBadges = useMemo(
    () =>
      pendingInvitesCount > 0
        ? { [PATHS.VENTURES]: pendingInvitesCount }
        : undefined,
    [pendingInvitesCount],
  );
  const { openBalanceModal } = useBalanceModal();

  const accountNavItems = ACCOUNT_NAV_ITEMS.filter(
    (item) => !("external" in item && item.external) || !telegramLinked,
  );

  async function handleLogout() {
    const authData = storage.getAuthData();
    const allUsers = authData?.users ?? [];
    const currentToken = authData?.token;
    const remaining = allUsers.filter((u) => u.token !== currentToken);
    const next = remaining[0] ?? null;

    if (next) {
      dispatch(logOut({ user: next, users: remaining }));
      dispatch(setProfile(next));
      storage.setAuthData({ token: next.token, users: remaining });
      onNavigate?.();
      router.refresh();
      return;
    }

    storage.clearAuthData();
    dispatch(resetAuth());
    onNavigate?.();
    router.replace(PATHS.GET_STARTED);
  }

  const utilityLinkClass =
    variant === "sidebar"
      ? "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-secondary"
      : "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-secondary";

  return (
    <>
      {variant === "drawer" ? (
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Profile size={24} variant="Bold" />
          </div>
          <div>
            <p className="font-semibold">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-muted">{user?.mobile}</p>
          </div>
        </div>
      ) : (
        <div className="mb-4 rounded-2xl border border-border/50 bg-surface-secondary/80 p-3">
          <p className="truncate text-sm font-semibold">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="truncate text-xs text-muted">{user?.mobile}</p>
        </div>
      )}

      <div
        className={
          variant === "sidebar"
            ? "mb-4 rounded-2xl border border-border/50 bg-surface-secondary/60 p-3"
            : "mb-2 rounded-2xl border border-border/50 bg-surface-secondary p-4"
        }
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Wallet2 size={18} />
            {t("common.walletBalance")}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-accent"
            onPress={() => {
              openBalanceModal();
              onNavigate?.();
            }}
          >
            {t("common.configure")}
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          {CURRENCY_OPTIONS.map((option) => {
            const amount = getWalletBalance(user, option.id);
            if (amount === 0 && option.id !== (user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency)) {
              return null;
            }
            return (
              <div key={option.id} className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-muted">{currencyLabel(option.id)}</span>
                <p className="text-base font-bold tracking-tight">
                  {formatPriceWithCurrency(amount, option.id)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {showPlanning &&
        PLANNING_NAV_GROUPS.map((group) => (
          <ShellNavGroup
            key={group.title}
            title={t(group.title)}
            items={group.items}
            variant={variant}
            onNavigate={onNavigate}
            itemBadges={navBadges}
          />
        ))}

      <ShellNavGroup
        title={t("common.userAccount")}
        items={accountNavItems}
        variant={variant}
        onNavigate={onNavigate}
      />

      <div className={variant === "sidebar" ? "mt-4" : "mt-4"}>
        <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-muted">
          {t("nav.settings")}
        </p>
        <div className="flex flex-col gap-0.5">
          <button type="button" className={utilityLinkClass} onClick={toggleTheme}>
            {theme === "dark" ? <Sun1 size={20} /> : <Moon size={20} />}
            {theme === "dark" ? t("common.lightMode") : t("common.darkMode")}
          </button>
          <a href={SUPPORT_PHONE} className={utilityLinkClass} onClick={onNavigate}>
            <Call size={20} />
            {t("common.support")}
          </a>
          {variant === "sidebar" ? (
            <Link href={DOWNLOAD_NAV_ITEM.href} className={utilityLinkClass} onClick={onNavigate}>
              <Mobile size={20} />
              {t(DOWNLOAD_NAV_ITEM.label)}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-4 border-t border-border/50 pt-3">
        <button
          type="button"
          className={`${utilityLinkClass} w-full text-danger hover:bg-danger/10`}
          onClick={() => void handleLogout()}
        >
          <Logout size={20} />
          {t("common.logout")}
        </button>
      </div>
    </>
  );
}
