"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import {
  Call,
  Category,
  Logout,
  Moon,
  Profile,
  Sun1,
  Wallet2,
} from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import { formatPrice } from "@/common/utils";
import { storage } from "@/common/utils/storage";
import { useTheme } from "@/components/providers/ThemeProvider";
import { ChangeBalanceModal } from "@/components/pages/profile/ChangeBalanceModal";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { logOut, resetAuth } from "@/stores/auth";
import { setProfile, userSelector } from "@/stores/profile";

type ShellAccountMenuProps = {
  onNavigate?: () => void;
  variant?: "drawer" | "sidebar";
};

export function ShellAccountMenu({
  onNavigate,
  variant = "drawer",
}: ShellAccountMenuProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector(userSelector);
  const { theme, toggleTheme } = useTheme();

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

  const linkClass =
    variant === "sidebar"
      ? "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-secondary"
      : "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 hover:bg-surface-secondary";

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
            : "mb-4 rounded-2xl border border-border/50 bg-surface-secondary p-4"
        }
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Wallet2 size={18} />
            موجودی کیف پول
          </div>
          <ChangeBalanceModal
            trigger={
              <Button size="sm" variant="ghost" className="text-accent">
                ویرایش
              </Button>
            }
          />
        </div>
        <p
          className={
            variant === "sidebar"
              ? "mt-2 text-xl font-bold tracking-tight"
              : "mt-2 text-2xl font-bold tracking-tight"
          }
        >
          {formatPrice(user?.budget ?? 0)}{" "}
          <span className="text-sm font-normal text-muted">تومان</span>
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <Link
          href={PATHS.CATEGORIES}
          onClick={onNavigate}
          className={linkClass}
        >
          <Category size={20} />
          دسته‌بندی‌ها
        </Link>
        <Link
          href={PATHS.PROFILE}
          onClick={onNavigate}
          className={linkClass}
        >
          <Profile size={20} />
          پروفایل
        </Link>
        <button
          type="button"
          className={linkClass}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun1 size={20} /> : <Moon size={20} />}
          {theme === "dark" ? "حالت روشن" : "حالت تاریک"}
        </button>
        <a href="tel:02112345678" className={linkClass}>
          <Call size={20} />
          پشتیبانی
        </a>
        <button
          type="button"
          className={`${linkClass} text-danger hover:bg-danger/10`}
          onClick={() => void handleLogout()}
        >
          <Logout size={20} />
          خروج از حساب
        </button>
      </div>
    </>
  );
}
