"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button, Input } from "@heroui/react";
import {
  ArrowRight2,
  Crown,
  Edit2,
  Key,
  LogoutCurve,
  Send2,
  ShieldTick,
  Trash,
  UserMinus,
  UserTick,
} from "iconsax-reactjs";

import * as adminApi from "@/common/api/admin";
import * as insightsApi from "@/common/api/admin-insights";
import { PATHS } from "@/common/constants";
import type { AdminUserOverview } from "@/common/interfaces/admin";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";
import {
  ConfirmDialog,
  EmptyState,
  Field,
  FormDialog,
  Pill,
  PresenceDot,
  SegmentedTabs,
  SkeletonRows,
  UserAvatar,
} from "../ui/AdminUi";
import { formatDateFa, formatRelativeFa } from "../ui/admin-format";
import { UserOverviewTab } from "./UserOverviewTab";
import { UserActivityTab } from "./UserActivityTab";
import { UserDataTab } from "./UserDataTab";
import { UserSubscriptionTab } from "./UserSubscriptionTab";
import { UserSecurityTab } from "./UserSecurityTab";

type TabId = "overview" | "activity" | "data" | "subscription" | "security";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "نمای کلی" },
  { id: "activity", label: "فعالیت‌ها" },
  { id: "data", label: "داده‌ها" },
  { id: "subscription", label: "اشتراک" },
  { id: "security", label: "ورود و امنیت" },
];

type DialogId = "edit" | "password" | "admin" | "deactivate" | "revoke" | "hardDelete" | null;

