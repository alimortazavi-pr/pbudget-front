"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useState } from "react";
import { Button, Modal } from "@heroui/react";

import * as partnersApi from "@/common/api/partners";
import type { PartnerContextType } from "@/common/interfaces/partner.interface";
import { toEnglishDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { FormInput, FormSelect, FormTextArea } from "@/components/common/form/FormFields";
import {
  AppModal,
  AppModalDialog,
  AppModalHeader,
} from "@/components/common/ui/AppModal";

type AddPartnerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contextType: PartnerContextType;
  contextId: string;
  onCreated?: () => void;
};

type Step = "mobile" | "details" | "result";

export function AddPartnerModal({
  open,
  onOpenChange,
  contextType,
  contextId,
  onCreated,
}: AddPartnerModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [sharePercent, setSharePercent] = useState("");
  const [notes, setNotes] = useState("");
  const [permissionLevel, setPermissionLevel] = useState("viewer");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exists, setExists] = useState(false);
  const [hasTelegram, setHasTelegram] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [telegramSent, setTelegramSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("mobile");
    setMobile("");
    setDisplayName("");
    setSharePercent("");
    setNotes("");
    setPermissionLevel("viewer");
    setExists(false);
    setHasTelegram(false);
    setInviteLink(null);
    setTelegramSent(false);
  }, [open]);

  function closeModal() {
    onOpenChange(false);
  }

  async function checkMobile() {
    const normalized = toEnglishDigits(mobile.trim());
    if (normalized.length < 10) {
      showToast(t("auto.ke5ea291b1e"));
      return;
    }

    setLookupLoading(true);
    try {
      const result = await partnersApi.lookupPartnerMobile(normalized);
      setExists(result.exists);
      setHasTelegram(result.hasTelegram);
      if (result.exists && result.user) {
        setDisplayName(result.user.displayName);
      }
      setStep("details");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.k7a6825b192"));
    } finally {
      setLookupLoading(false);
    }
  }

  async function submitPartner() {
    const normalized = toEnglishDigits(mobile.trim());
    if (!exists && !displayName.trim()) {
      showToast(t("auto.kc07369b8f0"));
      return;
    }

    const share = sharePercent ? Number(toEnglishDigits(sharePercent)) : 0;
    if (sharePercent && (share < 0 || share > 100)) {
      showToast(t("auto.k685adbee84"));
      return;
    }

    setSaving(true);
    try {
      const create =
        contextType === "project"
          ? partnersApi.createProjectPartner
          : partnersApi.createVenturePartner;

      const result = await create(contextId, {
        mobile: normalized,
        displayName: displayName.trim() || undefined,
        sharePercent: share,
        notes: notes.trim() || undefined,
        permissionLevel: permissionLevel as "viewer" | "editor",
      });

      setInviteLink(result.inviteLink ?? null);
      setTelegramSent(result.telegramSent);
      setHasTelegram(result.hasTelegram);
      setStep("result");
      onCreated?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.k2d9ecf415e"));
    } finally {
      setSaving(false);
    }
  }

  async function copyInviteLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      showToast(t("auto.k16d6c6a3bd"), "success");
    } catch {
      showToast(t("auto.kfc3060ba28"));
    }
  }

  const stepDescription =
    step === "mobile"
      ? t("auto.k7479e37cce")
      : step === "details"
        ? exists
          ? t("auto.kc86d73cfaa")
          : t("auto.k120e090ef7")
        : t("auto.k51760327af");

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalDialog className="max-w-lg">
        <AppModalHeader onClose={closeModal}>
          <Modal.Heading>{t("auto.k945cf52c7a")}</Modal.Heading>
          <p className="mt-1 text-sm text-muted">{stepDescription}</p>
        </AppModalHeader>
        <Modal.Body className="space-y-4">
        {step === "mobile" ? (
          <>
            <FormInput
              label={t("auto.k1d0204302f")}
              placeholder={t("auto.k31b5be1e8a")}
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
            />
            <Button
              className="w-full"
              size="lg"
              onPress={() => void checkMobile()}
              isPending={lookupLoading}
            >
              {t("auto.k43d41fd6bd")}
            </Button>
          </>
        ) : null}

        {step === "details" ? (
          <>
            {exists ? (
              <div className="rounded-xl bg-success/10 px-3 py-2 text-sm text-success-foreground">
                {t("auto.keecaed2c84")}{displayName}
                {hasTelegram ? t("auto.kbba5337a6b") : t("auto.k996df2b7bc")}
              </div>
            ) : (
              <FormInput
                label={t("auto.k16d2d57820")}
                placeholder={t("auto.k27667fa962")}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            )}

            <FormInput
              label={t("auto.kf6141416b5")}
              placeholder={t("auto.k9bd9c89419")}
              value={sharePercent}
              onChange={(e) => setSharePercent(e.target.value)}
              inputMode="numeric"
            />
            <FormSelect
              label={t("auto.kf3b9549a2b")}
              selectedKey={permissionLevel}
              onSelectionChange={setPermissionLevel}
              options={[
                { id: "viewer", label: t("auto.k1ade08c72f") },
                { id: "editor", label: t("auto.k39b30e32ed") },
              ]}
            />
            <FormTextArea
              label={t("auto.k27a509562c")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onPress={() => setStep("mobile")}
              >
                {t("common.back")}
              </Button>
              <Button
                className="flex-1"
                onPress={() => void submitPartner()}
                isPending={saving}
              >
                {exists ? t("auto.kd6c542b90e") : t("auto.k4ad190e8a5")}
              </Button>
            </div>
          </>
        ) : null}

        {step === "result" ? (
          <>
            <p className="text-sm leading-7 text-muted">
              {exists
                ? t("auto.kcafad1f40f")
                : t("auto.k5932981276")}
            </p>

            {inviteLink ? (
              <div className="space-y-2 rounded-xl bg-surface-secondary p-3">
                <p className="text-xs text-muted">{t("auto.kfcb604104f")}</p>
                <p className="break-all text-sm font-medium">{inviteLink}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onPress={() => void copyInviteLink()}
                >
                  {t("auto.kac0faf914a")}
                </Button>
              </div>
            ) : null}

            {exists && telegramSent ? (
              <p className="rounded-xl bg-success/10 px-3 py-2 text-sm text-success-foreground">
                {t("auto.k52cf6005a1")}
              </p>
            ) : null}

            {exists && !telegramSent && hasTelegram === false ? (
              <div className="space-y-2 rounded-xl bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
                <p>{t("auto.kaa08b197c6")}</p>
                {inviteLink ? (
                  <>
                    <p className="break-all text-xs font-medium text-foreground">{inviteLink}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onPress={() => void copyInviteLink()}
                    >
                      {t("auto.k6ddb9c9697")}
                    </Button>
                  </>
                ) : null}
              </div>
            ) : null}

            <Button className="w-full" size="lg" onPress={closeModal}>
              {t("common.close")}
            </Button>
          </>
        ) : null}
        </Modal.Body>
      </AppModalDialog>
    </AppModal>
  );
}
