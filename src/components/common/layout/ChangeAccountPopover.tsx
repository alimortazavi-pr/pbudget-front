"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal } from "@heroui/react";
import { Add, Profile2User } from "iconsax-reactjs";

import * as authApi from "@/common/api/auth";
import { activateAccount, showErrorToast, showToast } from "@/common/utils";
import { buildAddAccountUrl } from "@/common/utils/auth-flow";
import { useMediaQuery } from "@/common/hooks/useMediaQuery";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { setUsers, usersSelector } from "@/stores/auth";
import { userSelector } from "@/stores/profile";

export function ChangeAccountPopover() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const users = useAppSelector(usersSelector);
  const currentUser = useAppSelector(userSelector);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (!users.length) return null;

  async function switchAccount(account: { _id: string; token: string }) {
    if (account._id === currentUser?._id) {
      setOpen(false);
      return;
    }
    setSwitching(account._id);
    try {
      // Verify that account's own session before switching to it.
      await authApi.checkAuth(account.token);
      setOpen(false);
      activateAccount(account.token);
    } catch (error) {
      setSwitching(null);
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        // Its session expired; the interceptor already removed it from the list.
        const remaining = users.filter((u) => u._id !== account._id);
        dispatch(setUsers(remaining));
        showToast(t("common.accountSessionExpired"), "warning");
        router.push(buildAddAccountUrl());
        setOpen(false);
      } else {
        showErrorToast(error);
      }
    }
  }

  return (
    <>
      <Button
        isIconOnly
        variant="ghost"
        size="sm"
        aria-label={t("common.changeAccount")}
        onPress={() => setOpen(true)}
      >
        <Profile2User size={20} />
      </Button>

      <AppModal
        open={open}
        onOpenChange={setOpen}
        placement={isDesktop ? "center" : "bottom"}
      >
        <AppModalDialog className={isDesktop ? "max-w-md" : "rounded-t-3xl"}>
          <AppModalHeader onClose={() => setOpen(false)}>
            <Modal.Heading>{t("common.changeAccount")}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body className="flex flex-col gap-2">
            {users.map((user) => (
              <button
                key={user._id}
                type="button"
                className={`cursor-pointer rounded-xl px-3 py-3 text-start text-sm transition-colors ${
                  currentUser?._id === user._id
                    ? "bg-accent/12 text-accent"
                    : "hover:bg-surface-secondary"
                }`}
                disabled={Boolean(switching)}
                onClick={() => void switchAccount(user)}
              >
                {user.firstName} {user.lastName}
                {switching === user._id ? <span className="ms-2 text-xs text-muted">{t("common.loading")}</span> : null}
                <span className="mt-0.5 block text-xs text-muted">
                  {user.mobile}
                </span>
              </button>
            ))}

            <button
              type="button"
              className="mt-1 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-3 text-sm text-accent transition-colors hover:bg-accent/8"
              onClick={() => {
                setOpen(false);
                router.push(buildAddAccountUrl());
              }}
            >
              <Add size={18} />
              {t("common.addAccount")}
            </button>
          </Modal.Body>
        </AppModalDialog>
      </AppModal>
    </>
  );
}
