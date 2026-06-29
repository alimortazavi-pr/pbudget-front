"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { Add, Building, Profile2User } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as businessApi from "@/common/api/business";
import type { IBusiness } from "@/common/interfaces/business.interface";
import { storage } from "@/common/utils/storage";
import { showToast } from "@/common/utils/toast";
import { FormInput, FormTextArea } from "@/components/common/form/FormFields";
import {
  AppModal,
  AppModalDialog,
  AppModalHeader,
} from "@/components/common/ui/AppModal";
import { PendingBusinessInvitesBanner } from "@/components/pages/business/PendingBusinessInvitesBanner";
import { setBusinesses } from "@/stores/businessContext";
import { useAppDispatch } from "@/stores/hooks";

export function BusinessListPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [businesses, setLocalBusinesses] = useState<IBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await businessApi.fetchMyBusinesses();
      setLocalBusinesses(list);
      dispatch(setBusinesses(list));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createBusiness() {
    if (!title.trim()) {
      showToast("نام کسب‌وکار الزامی است");
      return;
    }

    setSaving(true);
    try {
      const business = await businessApi.createBusiness({
        title: title.trim(),
        description: description.trim(),
      });
      showToast("کسب‌وکار ایجاد شد", "success");
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      storage.setActiveBusinessId(business._id);
      router.push(PATHS.BUSINESS_DETAIL(business._id));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در ایجاد");
    } finally {
      setSaving(false);
    }
  }

  function enterBusiness(id: string) {
    storage.setActiveBusinessId(id);
    router.push(PATHS.BUSINESS_DETAIL(id));
  }

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white shadow-lg">
        <p className="text-sm font-medium text-white/80">فضای سازمانی</p>
        <h1 className="mt-1 text-2xl font-bold">کسب‌وکارهای من</h1>
        <p className="mt-2 text-sm leading-7 text-white/85">
          مدیریت پرسنل، مالی سازمان، حضور و غیاب کارکنان — جدا از حساب شخصی
          شما.
        </p>
        <Button
          className="mt-4 bg-white text-violet-700"
          onPress={() => setCreateOpen(true)}
        >
          <Add size={18} />
          کسب‌وکار جدید
        </Button>
      </section>

      <PendingBusinessInvitesBanner />

      {loading ? (
        <div className="glass rounded-2xl p-10 text-center text-muted">
          در حال بارگذاری…
        </div>
      ) : businesses.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Building size={40} className="mx-auto text-muted" />
          <p className="mt-3 text-muted">هنوز عضو هیچ کسب‌وکاری نیستید</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {businesses.map((b) => (
            <li key={b._id}>
              <button
                type="button"
                onClick={() => enterBusiness(b._id)}
                className="glass flex w-full items-center gap-3 rounded-2xl p-4 text-right transition hover:bg-surface-secondary"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                  <Profile2User size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{b.title}</p>
                  <p className="text-sm text-muted">
                    {b.accessRole === "owner" ? "مالک" : "کارمند"}
                    {b.memberPreset ? ` · ${b.memberPreset}` : ""}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <AppModal open={createOpen} onOpenChange={setCreateOpen}>
        <AppModalDialog>
          <AppModalHeader>کسب‌وکار جدید</AppModalHeader>
          <div className="space-y-4 p-4">
            <FormInput
              label="نام کسب‌وکار"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <FormTextArea
              label="توضیحات"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button
              className="w-full"
              onPress={() => void createBusiness()}
              isPending={saving}
            >
              ایجاد
            </Button>
          </div>
        </AppModalDialog>
      </AppModal>
    </div>
  );
}
