"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Modal } from "@heroui/react";
import { Add, Profile2User } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as partnersApi from "@/common/api/partners";
import type { IVenture } from "@/common/interfaces/partner.interface";
import { showToast } from "@/common/utils/toast";
import { FormInput, FormTextArea } from "@/components/common/form/FormFields";
import {
  AppModal,
  AppModalDialog,
  AppModalHeader,
} from "@/components/common/ui/AppModal";
import { PendingInvitesBanner } from "@/components/pages/partners/PendingInvitesBanner";

export function VenturesPage() {
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
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createVenture() {
    if (!title.trim()) {
      showToast("نام کسب‌وکار الزامی است");
      return;
    }

    setSaving(true);
    try {
      const venture = await partnersApi.createVenture({
        title: title.trim(),
        description: description.trim(),
      });
      showToast("کسب‌وکار ایجاد شد", "success");
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      router.push(PATHS.VENTURE(venture._id));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در ایجاد");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white shadow-lg">
        <p className="text-sm font-medium text-white/80">همکاری و شراکت</p>
        <h1 className="mt-1 text-2xl font-bold">کسب‌وکارها و شرکا</h1>
        <p className="mt-2 text-sm leading-7 text-white/85">
          برای مشارکت‌هایی که فقط پروژه نیستند — رستوران، فروشگاه، سرمایه‌گذاری
          مشترک و هر کسب‌وکار دیگر.
        </p>
        <Button
          className="mt-4 bg-white text-violet-700"
          onPress={() => setCreateOpen(true)}
        >
          <Add size={18} />
          کسب‌وکار جدید
        </Button>
      </section>

      <PendingInvitesBanner />

      {loading ? (
        <div className="glass rounded-2xl p-10 text-center text-muted">
          در حال بارگذاری…
        </div>
      ) : ventures.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Profile2User size={40} className="mx-auto text-muted" />
          <p className="mt-3 text-muted">هنوز کسب‌وکاری ثبت نشده</p>
          <p className="mt-1 text-sm text-muted">
            یا از تب شرکا در هر پروژه استفاده کنید
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
                  {venture.partnerCount ?? 0} شریک
                </span>
                {venture.accessRole === "partner" ? (
                  <span className="shrink-0 rounded-lg bg-accent/15 px-2 py-1 text-xs text-accent">
                    مشترک
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
            <Modal.Heading>کسب‌وکار جدید</Modal.Heading>
            <p className="mt-1 text-sm text-muted">
              برای مشارکت‌هایی جدا از پروژه‌های ثبت‌شده
            </p>
          </AppModalHeader>
          <Modal.Body className="space-y-4">
            <FormInput
              label="نام کسب‌وکار"
              placeholder="مثلاً کافه مشترک"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <FormTextArea
              label="توضیحات — اختیاری"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button
              className="w-full"
              size="lg"
              onPress={() => void createVenture()}
              isPending={saving}
            >
              ایجاد
            </Button>
          </Modal.Body>
        </AppModalDialog>
      </AppModal>
    </div>
  );
}
