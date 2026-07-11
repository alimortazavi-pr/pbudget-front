"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Modal } from "@heroui/react";
import { Add, Profile2User } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as partnersApi from "@/common/api/partners";
import type { IVenture } from "@/common/interfaces/partner.interface";
import { showToast } from "@/common/utils/toast";
import { PageHeroSection } from "@/components/common/layout/PageHeroSection";
import { FormInput, FormTextArea } from "@/components/common/form/FormFields";
import {
  AppModal,
  AppModalDialog,
  AppModalHeader,
} from "@/components/common/ui/AppModal";
import { PendingInvitesBanner } from "@/components/pages/partners/PendingInvitesBanner";

export function VenturesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [ventures, setVentures] = useState<IVenture[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await partnersApi.fetchVentures();
      setVentures(list);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("pages.ventures.loadError"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createVenture() {
    if (!title.trim()) {
      showToast(t("auto.k2ed047dbfc"));
      return;
    }

    setSaving(true);
    try {
      const venture = await partnersApi.createVenture({
        title: title.trim(),
        description: description.trim(),
      });
      showToast(t("auto.kbcc548aabc"), "success");
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      router.push(PATHS.VENTURE(venture._id));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("pages.ventures.createError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <PageHeroSection
        variant="violetDeep"
        eyebrow={t("pageHero.ventures.eyebrow")}
        title={t("pageHero.ventures.title")}
        description={t("pageHero.ventures.description")}
        descriptionClassName="mt-2 text-sm leading-7 text-white/85"
        footer={
          <Button
            className="mt-4 bg-white text-violet-700"
            onPress={() => setCreateOpen(true)}
          >
            <Add size={18} />
            {t("pageHero.ventures.newButton")}
          </Button>
        }
      />

      <PendingInvitesBanner />

      {loading ? (
        <div className="glass rounded-2xl p-10 text-center text-muted">
          {t("common.loading")}
        </div>
      ) : ventures.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Profile2User size={40} className="mx-auto text-muted" />
          <p className="mt-3 text-muted">{t("auto.k09f9dfbe13")}</p>
          <p className="mt-1 text-sm text-muted">
            {t("auto.k860ef4d1a0")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ventures.map((venture) => (
            <Link
              key={venture._id}
              href={PATHS.VENTURE(venture._id)}
              className="glass block rounded-2xl p-4 transition hover:bg-surface-secondary/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{venture.title}</p>
                  {venture.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">
                      {venture.description}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-lg bg-surface-secondary px-2 py-1 text-xs text-muted">
                  {venture.partnerCount ?? 0} {t("auto.k1a48ffa3cf")}
                </span>
                {venture.accessRole === "partner" ? (
                  <span className="shrink-0 rounded-lg bg-accent/15 px-2 py-1 text-xs text-accent">
                    {t("auto.kc406af7131")}
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}

      <AppModal open={createOpen} onOpenChange={setCreateOpen}>
        <AppModalDialog className="sm:max-w-md">
          <AppModalHeader onClose={() => setCreateOpen(false)}>
            <Modal.Heading>{t("auto.k6048d21e0c")}</Modal.Heading>
            <p className="mt-1 text-sm text-muted">
              {t("auto.k53e13a8378")}
            </p>
          </AppModalHeader>
          <Modal.Body className="space-y-4">
            <FormInput
              label={t("auto.kab314cebea")}
              placeholder={t("auto.kc60c592d2c")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <FormTextArea
              label={t("auto.kac3c0cb65a")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button
              className="w-full"
              size="lg"
              onPress={() => void createVenture()}
              isPending={saving}
            >
              {t("common.create")}
            </Button>
          </Modal.Body>
        </AppModalDialog>
      </AppModal>
    </div>
  );
}
