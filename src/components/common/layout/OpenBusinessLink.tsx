"use client";

import { useTranslation } from "@/i18n";

import { useState } from "react";
import { Building4 } from "iconsax-reactjs";

import * as ssoApi from "@/common/api/sso";
import { showErrorToast } from "@/common/utils";

const BUSINESS_URL = process.env.NEXT_PUBLIC_BUSINESS_URL ?? "https://business.pdesk.ir";

/** Opens میز کسب‌وکار signed in as the same person (one-time ticket, no password). */
export function OpenBusinessLink({ className }: { className: string }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  async function open() {
    setBusy(true);
    try {
      const ticket = await ssoApi.getBusinessTicket();
      window.location.assign(`${BUSINESS_URL}/sso?ticket=${encodeURIComponent(ticket)}`);
    } catch (error) {
      setBusy(false);
      showErrorToast(error);
    }
  }

  return (
    <button type="button" className={className} onClick={() => void open()} disabled={busy}>
      <Building4 size={20} />
      {t("sso.openBusiness")}
    </button>
  );
}
