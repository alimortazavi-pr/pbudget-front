"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button, Input } from "@heroui/react";
import { ArrowLeft2, Crown, People, Send2, ShieldTick, UserAdd } from "iconsax-reactjs";

import * as insightsApi from "@/common/api/admin-insights";
import type { AdminUserSegment, AdminUserSort } from "@/common/api/admin-insights";
import { PATHS } from "@/common/constants";
import type { AdminUserRowsResponse } from "@/common/interfaces/admin";
import { showErrorToast, showToast } from "@/common/utils/toast";
import {
  AdminPageHeader,
  AdminPanel,
  EmptyState,
  Field,
  FormDialog,
  NativeSelect,
  PaginationBar,
  Pill,
  PresenceDot,
  SearchField,
  SegmentedTabs,
  SkeletonRows,
  UserAvatar,
} from "./ui/AdminUi";
import { formatDateFa, formatMoneyFa, formatNumberFa, formatRelativeFa } from "./ui/admin-format";

const SEGMENTS: { id: AdminUserSegment; label: string }[] = [
  { id: "active", label: "همه فعال‌ها" },
  { id: "online", label: "فعال امروز" },
  { id: "inactive", label: "غیرفعال +۳۰ روز" },
  { id: "never", label: "هرگز وارد نشده" },
  { id: "telegram", label: "تلگرام متصل" },
  { id: "no_password", label: "بدون رمز" },
  { id: "admins", label: "ادمین‌ها" },
  { id: "deleted", label: "غیرفعال‌شده" },
];

const SORTS: { value: AdminUserSort; label: string }[] = [
  { value: "newest", label: "جدیدترین ثبت‌نام" },
  { value: "last_seen", label: "آخرین فعالیت" },
  { value: "last_login", label: "آخرین ورود" },
  { value: "oldest", label: "قدیمی‌ترین" },
  { value: "name", label: "نام" },
];

