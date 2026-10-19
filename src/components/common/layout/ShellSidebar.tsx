"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Add, Lock1 } from "iconsax-reactjs";

import { SiteFooterCredits } from "@/components/common/brand/SiteFooterCredits";
import { ShellAccountMenu } from "@/components/common/layout/ShellAccountMenu";
import { ShellNavGroup } from "@/components/common/layout/ShellNavGroup";
import {
  CREATE_NAV_ITEM,
  BANK_IMPORT_NAV_ITEM,
  PLANNING_NAV_GROUPS,
  PRIMARY_NAV_ITEMS,
  withOptionalModules,
} from "@/components/common/layout/shell-nav";
import { PATHS } from "@/common/constants";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";
import { usePendingInvitesCount } from "@/common/hooks/usePendingInvitesCount";
import { useSupportUnread } from "@/common/hooks/useSupportUnread";
import { AppLogo } from "@/components/common/brand/AppLogo";
import { useTranslation } from "@/i18n";
import { useSubscriptionAccess } from "@/components/providers/SubscriptionAccessProvider";

export function ShellSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { loading: subscriptionLoading, isFeatureEnabled } = useSubscriptionAccess();
  const { count: pendingInvitesCount } = usePendingInvitesCount();
  const supportUnread = useSupportUnread();
  const navBadges = useMemo(() => {
    const badges: Record<string, number> = {};
    if (pendingInvitesCount > 0) badges[PATHS.VENTURES] = pendingInvitesCount;
    if (supportUnread > 0) badges[PATHS.SUPPORT] = supportUnread;
    return Object.keys(badges).length > 0 ? badges : undefined;
  }, [pendingInvitesCount, supportUnread]);
  const navItems = PRIMARY_NAV_ITEMS;
  const user = useAppSelector(userSelector);
  const planningGroups = withOptionalModules(PLANNING_NAV_GROUPS, user?.features);

  return (
    <aside className="pb-sidebar" aria-label={t("common.desktopNavigation")} data-tour="sidebar">
      <div className="flex h-full flex-col overflow-y-auto p-5 xl:p-6">
        <Link href={PATHS.HOME} className="mb-6 block px-2">
          <AppLogo />
        </Link>

        <div data-tour="nav-primary">
          <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-muted">
            {t("nav.primary")}
          </p>
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const active =
                item.href === PATHS.HOME
                   ? pathname === PATHS.HOME
                  : pathname.startsWith(item.href);
              const featureKey = "featureKey" in item ? item.featureKey : undefined;
              const featureLocked = Boolean(featureKey && !subscriptionLoading && isFeatureEnabled(featureKey) === false);
              const content = (
                <>
                  {featureLocked ? <Lock1 size={18} variant="Bold" /> : <item.icon size={20} variant={active ? "Bold" : "Linear"} />}
                  <span>{t(item.label)}</span>
                </>
              );

              if (featureLocked) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="pb-sidebar-link opacity-70"
                    data-active={active ? "true" : "false"}
                    title={t("common.subscription.notForYourPlan")}
                    data-tour={`nav-${item.href.replace(/\//g, "") || "home"}`}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="pb-sidebar-link"
                  data-active={active ? "true" : "false"}
                  data-tour={`nav-${item.href.replace(/\//g, "") || "home"}`}
                >
                  {content}
                </Link>
              );
            })}
          </nav>
        </div>

        <Link
          href={CREATE_NAV_ITEM.href}
          className="pb-sidebar-cta mt-4"
          data-tour="nav-create"
        >
          <Add size={20} variant="Bold" />
          {t(CREATE_NAV_ITEM.label)}
        </Link>

        {BANK_IMPORT_NAV_ITEM.featureKey && !subscriptionLoading && !isFeatureEnabled(BANK_IMPORT_NAV_ITEM.featureKey) ? (
          <Link
            href={BANK_IMPORT_NAV_ITEM.href}
            className="pb-sidebar-secondary-cta mt-2 opacity-70"
            data-tour="nav-bank-import-cta"
            title={t("common.subscription.notForYourPlan")}
          >
            <Lock1 size={18} variant="Bold" />
            {t(BANK_IMPORT_NAV_ITEM.label)}
          </Link>
        ) : (
          <Link href={BANK_IMPORT_NAV_ITEM.href} className="pb-sidebar-secondary-cta mt-2" data-tour="nav-bank-import-cta">
            <BANK_IMPORT_NAV_ITEM.icon size={18} variant="Bold" />
            {t(BANK_IMPORT_NAV_ITEM.label)}
          </Link>
        )}

        {planningGroups.map((group) => (
          <ShellNavGroup
            key={group.title}
            title={t(group.title)}
            items={group.items}
            variant="sidebar"
            itemBadges={navBadges}
            tourId={`nav-group-${group.title.replace("nav.", "")}`}
          />
        ))}

        <div className="min-h-4 shrink-0" aria-hidden />

        <div className="mt-auto border-t border-border/50 pt-5 flex flex-col gap-2" data-tour="sidebar-account">
          {/* The sidebar already lists the planning groups (and the account
              menu has the download link), so the account menu must not draw
              them a second time. */}
          <ShellAccountMenu variant="sidebar" showPlanning={false} />
          <SiteFooterCredits compact className="pt-3" />
        </div>
      </div>
    </aside>
  );
}
