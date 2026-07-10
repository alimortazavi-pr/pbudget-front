"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal } from "@heroui/react";
import { Add, Profile2User } from "iconsax-reactjs";

import * as authApi from "@/common/api/auth";
import { PATHS } from "@/common/constants";
import { saveDataToLocal } from "@/common/utils";
import { useMediaQuery } from "@/common/hooks/useMediaQuery";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { authenticate, setUsers, usersSelector } from "@/stores/auth";
import { setProfile, userSelector } from "@/stores/profile";

export function ChangeAccountPopover() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const users = useAppSelector(usersSelector);
  const currentUser = useAppSelector(userSelector);
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (!users.length) return null;

  async function switchAccount(token: string) {
    try {
      const { user } = await authApi.checkAuth(token);
      dispatch(authenticate({ token }));
      dispatch(setProfile(user));
      const nextUsers = users.map((u) =>
        u._id === user._id ? { ...user, token } : u,
      );
      dispatch(setUsers(nextUsers));
      saveDataToLocal({ token, users: nextUsers });
      setOpen(false);
      window.location.reload();
    } catch {
      /* handled by interceptor */
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
                onClick={() => void switchAccount(user.token)}
              >
                {user.firstName} {user.lastName}
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
                router.push(PATHS.GET_STARTED);
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
