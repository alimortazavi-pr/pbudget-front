"use client";

import { useState } from "react";
import Link from "next/link";
import { Coin1 } from "iconsax-reactjs";

import * as profileApi from "@/common/api/profile";
import { PATHS } from "@/common/constants";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { SwitchRow } from "@/components/common/form/FormKit";
import { useTranslation } from "@/i18n";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { setProfile, userSelector } from "@/stores/profile";

/** Features that stay out of sight until the user turns them on. */
export function OptionalModulesSection() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const [saving, setSaving] = useState(false);
  const assetsOn = Boolean(user?.features?.assets);

  async function toggleAssets(next: boolean) {
    setSaving(true);
    try {
      const updated = await profileApi.updateUserFeatures({ assets: next });
      dispatch(setProfile(updated));
      showToast(next ? t("feat.modules.assetsOn") : t("feat.modules.assetsOff"), "success");
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass space-y-4 rounded-2xl p-5" data-tour="settings-modules">
      <div>
        <h2 className="text-lg font-bold">{t("feat.modules.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("feat.modules.subtitle")}</p>
      </div>
      <SwitchRow
        label={t("feat.modules.assets")}
        description={t("feat.modules.assetsHint")}
        selected={assetsOn}
        isDisabled={saving || !user}
        onChange={(next) => void toggleAssets(next)}
      />
      {assetsOn ? (
        <Link
          href={PATHS.ASSETS}
          className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
        >
          <Coin1 size={16} />
          {t("feat.modules.openAssets")}
        </Link>
      ) : null}
    </section>
  );
}
