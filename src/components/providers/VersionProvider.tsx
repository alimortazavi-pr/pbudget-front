"use client";

import { useTranslation } from "@/i18n";

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
import { useAppSelector } from "@/stores/hooks";
import { isAuthSelector } from "@/stores/auth";
import { axiosInstance } from "@/common/axiosInstance";
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

type ReleaseMessage = { enabled: boolean; title: string; items: string[]; revision: number };

const SEEN_REVISION_KEY = "release-message-revision";

function readSeenRevision() {
  try {
    return Number(localStorage.getItem(SEEN_REVISION_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeSeenRevision(revision: number) {
  try {
    localStorage.setItem(SEEN_REVISION_KEY, String(revision));
  } catch {
    // private mode: the message may show again next visit
  }
}

function ChangelogModal({
  open,
  onOpenChange,
  entries,
  message,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: ReturnType<typeof getChangelogSince>;
  message?: ReleaseMessage | null;
  footer?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <AppModal open={open} onOpenChange={onOpenChange} mobileFull>
      <AppModalDialog className="flex max-h-[100dvh] flex-col sm:max-w-lg">
        <AppModalHeader onClose={() => onOpenChange(false)}>
          <Modal.Heading>{t("common.whatsNew")}</Modal.Heading>
          <p className="mt-1 text-sm text-muted">{t("auto.k24f4ed36d2")}{APP_VERSION}</p>
        </AppModalHeader>

        <div className={`${modalSheetBodyClass} space-y-5 overflow-y-auto`}>
          {message ? (
            <div className="space-y-2">
              <h3 className="font-bold">{message.title}</h3>
              <ul className="space-y-1.5">
                {message.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <TickCircle size={16} variant="Bold" className="mt-0.5 shrink-0 text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {(message ? [] : entries).map((entry) => (
            <div key={entry.version} className="space-y-2">
              <div>
                <h3 className="font-bold">{t(entry.titleKey)}</h3>
                <p className="text-xs text-muted">{t(entry.dateKey)}</p>
              </div>
              <ul className="space-y-1.5">
                {entry.itemKeys.map((itemKey) => (
                  <li key={itemKey} className="flex items-start gap-2 text-sm">
                    <TickCircle
                      size={16}
                      variant="Bold"
                      className="mt-0.5 shrink-0 text-success"
                    />
                    <span>{t(itemKey)}</span>
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
  const { t } = useTranslation();
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [entries, setEntries] = useState(getChangelogSince(null));
  const [mounted, setMounted] = useState(false);
  const isAuth = useAppSelector(isAuthSelector);
  const [message, setMessage] = useState<ReleaseMessage | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // The "what's new" message is written by an admin and shown only while they have it switched on. Each revision is
  // shown once per browser, and only to people who are signed in.
  useEffect(() => {
    if (!mounted || !isAuth) return;
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await axiosInstance.get<ReleaseMessage>("/site/release-notes");
        if (cancelled || !data.enabled || !data.items.length) return;
        if (readSeenRevision() >= data.revision) return;
        setMessage(data);
        setChangelogOpen(true);
      } catch {
        // the message is optional
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, isAuth]);

  useEffect(() => {
    if (!mounted) return;

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
    if (message) writeSeenRevision(message.revision);
    setChangelogOpen(false);
    setMessage(null);
  }, [message]);

  const showChangelog = useCallback(() => {
    setMessage(null);
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
        // AppModal reports its initial closed state through onOpenChange once on mount; counting
        // that as "dismissed" marked the version as seen before the check above could run.
        onOpenChange={(open) => !open && changelogOpen && dismissChangelog()}
        entries={entries}
        message={message}
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            {updateReady && (
              <Button variant="primary" className="flex-1" onPress={applyUpdate}>
                <Refresh size={18} />
                {t("auto.k15e14e4c82")}
              </Button>
            )}
            <Button
              variant={updateReady ? "secondary" : "primary"}
              className="flex-1"
              onPress={dismissChangelog}
            >
              {updateReady ? t("auto.kacf5238e74") : t("auto.ked52d39dd9")}
            </Button>
          </div>
        }
      />
    </VersionContext.Provider>
  );
};
