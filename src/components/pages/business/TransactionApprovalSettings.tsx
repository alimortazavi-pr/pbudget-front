"use client";

import { useState } from "react";
import { Button, Input, Label } from "@heroui/react";

import * as businessApi from "@/common/api/business";
import { showToast } from "@/common/utils/toast";

export function TransactionApprovalSettings({
  businessId,
  initialThreshold,
}: {
  businessId: string;
  initialThreshold: number;
}) {
  const [threshold, setThreshold] = useState(String(initialThreshold || ""));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await businessApi.updateBusiness(businessId, {
        settings: {
          transactionApprovalThreshold: Number(threshold) || 0,
        },
      });
      showToast("آستانه تأیید ذخیره شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass rounded-2xl p-4 space-y-3">
      <h2 className="font-semibold">تأیید تراکنش‌های بزرگ</h2>
      <p className="text-sm text-muted">
        تراکنش‌های بالاتر از این مبلغ (تومان) نیاز به تأیید مدیر دارند. صفر =
        غیرفعال
      </p>
      <div>
        <Label className="mb-1 block text-sm">آستانه (تومان)</Label>
        <Input
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
        />
      </div>
      <Button className="w-full" onPress={() => void save()} isPending={saving}>
        ذخیره
      </Button>
    </section>
  );
}
