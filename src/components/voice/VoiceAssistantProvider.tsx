"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { Button } from "@heroui/react";
import { Microphone2, Stop } from "iconsax-reactjs";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import * as voiceApi from "@/common/api/voice";
import type {
  VoiceInterpretResponse,
} from "@/common/interfaces/voice.interface";
import { toPersianDigits } from "@/common/utils";
import { useMediaQuery } from "@/common/hooks/useMediaQuery";
import { mergeProfileWallet } from "@/common/utils/wallet-balances";
import { showErrorToast, showToast } from "@/common/utils/toast";
import {
  AppModal,
  AppModalDialog,
  AppModalHeader,
  modalSheetBodyClass,
  modalSheetFooterClass,
} from "@/components/common/ui/AppModal";
import { useMobileOverlay } from "@/components/providers/MobileOverlayProvider";
import { useVoiceAssistantPreference } from "@/components/providers/VoiceAssistantPreferenceProvider";
import { useVoiceAssistant } from "@/hooks/use-voice-assistant";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { bumpBudgetRevision } from "@/stores/budget";
import { setProfile, userSelector } from "@/stores/profile";

type VoiceAssistantContextValue = {
  open: () => void;
  isSupported: boolean;
};

const VoiceAssistantContext = createContext<VoiceAssistantContextValue | null>(
  null,
);

export function useVoiceAssistantPanel() {
  const ctx = useContext(VoiceAssistantContext);
  if (!ctx) {
    throw new Error("useVoiceAssistantPanel must be used within VoiceAssistantProvider");
  }
  return ctx;
}