export function AdminUserDetailPage({ userId }: { userId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const me = useAppSelector(userSelector);
  const initialTab = (searchParams.get("tab") as TabId | null) ?? "overview";
  const [tab, setTab] = useState<TabId>(TABS.some((item) => item.id === initialTab) ? initialTab : "overview");
  const [dataKey, setDataKey] = useState(searchParams.get("data") ?? "budgets");
  const [overview, setOverview] = useState<AdminUserOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [dialog, setDialog] = useState<DialogId>(null);
  const [busy, setBusy] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "" });
  const [password, setPassword] = useState("");

  const load = useCallback(async () => {
    try {
      const next = await insightsApi.fetchUserOverview(userId);
      setOverview(next);
      setNotFound(false);
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404 || status === 400) setNotFound(true);
      else showErrorToast(error, "دریافت اطلاعات کاربر ناموفق بود");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  function changeTab(next: TabId, key?: string) {
    setTab(next);
    if (key) setDataKey(key);
    const params = new URLSearchParams();
    params.set("tab", next);
    if (next === "data") params.set("data", key ?? dataKey);
    router.replace(`${PATHS.ADMIN_USER(userId)}?${params.toString()}`, { scroll: false });
  }

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      showToast(success, "success");
      setDialog(null);
      await load();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-36 animate-pulse rounded-2xl bg-surface-secondary" />
        <SkeletonRows rows={6} height="h-24" />
      </div>
    );
  }

  if (notFound || !overview) {
    return (
      <EmptyState
        title="کاربر پیدا نشد"
        description="ممکن است حذف دائمی شده باشد."
        action={
          <Link href={PATHS.ADMIN_USERS} className="text-sm font-semibold text-accent">
            بازگشت به فهرست کاربران
          </Link>
        }
      />
    );
  }

  const { user } = overview;
  const name = `${user.firstName} ${user.lastName}`.trim() || "بدون نام";
  const isSelf = me?._id === user._id;
  const plan = overview.subscription?.subscription?.planSnapshot;

  return (
    <div className="space-y-5">
      <Link href={PATHS.ADMIN_USERS} className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowRight2 size={16} />
        فهرست کاربران
      </Link>

      <section className="overflow-hidden rounded-2xl border border-border/60 bg-surface">
        <div className="h-20 bg-gradient-to-l from-accent/25 via-violet-400/15 to-teal-400/15" />
        <div className="px-4 pb-4 sm:px-6">
          <div className="-mt-10 flex items-end gap-4">
            <div className="rounded-full border-4 border-surface">
              <UserAvatar name={name} size={76} />
            </div>
            <div className="min-w-0 pb-1">
              <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold">
                {name}
                {user.isAdmin ? <Pill tone="info"><ShieldTick size={12} variant="Bold" />ادمین</Pill> : null}
                {user.deleted ? <Pill tone="danger">غیرفعال‌شده</Pill> : null}
                {plan && plan.slug !== "free" ? <Pill tone="warning"><Crown size={12} variant="Bold" />{plan.name}</Pill> : null}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span dir="ltr">{user.mobile}</span>
                <span className="flex items-center gap-1.5">
                  <PresenceDot lastSeenAt={user.lastSeenAt} />
                  آخرین فعالیت {formatRelativeFa(user.lastSeenAt)}
                </span>
                <span>عضو از {formatDateFa(user.createdAt)}</span>
                {user.telegramLinked ? (
                  <span className="flex items-center gap-1 text-sky-600 dark:text-sky-300">
                    <Send2 size={14} variant="Bold" />
                    تلگرام
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-4">
            <Button size="sm" variant="secondary" onPress={() => { setEditForm({ firstName: user.firstName, lastName: user.lastName }); setDialog("edit"); }}>
              <Edit2 size={16} />
              ویرایش
            </Button>
            <Button size="sm" variant="secondary" onPress={() => { setPassword(""); setDialog("password"); }}>
              <Key size={16} />
              رمز عبور
            </Button>
            {!isSelf ? (
              <>
                <Button size="sm" variant="secondary" onPress={() => setDialog("revoke")}>
                  <LogoutCurve size={16} />
                  خروج از همه دستگاه‌ها
                </Button>
                <Button size="sm" variant="secondary" onPress={() => setDialog("admin")}>
                  <ShieldTick size={16} />
                  {user.isAdmin ? "حذف دسترسی ادمین" : "ادمین کردن"}
                </Button>
                <Button size="sm" variant={user.deleted ? "secondary" : "ghost"} onPress={() => setDialog("deactivate")}>
                  {user.deleted ? <UserTick size={16} /> : <UserMinus size={16} />}
                  {user.deleted ? "فعال‌سازی مجدد" : "غیرفعال کردن"}
                </Button>
                <Button size="sm" variant="danger" onPress={() => setDialog("hardDelete")}>
                  <Trash size={16} />
                  حذف دائمی
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <SegmentedTabs items={TABS} value={tab} onChange={(next) => changeTab(next)} />

      {tab === "overview" ? (
        <UserOverviewTab overview={overview} onReload={load} onOpenData={(key) => changeTab("data", key)} />
      ) : null}
      {tab === "activity" ? <UserActivityTab userId={userId} /> : null}
      {tab === "data" ? (
        <UserDataTab userId={userId} overview={overview} activeKey={dataKey} onKeyChange={(key) => changeTab("data", key)} onChanged={load} />
      ) : null}
      {tab === "subscription" ? <UserSubscriptionTab userId={userId} onChanged={load} /> : null}
      {tab === "security" ? <UserSecurityTab overview={overview} /> : null}

      <FormDialog
        open={dialog === "edit"}
        onOpenChange={(open) => setDialog(open ? "edit" : null)}
        title="ویرایش مشخصات"
        isPending={busy}
        onSubmit={() => void run(() => adminApi.updateAdminUser(userId, editForm), "مشخصات ذخیره شد")}
      >
        <Field label="نام">
          <Input variant="secondary" value={editForm.firstName} onChange={(event) => setEditForm({ ...editForm, firstName: event.target.value })} />
        </Field>
        <Field label="نام خانوادگی">
          <Input variant="secondary" value={editForm.lastName} onChange={(event) => setEditForm({ ...editForm, lastName: event.target.value })} />
        </Field>
      </FormDialog>

      <FormDialog
        open={dialog === "password"}
        onOpenChange={(open) => setDialog(open ? "password" : null)}
        title="تنظیم رمز عبور جدید"
        description="رمز فعلی کاربر جایگزین می‌شود. رمز را از راه امن به کاربر بدهید."
        isPending={busy}
        submitDisabled={password.trim().length < 6}
        onSubmit={() => void run(() => adminApi.setAdminUserPassword(userId, password.trim()), "رمز عبور تغییر کرد")}
      >
        <Field label="رمز عبور جدید" hint="حداقل ۶ کاراکتر">
          <Input variant="secondary" dir="ltr" value={password} onChange={(event) => setPassword(event.target.value)} />
        </Field>
      </FormDialog>

      <ConfirmDialog
        open={dialog === "revoke"}
        onOpenChange={(open) => setDialog(open ? "revoke" : null)}
        title="خروج از همه دستگاه‌ها"
        description="کاربر از اپ، وب و تلگرام خارج می‌شود و باید دوباره وارد شود. داده‌ها دست نمی‌خورند."
        tone="primary"
        confirmLabel="خروج از همه"
        isPending={busy}
        onConfirm={() => void run(() => insightsApi.revokeUserSessions(userId), "کاربر از همه دستگاه‌ها خارج شد")}
      />

      <ConfirmDialog
        open={dialog === "admin"}
        onOpenChange={(open) => setDialog(open ? "admin" : null)}
        title={user.isAdmin ? "حذف دسترسی ادمین" : "اعطای دسترسی ادمین"}
        description={user.isAdmin ? "این کاربر دیگر به پنل مدیریت دسترسی نخواهد داشت." : "این کاربر به همه‌ی داده‌ها و تنظیمات پنل مدیریت دسترسی کامل پیدا می‌کند."}
        tone={user.isAdmin ? "danger" : "primary"}
        confirmLabel={user.isAdmin ? "حذف دسترسی" : "ادمین شود"}
        isPending={busy}
        onConfirm={() => void run(() => adminApi.setAdminRole(userId, !user.isAdmin), "دسترسی به‌روز شد")}
      />

      <ConfirmDialog
        open={dialog === "deactivate"}
        onOpenChange={(open) => setDialog(open ? "deactivate" : null)}
        title={user.deleted ? "فعال‌سازی مجدد حساب" : "غیرفعال کردن حساب"}
        description={
          user.deleted
            ? "کاربر دوباره می‌تواند وارد شود و همه‌ی داده‌هایش در دسترس است."
            : "کاربر فوراً از همه دستگاه‌ها خارج می‌شود و دیگر نمی‌تواند وارد شود. داده‌ها حذف نمی‌شوند و هر وقت بخواهید قابل بازگشت است."
        }
        tone={user.deleted ? "primary" : "danger"}
        confirmLabel={user.deleted ? "فعال شود" : "غیرفعال شود"}
        isPending={busy}
        onConfirm={() => void run(() => adminApi.setUserDeleted(userId, !user.deleted), user.deleted ? "حساب فعال شد" : "حساب غیرفعال شد")}
      />

      <ConfirmDialog
        open={dialog === "hardDelete"}
        onOpenChange={(open) => setDialog(open ? "hardDelete" : null)}
        title="حذف دائمی کاربر و همه داده‌ها"
        description="این کار برگشت‌ناپذیر است: کاربر، تراکنش‌ها، دسته‌بندی‌ها، بدهی‌ها، پروژه‌ها و همه‌ی داده‌های وابسته برای همیشه پاک می‌شوند. پیشنهاد می‌شود اول از دیتابیس بکاپ بگیرید."
        confirmText={user.mobile}
        confirmLabel="حذف برای همیشه"
        isPending={busy}
        onConfirm={async () => {
          setBusy(true);
          try {
            const result = await adminApi.hardDeleteAdminUser(userId, user.mobile);
            showToast(result.message, "success");
            router.replace(PATHS.ADMIN_USERS);
          } catch (error) {
            showErrorToast(error);
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
