"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useState } from "react";
import { Button, Modal, Switch } from "@heroui/react";
import { Edit2, Lock, SearchNormal1, ShieldTick, Trash } from "iconsax-reactjs";

import * as adminApi from "@/common/api/admin";
import type { AdminUser } from "@/common/interfaces/admin";
import { formatPrice, toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";

export function AdminUsersPage() {
  const { t } = useTranslation();
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
      showToast(t("auto.k368a663ddc"), "danger");
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
      showToast(t("auto.k4cf4eb1e01"), "success");
      setEditing(null);
      void load();
    } catch {
      showToast(t("common.saveFailed"), "danger");
    }
  };

  const toggleAdmin = async (user: AdminUser) => {
    try {
      await adminApi.setAdminRole(user._id, !user.isAdmin);
      showToast(t("auto.kd3d0e0136a"), "success");
      void load();
    } catch {
      showToast(t("auto.k3745393c8b"), "danger");
    }
  };

  const toggleDeleted = async (user: AdminUser) => {
    try {
      await adminApi.setUserDeleted(user._id, !user.deleted);
      showToast(user.deleted ? t("auto.k40d6d6c97a") : t("auto.kec199d2ba8"), "success");
      void load();
    } catch {
      showToast(t("auto.k118692df91"), "danger");
    }
  };

  const openPassword = (user: AdminUser) => {
    setPasswordUser(user);
    setNewPassword("");
  };

  const savePassword = async () => {
    if (!passwordUser) return;
    if (newPassword.trim().length < 6) {
      showToast(t("auto.k19c70f8d7e"), "danger");
      return;
    }
    try {
      await adminApi.setAdminUserPassword(passwordUser._id, newPassword.trim());
      showToast(t("auto.kb272ae731c"), "success");
      setPasswordUser(null);
      setNewPassword("");
      void load();
    } catch {
      showToast(t("auto.kd67e39712d"), "danger");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-bold">{t("auto.k7725d2e991")}</h3>
          <p className="text-sm text-muted">
            {t("auto.k334096443a")}
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
              placeholder={t("auto.k081ae81ffc")}
              className="w-full rounded-xl border border-border bg-surface px-10 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <Button type="submit" variant="secondary">
            {t("common.search")}
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
        {t("auto.k5df4a8193a")}
      </label>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-secondary/70 text-muted">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k883da9f030")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("common.mobile")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k90c9e7cad5")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k2f3c6cf127")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k0f0dff2dfc")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    {t("common.loading")}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    {t("auto.k241064b7a4")}
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
                        {user.telegramLinked ? t("auto.kc3fcf89f9c") : t("auto.ke8ab1e23e0")}
                        {user.hasPassword ? t("auto.k1c2c468b4c") : t("auto.k6797ed39e2")}
                      </p>
                    </td>
                    <td className="px-4 py-3">{toPersianDigits(user.mobile)}</td>
                    <td className="px-4 py-3">
                      {formatPrice(user.budget)} {t("common.toman")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {user.isAdmin && (
                          <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-600">
                            {t("auto.k65497ce419")}
                          </span>
                        )}
                        {user.isVerifiedMobile && (
                          <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success-foreground">
                            {t("auto.k2838d25139")}
                          </span>
                        )}
                        {user.deleted && (
                          <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger">
                            {t("auto.k2df1553d76")}
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
                          aria-label={t("auto.k688910bf70")}
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
            {t("auto.k1a592f6b2d")}
          </Button>
          <span className="text-sm text-muted">
            {t("auto.k58210d64d8")}{toPersianDigits(page)} {t("common.of")} {toPersianDigits(totalPages)}
          </span>
          <Button
            variant="secondary"
            isDisabled={page >= totalPages}
            onPress={() => setPage((p) => p + 1)}
          >
            {t("auto.k54ee927e96")}
          </Button>
        </div>
      )}

      <Modal isOpen={Boolean(editing)} onOpenChange={() => setEditing(null)}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>{t("auto.k1f97b4acf6")}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-3">
                <input
                  value={editForm.firstName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
                  placeholder={t("common.name")}
                />
                <input
                  value={editForm.lastName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
                  placeholder={t("auto.k342616c4fb")}
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
                  placeholder={t("auto.k90c9e7cad5")}
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
                  {t("auto.kf49c8cfb66")}
                </label>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onPress={() => setEditing(null)}>
                  {t("common.cancel")}
                </Button>
                <Button onPress={() => void saveEdit()}>{t("common.save")}</Button>
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
                <Modal.Heading>{t("auto.k688910bf70")}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-3">
                {passwordUser ? (
                  <p className="text-sm text-muted">
                    {t("auto.k8f5e55540b")}{" "}
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
                  placeholder={t("auto.k14ba268c7c")}
                  autoComplete="new-password"
                />
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onPress={() => setPasswordUser(null)}>
                  {t("common.cancel")}
                </Button>
                <Button onPress={() => void savePassword()}>{t("auto.k0b75de2011")}</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
