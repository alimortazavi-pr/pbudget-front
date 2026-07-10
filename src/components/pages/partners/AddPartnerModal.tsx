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
      showToast(t("شماره موبایل معتبر نیست"));
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
      showToast(err instanceof Error ? err.message : "خطا در جستجو");
    } finally {
      setLookupLoading(false);
    }
  }

  async function submitPartner() {
    const normalized = toEnglishDigits(mobile.trim());
    if (!exists && !displayName.trim()) {
      showToast(t("نام شریک الزامی است"));
      return;
    }

    const share = sharePercent ? Number(toEnglishDigits(sharePercent)) : 0;
    if (sharePercent && (share < 0 || share > 100)) {
      showToast(t("سهم باید بین ۰ تا ۱۰۰ باشد"));
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
      showToast(err instanceof Error ? err.message : "خطا در افزودن شریک");
    } finally {
      setSaving(false);
    }
  }

  async function copyInviteLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      showToast(t("لینک کپی شد"), "success");
    } catch {
      showToast(t("کپی لینک ممکن نشد"));
    }
  }

  const stepDescription =
    step === "mobile"
      ? "شماره موبایل شریک را وارد کنید"
      : step === "details"
        ? exists
          ? "این شماره در میز پردیس ثبت شده است"
          : "اطلاعات شریک خارج از برنامه"
        : "شریک اضافه شد";

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalDialog className="max-w-lg">
        <AppModalHeader onClose={closeModal}>
          <Modal.Heading>{t("افزودن شریک")}</Modal.Heading>
          <p className="mt-1 text-sm text-muted">{stepDescription}</p>
        </AppModalHeader>
        <Modal.Body className="space-y-4">
        {step === "mobile" ? (
          <>
            <FormInput
              label={t("شماره موبایل")}
              placeholder={t("۰۹۱۲۳۴۵۶۷۸۹")}
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
              بررسی شماره
            </Button>
          </>
        ) : null}

        {step === "details" ? (
          <>
            {exists ? (
              <div className="rounded-xl bg-success/10 px-3 py-2 text-sm text-success-foreground">
                کاربر برنامه: {displayName}
                {hasTelegram ? " · تلگرام فعال" : " · بدون تلگرام"}
              </div>
            ) : (
              <FormInput
                label={t("نام شریک")}
                placeholder={t("مثلاً علی رضایی")}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            )}

            <FormInput
              label={t("سهم (درصد) — اختیاری")}
              placeholder={t("مثلاً ۵۰")}
              value={sharePercent}
              onChange={(e) => setSharePercent(e.target.value)}
              inputMode="numeric"
            />
            <FormSelect
              label={t("سطح دسترسی")}
              selectedKey={permissionLevel}
              onSelectionChange={setPermissionLevel}
              options={[
                { id: "viewer", label: "مشاهده — فقط خواندن" },
                { id: "editor", label: "ویرایشگر — افزودن تراکنش و تسک" },
              ]}
            />
            <FormTextArea
              label={t("یادداشت — اختیاری")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onPress={() => setStep("mobile")}
              >
                بازگشت
              </Button>
              <Button
                className="flex-1"
                onPress={() => void submitPartner()}
                isPending={saving}
              >
                {exists ? "ارسال دعوت" : "ثبت شریک"}
              </Button>
            </div>
          </>
        ) : null}

        {step === "result" ? (
          <>
            <p className="text-sm leading-7 text-muted">
              {exists
                ? "دعوت برای شریک ارسال شد. تا زمانی که تأیید نکند، وضعیت «در انتظار» است."
                : "شریک به عنوان مخاطب خارج از برنامه ثبت شد و برای حساب‌کتاب در دسترس است."}
            </p>

            {inviteLink ? (
              <div className="space-y-2 rounded-xl bg-surface-secondary p-3">
                <p className="text-xs text-muted">{t("لینک تأیید برای شریک")}</p>
                <p className="break-all text-sm font-medium">{inviteLink}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onPress={() => void copyInviteLink()}
                >
                  کپی لینک
                </Button>
              </div>
            ) : null}

            {exists && telegramSent ? (
              <p className="rounded-xl bg-success/10 px-3 py-2 text-sm text-success-foreground">
                پیام دعوت از طریق تلگرام هم ارسال شد
              </p>
            ) : null}

            {exists && !telegramSent && hasTelegram === false ? (
              <div className="space-y-2 rounded-xl bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
                <p>{t("تلگرام این کاربر فعال نیست — لینک را دستی برایش بفرستید")}</p>
                {inviteLink ? (
                  <>
                    <p className="break-all text-xs font-medium text-foreground">{inviteLink}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onPress={() => void copyInviteLink()}
                    >
                      کپی لینک دعوت
                    </Button>
                  </>
                ) : null}
              </div>
            ) : null}

            <Button className="w-full" size="lg" onPress={closeModal}>
              بستن
            </Button>
          </>
        ) : null}
        </Modal.Body>
      </AppModalDialog>
    </AppModal>
  );
}
