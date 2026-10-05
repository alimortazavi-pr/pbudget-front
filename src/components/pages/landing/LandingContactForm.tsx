"use client";

import { useState } from "react";
import { Button, Input, Label, TextArea, TextField } from "@heroui/react";
import { DirectboxSend } from "iconsax-reactjs";

import { submitSiteContact } from "@/common/api/site";
import { toEnglishDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { useTranslation } from "@/components/providers/LanguageProvider";

export function LandingContactForm() {
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateForm() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = t("auto.kd403fd3ef7");

    const phoneNorm = toEnglishDigits(phone.trim());
    if (phoneNorm && !/^09\d{9}$/.test(phoneNorm)) {
      next.phone = t("auto.kbe90794ac7");
    }

    const emailTrim = email.trim();
    if (emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      next.email = t("auto.kbf6143fb62");
    }

    if (message.trim().length < 10) {
      next.message = t("auto.kd4f0ec7945");
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setSending(true);
    try {
      const res = await submitSiteContact({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: toEnglishDigits(phone.trim()) || undefined,
        message: message.trim(),
      });
      showToast(res.message, "success");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setErrors({});
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.k6102777c2b"));
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-5 sm:grid-cols-2">
      <TextField className="gap-2" isInvalid={Boolean(errors.name)}>
        <Label className="text-sm font-medium">{t("common.name")}</Label>
        <Input
          variant="secondary"
          className="w-full"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: "" })); }}
          required
        />
        {errors.name ? <span className="text-sm text-danger">{errors.name}</span> : null}
      </TextField>
      <TextField className="gap-2" isInvalid={Boolean(errors.phone)}>
        <Label className="text-sm font-medium">{t("auto.kc771d04490")}</Label>
        <Input
          type="tel"
          inputMode="tel"
          variant="secondary"
          className="w-full"
          placeholder={t("auto.k31b5be1e8a")}
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setErrors((prev) => ({ ...prev, phone: "" })); }}
        />
        {errors.phone ? <span className="text-sm text-danger">{errors.phone}</span> : null}
      </TextField>
      <TextField className="gap-2 sm:col-span-2" isInvalid={Boolean(errors.email)}>
        <Label className="text-sm font-medium">{t("auto.kc7df355066")}</Label>
        <Input
          type="email"
          variant="secondary"
          className="w-full"
          dir="ltr"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: "" })); }}
        />
        {errors.email ? <span className="text-sm text-danger">{errors.email}</span> : null}
      </TextField>
      <TextField className="gap-2 sm:col-span-2" isInvalid={Boolean(errors.message)}>
        <Label className="text-sm font-medium">{t("auto.k69b7c72077")}</Label>
        <TextArea
          variant="secondary"
          className="w-full min-h-[9rem] resize-y"
          rows={5}
          value={message}
          onChange={(e) => { setMessage(e.target.value); setErrors((prev) => ({ ...prev, message: "" })); }}
          required
        />
        {errors.message ? <span className="text-sm text-danger">{errors.message}</span> : null}
      </TextField>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" isDisabled={sending}>
          <DirectboxSend size={18} />
          {sending ? t("auto.k5dbce29fce") : t("auto.kce3479088e")}
        </Button>
      </div>
    </form>
  );
}
