"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal } from "@heroui/react";
import { Building, Profile2User } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as businessApi from "@/common/api/business";
import type { IBusiness } from "@/common/interfaces/business.interface";
import { storage } from "@/common/utils/storage";
import { useMediaQuery } from "@/common/hooks/useMediaQuery";
import {
  AppModal,
  AppModalDialog,
  AppModalHeader,
} from "@/components/common/ui/AppModal";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

export function BusinessWorkspaceSwitcher() {
  const router = useRouter();
  const user = useAppSelector(userSelector);
  const [open, setOpen] = useState(false);
  const [businesses, setBusinesses] = useState<IBusiness[]>([]);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const activeId = storage.getActiveBusinessId();

  const load = useCallback(async () => {
    try {
      const list = await businessApi.fetchMyBusinesses();
      setBusinesses(list);
    } catch {
      /* optional */
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  function goPersonal() {
    storage.setActiveBusinessId(null);
    setOpen(false);
    router.push(PATHS.HOME);
    window.location.reload();
  }

  function goBusiness(id: string) {
    storage.setActiveBusinessId(id);
    setOpen(false);
    router.push(PATHS.BUSINESS_DETAIL(id));
  }

  if (!user) return null;

  return (
    <>
      <Button
        isIconOnly
        variant="ghost"
        size="sm"
        aria-label="فضای کسب‌وکار"
        onPress={() => setOpen(true)}
      >
        <Building size={20} />
      </Button>

      <AppModal
        open={open}
        onOpenChange={setOpen}
        placement={isDesktop ? "center" : "bottom"}
      >
        <AppModalDialog>
          <AppModalHeader>انتخاب فضا</AppModalHeader>
          <div className="space-y-2 p-4">
            <button
              type="button"
              onClick={goPersonal}
              className={`flex w-full items-center gap-3 rounded-xl p-3 text-right ${
                !activeId ? "bg-violet-100 dark:bg-violet-900/30" : "hover:bg-surface-secondary"
              }`}
            >
              <Profile2User size={20} />
              <span>
                {user.firstName} {user.lastName} (شخصی)
              </span>
            </button>

            {businesses.map((b) => (
              <button
                key={b._id}
                type="button"
                onClick={() => goBusiness(b._id)}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-right ${
                  activeId === b._id
                    ? "bg-violet-100 dark:bg-violet-900/30"
                    : "hover:bg-surface-secondary"
                }`}
              >
                <Building size={20} />
                <span>{b.title}</span>
              </button>
            ))}

            <Button
              variant="secondary"
              className="w-full"
              onPress={() => {
                setOpen(false);
                router.push(PATHS.BUSINESS);
              }}
            >
              مدیریت کسب‌وکارها
            </Button>
          </div>
        </AppModalDialog>
      </AppModal>
    </>
  );
}