export function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSegment = (searchParams.get("segment") as AdminUserSegment | null) ?? "active";
  const [segment, setSegment] = useState<AdminUserSegment>(
    SEGMENTS.some((item) => item.id === initialSegment) ? initialSegment : "active",
  );
  const [sort, setSort] = useState<AdminUserSort>("newest");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminUserRowsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await insightsApi.fetchUsers({ page, limit: 20, search, segment, sort }));
    } catch (error) {
      showErrorToast(error, "دریافت کاربران ناموفق بود");
    } finally {
      setLoading(false);
    }
  }, [page, search, segment, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="کاربران"
        description="جستجو، فیلتر و ورود به پرونده کامل هر کاربر: فعالیت‌ها، داده‌ها، اشتراک و تنظیمات حساب."
        icon={<People size={24} variant="Bold" />}
        actions={
          <Button size="sm" onPress={() => setCreateOpen(true)}>
            <UserAdd size={17} />
            کاربر جدید
          </Button>
        }
      />

      <AdminPanel bodyClassName="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <SearchField
            className="md:max-w-md md:flex-1"
            value={search}
            placeholder="نام، موبایل یا شناسه کاربر…"
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
          <NativeSelect
            ariaLabel="مرتب‌سازی"
            className="md:w-52"
            value={sort}
            options={SORTS}
            onChange={(value) => {
              setSort(value as AdminUserSort);
              setPage(1);
            }}
          />
          {data ? (
            <span className="text-sm text-muted md:ms-auto">{formatNumberFa(data.pagination.total)} کاربر</span>
          ) : null}
        </div>
        <SegmentedTabs
          size="sm"
          items={SEGMENTS}
          value={segment}
          onChange={(value) => {
            setSegment(value);
            setPage(1);
            router.replace(`${PATHS.ADMIN_USERS}?segment=${value}`, { scroll: false });
          }}
        />

        {loading && !data ? (
          <SkeletonRows rows={8} height="h-16" />
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon={<People size={36} />} title="کاربری پیدا نشد" description="فیلتر یا عبارت جستجو را تغییر دهید." />
        ) : (
          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <div className="hidden overflow-x-auto rounded-xl border border-border/60 md:block">
              <table className="w-full min-w-[880px] text-sm">
                <thead className="bg-surface-secondary/60 text-xs text-muted">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">کاربر</th>
                    <th className="px-4 py-3 text-start font-medium">آخرین فعالیت</th>
                    <th className="px-4 py-3 text-start font-medium">اشتراک</th>
                    <th className="px-4 py-3 text-start font-medium">تراکنش‌ها</th>
                    <th className="px-4 py-3 text-start font-medium">موجودی</th>
                    <th className="px-4 py-3 text-start font-medium">عضویت</th>
                    <th className="px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((user) => {
                    const name = `${user.firstName} ${user.lastName}`.trim() || "بدون نام";
                    return (
                      <tr
                        key={user._id}
                        className="cursor-pointer border-t border-border/50 transition hover:bg-surface-secondary/40"
                        onClick={() => router.push(PATHS.ADMIN_USER(user._id))}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={name} size={36} />
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 font-semibold">
                                <span className="truncate">{name}</span>
                                {user.isAdmin ? <ShieldTick size={15} className="text-violet-500" variant="Bold" /> : null}
                                {user.telegramLinked ? <Send2 size={14} className="text-sky-500" variant="Bold" /> : null}
                              </p>
                              <p className="text-xs text-muted" dir="ltr">{user.mobile}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2">
                            <PresenceDot lastSeenAt={user.lastSeenAt} />
                            <span className="text-xs">{formatRelativeFa(user.lastSeenAt)}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {user.deleted ? (
                            <Pill tone="danger">غیرفعال‌شده</Pill>
                          ) : user.plan && user.plan.slug !== "free" ? (
                            <Pill tone="warning">
                              <Crown size={12} variant="Bold" />
                              {user.plan.name}
                            </Pill>
                          ) : (
                            <Pill>رایگان</Pill>
                          )}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          <p>{formatNumberFa(user.transactionCount ?? 0)}</p>
                          {user.lastTransactionAt ? (
                            <p className="text-[11px] text-muted">آخرین: {formatRelativeFa(user.lastTransactionAt)}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 tabular-nums">{formatMoneyFa(user.walletBalances?.toman ?? user.budget ?? 0)}</td>
                        <td className="px-4 py-3 text-xs text-muted">{formatDateFa(user.createdAt)}</td>
                        <td className="px-2 py-3 text-muted">
                          <ArrowLeft2 size={16} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="space-y-2 md:hidden">
              {data.items.map((user) => {
                const name = `${user.firstName} ${user.lastName}`.trim() || "بدون نام";
                return (
                  <li key={user._id}>
                    <Link href={PATHS.ADMIN_USER(user._id)} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                      <UserAvatar name={name} size={42} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 font-semibold">
                          <span className="truncate">{name}</span>
                          {user.isAdmin ? <ShieldTick size={14} className="text-violet-500" variant="Bold" /> : null}
                        </p>
                        <p className="text-xs text-muted" dir="ltr">{user.mobile}</p>
                        <p className="mt-1 flex items-center gap-2 text-[11px] text-muted">
                          <PresenceDot lastSeenAt={user.lastSeenAt} />
                          {formatRelativeFa(user.lastSeenAt)} · {formatNumberFa(user.transactionCount ?? 0)} تراکنش
                        </p>
                      </div>
                      {user.plan && user.plan.slug !== "free" ? <Pill tone="warning">{user.plan.name}</Pill> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <PaginationBar pagination={data.pagination} onPage={setPage} />
          </div>
        )}
      </AdminPanel>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => {
          setCreateOpen(false);
          router.push(PATHS.ADMIN_USER(id));
        }}
      />
    </div>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const [form, setForm] = useState({ firstName: "", lastName: "", mobile: "", password: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ firstName: "", lastName: "", mobile: "", password: "" });
  }, [open]);

  async function submit() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.mobile.trim()) {
      showToast("نام، نام خانوادگی و موبایل الزامی است", "warning");
      return;
    }
    setSaving(true);
    try {
      const user = await insightsApi.createUser({
        firstName: form.firstName,
        lastName: form.lastName,
        mobile: form.mobile,
        password: form.password || undefined,
      });
      showToast("کاربر ساخته شد", "success");
      onCreated(user._id);
    } catch (error) {
      showErrorToast(error, "ساخت کاربر ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="ساخت کاربر جدید" description="کاربر می‌تواند با همین شماره و رمز وارد شود." isPending={saving} onSubmit={() => void submit()} submitLabel="ساخت کاربر">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="نام">
          <Input variant="secondary" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
        </Field>
        <Field label="نام خانوادگی">
          <Input variant="secondary" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
        </Field>
      </div>
      <Field label="موبایل">
        <Input variant="secondary" dir="ltr" inputMode="tel" placeholder="09123456789" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} />
      </Field>
      <Field label="رمز عبور (اختیاری)" hint="حداقل ۶ کاراکتر. اگر خالی بماند، کاربر باید با تأیید تلگرام رمز بسازد.">
        <Input variant="secondary" dir="ltr" type="text" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
      </Field>
    </FormDialog>
  );
}