export function VoiceAssistantProvider({ children }: { children: ReactNode }) {  const { t } = useTranslation();

  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const voice = useVoiceAssistant();
  const { enabled: voiceAssistantEnabled, mounted: preferenceMounted } =
    useVoiceAssistantPreference();
  const { count: mobileOverlayCount } = useMobileOverlay();
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const [modalOpen, setModalOpen] = useState(false);
  const [manualText, setManualText] = useState("");
  const [pending, setPending] = useState<VoiceInterpretResponse | null>(null);
  const [executing, setExecuting] = useState(false);

  const open = useCallback(() => {
    setPending(null);
    setManualText("");
    setModalOpen(true);
  }, []);

  const close = useCallback(() => {
    voice.stop();
    setModalOpen(false);
    setPending(null);
    setManualText("");
  }, [voice]);

  const interpret = useCallback(
    async (transcript: string) => {
      const text = transcript.trim();
      if (!text) return;

      voice.setProcessing(true);
      try {
        const result = await voiceApi.interpretVoice(text);
        setPending(result);
        setManualText(text);
      } catch (err) {
        showErrorToast(err instanceof Error ? err.message : "تفسیر دستور ناموفق بود");
      } finally {
        voice.setProcessing(false);
      }
    },
    [voice],
  );

  const handleListen = useCallback(() => {
    voice.start((text) => {
      void interpret(text);
    });
  }, [voice, interpret]);

  const handleConfirm = useCallback(async () => {
    if (!pending?.log._id) return;
    setExecuting(true);
    try {
      const { result } = await voiceApi.executeVoice(pending.log._id);
      const intent = pending.interpretation.intent;

      if (result.navigateTo) {
        router.push(result.navigateTo);
      }

      if (
        intent === "create_budget" ||
        intent === "create_debt" ||
        intent === "query_balance"
      ) {
        dispatch(bumpBudgetRevision());
        if (user && (result.data?.userBudget != null || result.data?.userWalletBalances)) {
          dispatch(
            setProfile(
              mergeProfileWallet(user, {
                userBudget:
                  result.data?.userBudget != null
                    ? Number(result.data.userBudget)
                    : undefined,
                userWalletBalances: result.data?.userWalletBalances,
                currency: result.data?.currency,
              }),
            ),
          );
        } else if (result.data?.balance != null && user) {
          dispatch(setProfile({ ...user, budget: Number(result.data.balance) }));
        }
      }

      showToast(result.message, "success");
      close();
      router.refresh();
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "اجرای دستور ناموفق بود");
    } finally {
      setExecuting(false);
    }
  }, [pending, router, dispatch, user, close]);

  const handleCancel = useCallback(async () => {
    if (pending?.log._id) {
      try {
        await voiceApi.cancelVoice(pending.log._id);
      } catch {
        // ignore cancel errors
      }
    }
    close();
  }, [pending, close]);

  const ctx = useMemo(
    () => ({ open, isSupported: voice.isSupported }),
    [open, voice.isSupported],
  );

  const canExecute =
    pending &&
    pending.interpretation.intent !== "unknown" &&
    !(
      (pending.interpretation.intent === "create_budget" ||
        pending.interpretation.intent === "create_debt") &&
      !pending.interpretation.payload.category
    );

  const showFab =
    preferenceMounted &&
    voiceAssistantEnabled &&
    !(isMobile && mobileOverlayCount > 0);

  return (
    <VoiceAssistantContext.Provider value={ctx}>
      {children}

      {showFab && (
        <button
          type="button"
          aria-label={t("voice.title")}
          data-tour="voice-fab"
          onClick={open}
          className="fixed z-[70] flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/30 transition hover:scale-105 active:scale-95 end-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-8"
        >
          <Microphone2 size={24} variant="Bold" />
        </button>
      )}

      {voiceAssistantEnabled && (
        <AppModal open={modalOpen} onOpenChange={(v) => !v && void handleCancel()} mobileFull>
          <AppModalDialog className="flex max-h-[100dvh] flex-col sm:max-w-lg">
          <AppModalHeader>
            <h2 className="text-lg font-bold">{t("voice.title")}</h2>
            <p className="mt-1 text-sm text-muted">
              محیط آزمایشی — پس از تشخیص، یک‌بار جزئیات را بررسی کنید
            </p>
          </AppModalHeader>

          <div className={modalSheetBodyClass}>
            {!pending ? (
              <div className="space-y-4">
                <div className="pb-notice-banner">
                  این قابلیت در حالت تست است. قبل از تأیید، مبلغ، دسته و تاریخ را
                  حتماً چک کنید.
                </div>

                {voice.error && (
                  <p className="text-sm text-danger">{voice.error}</p>
                )}

                <div className="min-h-[72px] rounded-2xl border border-border bg-surface-secondary/60 px-4 py-3 text-sm">
                  {voice.state === "listening" ? (
                    <span className="animate-pulse text-accent">
                      {voice.interimTranscript || "در حال گوش دادن…"}
                    </span>
                  ) : voice.state === "processing" ? (
                    <span className="text-muted">{t("voice.processing")}</span>
                  ) : (
                    <span className="text-muted">
                      مثال: «مبلغ ۱۰ ت برای کافه امروز پرداخت شد»
                    </span>
                  )}
                </div>

                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder={t("voice.typePlaceholder")}
                  rows={3}
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="pb-notice-banner">
                  {pending.testModeNotice}
                </div>

                <div>
                  <p className="text-xs text-muted">{t("voice.recognizedText")}</p>
                  <p className="mt-1 text-sm font-medium">{pending.log.transcript}</p>
                </div>

                <div>
                  <p className="text-xs text-muted">{t("voice.actionSummary")}</p>
                  <p className="mt-1 text-base font-bold">{pending.interpretation.summary}</p>
                  <p className="mt-1 text-xs text-muted">
                    اطمینان: {toPersianDigits(String(Math.round(pending.interpretation.confidence * 100)))}٪
                  </p>
                </div>

                {pending.interpretation.fields.length > 0 && (
                  <div className="space-y-2 rounded-2xl border border-border bg-surface-secondary/40 p-4">
                    {pending.interpretation.fields.map((field) => (
                      <div
                        key={field.key}
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <span className="shrink-0 text-muted">{field.label}</span>
                        <span className="text-end font-medium">{field.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {pending.interpretation.warnings.length > 0 && (
                  <ul className="space-y-1 text-sm text-warning-foreground">
                    {pending.interpretation.warnings.map((warning) => (
                      <li key={warning}>• {warning}</li>
                    ))}
                  </ul>
                )}

                {pending.interpretation.intent === "unknown" && (
                  <p className="text-sm text-danger">
                    دستور قابل اجرا نیست — لطفاً واضح‌تر بگویید یا متن را اصلاح کنید.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className={`${modalSheetFooterClass} flex flex-wrap gap-2`}>
            {!pending ? (
              <>
                <Button
                  variant="primary"
                  className="flex-1"
                  isDisabled={voice.state === "processing"}
                  onPress={handleListen}
                >
                  {voice.state === "listening" ? (
                    <>
                      <Stop size={18} />
                      در حال ضبط…
                    </>
                  ) : (
                    <>
                      <Microphone2 size={18} />
                      شروع ضبط
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  isDisabled={!manualText.trim() || voice.state === "processing"}
                  onPress={() => void interpret(manualText)}
                >
                  تحلیل متن
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  className="flex-1"
                  isDisabled={executing || !canExecute}
                  onPress={() => void handleConfirm()}
                >
                  {executing ? "در حال اجرا…" : "تأیید و اجرا"}
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  isDisabled={executing}
                  onPress={() => void handleCancel()}
                >
                  لغو
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  isDisabled={executing}
                  onPress={() => setPending(null)}
                >
                  دستور جدید
                </Button>
              </>
            )}
          </div>
        </AppModalDialog>
        </AppModal>
      )}
    </VoiceAssistantContext.Provider>
  );
}
