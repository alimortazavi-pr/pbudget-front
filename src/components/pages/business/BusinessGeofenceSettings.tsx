"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { Location } from "iconsax-reactjs";

import * as businessApi from "@/common/api/business";
import { useGeolocation } from "@/common/hooks/useGeolocation";
import { showToast } from "@/common/utils/toast";
import { FormInput } from "@/components/common/form/FormFields";

type BusinessGeofenceSettingsProps = {
  businessId: string;
  initial?: {
    lat?: number;
    lng?: number;
    radiusM?: number;
  } | null;
};

export function BusinessGeofenceSettings({
  businessId,
  initial,
}: BusinessGeofenceSettingsProps) {
  const { requestPosition } = useGeolocation();
  const [lat, setLat] = useState(String(initial?.lat ?? ""));
  const [lng, setLng] = useState(String(initial?.lng ?? ""));
  const [radiusM, setRadiusM] = useState(String(initial?.radiusM ?? "100"));
  const [saving, setSaving] = useState(false);

  async function useCurrentLocation() {
    const pos = await requestPosition();
    if (!pos) return;
    setLat(String(pos.lat));
    setLng(String(pos.lng));
    showToast("موقعیت فعلی ثبت شد", "success");
  }

  async function save() {
    const latN = Number(lat);
    const lngN = Number(lng);
    const radius = Number(radiusM);
    if (!latN || !lngN || !radius) {
      showToast("مختصات و شعاع الزامی است");
      return;
    }
    setSaving(true);
    try {
      await businessApi.updateBusiness(businessId, {
        settings: {
          geofence: { lat: latN, lng: lngN, radiusM: radius },
        },
      });
      showToast("محدوده محل کار ذخیره شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setSaving(false);
    }
  }

  async function clearGeofence() {
    setSaving(true);
    try {
      await businessApi.updateBusiness(businessId, {
        settings: { geofence: null },
      });
      setLat("");
      setLng("");
      setRadiusM("100");
      showToast("محدوده غیرفعال شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass space-y-3 rounded-2xl p-4">
      <h2 className="flex items-center gap-2 font-semibold">
        <Location size={18} />
        محدوده GPS محل کار
      </h2>
      <p className="text-sm text-muted">
        پرسنل فقط داخل این محدوده می‌توانند ورود/خروج ثبت کنند. در غیر این صورت
        باید درخواست دستی بدهند.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <FormInput label="عرض جغرافیایی" value={lat} onChange={(e) => setLat(e.target.value)} />
        <FormInput label="طول جغرافیایی" value={lng} onChange={(e) => setLng(e.target.value)} />
        <FormInput
          label="شعاع (متر)"
          value={radiusM}
          onChange={(e) => setRadiusM(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onPress={() => void useCurrentLocation()}>
          موقعیت فعلی من
        </Button>
        <Button size="sm" onPress={() => void save()} isPending={saving}>
          ذخیره محدوده
        </Button>
        <Button variant="ghost" size="sm" onPress={() => void clearGeofence()}>
          غیرفعال کردن
        </Button>
      </div>
    </section>
  );
}
