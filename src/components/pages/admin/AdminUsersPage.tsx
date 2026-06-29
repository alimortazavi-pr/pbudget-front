"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Modal, Switch } from "@heroui/react";
import { Edit2, Lock, SearchNormal1, ShieldTick, Trash } from "iconsax-reactjs";

import * as adminApi from "@/common/api/admin";
import type { AdminUser } from "@/common/interfaces/admin";
import { formatPrice, toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    budget: 0,
    isVerifiedMobile: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.fetchAdminUsers({
        page,
        limit: 15,
        search,
        includeDeleted,
      });
      setUsers(data.items);
      setTotalPages(data.pagination.totalPages);
    } catch {
      showToast("بارگذاری کاربران ناموفق بود", "danger");
    } finally {
      setLoading(false);
    }
  }, [page, search, includeDeleted]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEdit = (user: AdminUser) => {
    setEditing(user);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      budget: user.budget,
      isVerifiedMobile: user.isVerifiedMobile,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await adminApi.updateAdminUser(editing._id, editForm);
      showToast("کاربر به‌روزرسانی شد", "success");
      setEditing(null);
      void load();
    } catch {
      showToast("ذخیره ناموفق بود", "danger");
    }
  };

  const toggleAdmin = async (user: AdminUser) => {
    try {
      await adminApi.setAdminRole(user._id, !user.isAdmin);
      showToast("نقش ادمین تغییر کرد", "success");
      void load();
    } catch {
      showToast("تغییر نقش ناموفق بود", "danger");
    }
  };

  const toggleDeleted = async (user: AdminUser) => {
    try {
      await adminApi.setUserDeleted(user._id, !user.deleted);
      showToast(user.deleted ? "کاربر بازیابی شد" : "کاربر حذف شد", "success");
      void load();
    } catch {
      showToast("عملیات ناموفق بود", "danger");
    }
  };

  const openPassword = (user: AdminUser) => {
    setPasswordUser(user);
    setNewPassword("");
  };

  const savePassword = async () => {
    if (!passwordUser) return;
    if (newPassword.trim().length < 6) {
      showToast("رمز عبور حداقل ۶ کاراکتر", "danger");
      return;
    }
    try {
      await adminApi.setAdminUserPassword(passwordUser._id, newPassword.trim());
      showToast("رمز عبور تنظیم شد", "success");
      setPasswordUser(null);
      setNewPassword("");
      void load();
    } catch {
      showToast("تنظیم رمز ناموفق بود", "danger");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-bold">مدیریت کاربران</h3>
          <p className="text-sm text-muted">
            جستجو، ویرایش، تعیین ادمین و حذف نرم
          </p>
        </div>

        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(searchInput.trim());
          }}
        >
          <div className="relative min-w-[220px] flex-1">
            <SearchNormal1
              size={18}
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="جستجو نام یا موبایل…"
              className="w-full rounded-xl border border-border bg-surface px-10 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <Button type="submit" variant="secondary">
            جستجو
          </Button>
        </form>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-muted">
        <Switch
          isSelected={includeDeleted}
          onChange={(selected) => {
            setIncludeDeleted(selected);
            setPage(1);
          }}
          size="sm"
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
        نمایش حذف‌شده‌ها
      </label>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-secondary/70 text-muted">
              <tr>
                <th className="px-4 py-3 text-start font-medium">کاربر</th>
                <th className="px-4 py-3 text-start font-medium">موبایل</th>
                <th className="px-4 py-3 text-start font-medium">موجودی</th>
                <th className="px-4 py-3 text-start font-medium">وضعیت</th>
                <th className="px-4 py-3 text-start font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    در حال بارگذاری…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    کاربری یافت نشد
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="border-t border-border/50 hover:bg-surface-secondary/40"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted">
                        {user.telegramLinked ? "تلگرام متصل" : "بدون تلگرام"}
                        {user.hasPassword ? " · رمز دارد" : " · بدون رمز"}
                      </p>
                    </td>
                    <td className="px-4 py-3">{toPersianDigits(user.mobile)}</td>
                    <td className="px-4 py-3">
                      {formatPrice(user.budget)} تومان
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {user.isAdmin && (
                          <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-600">
                            ادمین
                          </span>
                        )}
                        {user.isVerifiedMobile && (
                          <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success-foreground">
                            تأییدشده
                          </span>
                        )}
                        {user.deleted && (
                          <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger">
                            حذف‌شده
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() => openPassword(user)}
                          aria-label="تغییر رمز عبور"
                        >
                          <Lock size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() => openEdit(user)}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() => void toggleAdmin(user)}
                        >
                          <ShieldTick size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() => void toggleDeleted(user)}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            isDisabled={page <= 1}
            onPress={() => setPage((p) => p - 1)}
          >
            قبلی
          </Button>
          <span className="text-sm text-muted">
            صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
          </span>
          <Button
            variant="secondary"
            isDisabled={page >= totalPages}
            onPress={() => setPage((p) => p + 1)}
          >
            بعدی
          </Button>
        </div>
      )}

      <Modal isOpen={Boolean(editing)} onOpenChange={() => setEditing(null)}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>ویرایش کاربر</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-3">
                <input
                  value={editForm.firstName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
                  placeholder="نام"
                />
                <input
                  value={editForm.lastName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
                  placeholder="نام خانوادگی"
                />
                <input
                  type="number"
                  value={editForm.budget}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      budget: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
                  placeholder="موجودی"
                />
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    isSelected={editForm.isVerifiedMobile}
                    onChange={(selected) =>
                      setEditForm((f) => ({ ...f, isVerifiedMobile: selected }))
                    }
                    size="sm"
                  >
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch>
                  موبایل تأییدشده
                </label>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onPress={() => setEditing(null)}>
                  انصراف
                </Button>
                <Button onPress={() => void saveEdit()}>ذخیره</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal isOpen={Boolean(passwordUser)} onOpenChange={() => setPasswordUser(null)}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>تغییر رمز عبور</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-3">
                {passwordUser ? (
                  <p className="text-sm text-muted">
                    کاربر:{" "}
                    <span className="font-medium text-foreground">
                      {passwordUser.firstName} {passwordUser.lastName}
                    </span>{" "}
                    ({toPersianDigits(passwordUser.mobile)})
                  </p>
                ) : null}
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
                  placeholder="رمز عبور جدید (حداقل ۶ کاراکتر)"
                  autoComplete="new-password"
                />
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onPress={() => setPasswordUser(null)}>
                  انصراف
                </Button>
                <Button onPress={() => void savePassword()}>ذخیره رمز</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
