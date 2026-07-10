"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { Button, Modal } from "@heroui/react";
import { Refresh, TickCircle } from "iconsax-reactjs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FC,
  type PropsWithChildren,
  type ReactNode,
} from "react";

import {
  APP_VERSION,
  getChangelogSince,
  isNewerVersion,
} from "@/common/constants/app-version";
import {
  getLastSeenVersion,
  setLastSeenVersion,
} from "@/common/utils/version-storage";
import {
  AppModal,
  AppModalDialog,
  AppModalHeader,
  modalSheetBodyClass,
  modalSheetFooterClass,
} from "@/components/common/ui/AppModal";

type VersionContextValue = {
  hasUpdate: boolean;
  applyUpdate: () => void;
  showChangelog: () => void;
};

const VersionContext = createContext<VersionContextValue | null>(null);

export function useVersion() {
  const ctx = useContext(VersionContext);
  if (!ctx) throw new Error("useVersion must be used within VersionProvider");
  return ctx;
}

function ChangelogModal({
  open,
  onOpenChange,
  entries,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: ReturnType<typeof getChangelogSince>;
  footer?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <AppModal open={open} onOpenChange={onOpenChange} mobileFull>
      <AppModalDialog className="flex max-h-[100dvh] flex-col sm:max-w-lg">
        <AppModalHeader onClose={() => onOpenChange(false)}>
          <Modal.Heading>{t("common.whatsNew")}</Modal.Heading>
          <p className="mt-1 text-sm text-muted">نسخه {APP_VERSION}</p>
        </AppModalHeader>

        <div className={`${modalSheetBodyClass} space-y-5 overflow-y-auto`}>
          {entries.map((entry) => (
            <div key={entry.version} className="space-y-2">
              <div>
                <h3 className="font-bold">{entry.title}</h3>
                <p className="text-xs text-muted">{entry.date}</p>
              </div>
              <ul className="space-y-1.5">
                {entry.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <TickCircle
                      size={16}
                      variant="Bold"
                      className="mt-0.5 shrink-0 text-success"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {footer && (
          <Modal.Footer className={modalSheetFooterClass}>{footer}</Modal.Footer>
        )}
      </AppModalDialog>
    </AppModal>
  );
}

export const VersionProvider: FC<PropsWithChildren> = ({ children }) => {
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [entries, setEntries] = useState(getChangelogSince(null));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const lastSeen = getLastSeenVersion();
    if (isNewerVersion(APP_VERSION, lastSeen)) {
      setEntries(getChangelogSince(lastSeen));
      setChangelogOpen(true);
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setUpdateReady(true);
        }

        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              setWaitingWorker(worker);
              setUpdateReady(true);
            }
          });
        });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }
  }, [mounted]);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      return;
    }
    window.location.reload();
  }, [waitingWorker]);

  const dismissChangelog = useCallback(() => {
    setLastSeenVersion(APP_VERSION);
    setChangelogOpen(false);
  }, []);

  const showChangelog = useCallback(() => {
    setEntries(getChangelogSince(null));
    setChangelogOpen(true);
  }, []);

  const value = useMemo(
    () => ({ hasUpdate: updateReady, applyUpdate, showChangelog }),
    [updateReady, applyUpdate, showChangelog],
  );

  return (
    <VersionContext.Provider value={value}>
      {children}

      <ChangelogModal
        open={changelogOpen}
        onOpenChange={(open) => !open && dismissChangelog()}
        entries={entries}
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            {updateReady && (
              <Button variant="primary" className="flex-1" onPress={applyUpdate}>
                <Refresh size={18} />
                بروزرسانی اپ
              </Button>
            )}
            <Button
              variant={updateReady ? "secondary" : "primary"}
              className="flex-1"
              onPress={dismissChangelog}
            >
              {updateReady ? "بعداً" : "متوجه شدم"}
            </Button>
          </div>
        }
      />
    </VersionContext.Provider>
  );
};
