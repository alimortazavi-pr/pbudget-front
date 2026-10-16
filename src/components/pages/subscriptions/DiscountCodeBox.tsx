"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Input } from "@heroui/react";
import { CloseCircle, DiscountShape, TickCircle } from "iconsax-reactjs";

import * as subscriptionApi from "@/common/api/subscriptions";
import type { DiscountValidation } from "@/common/api/subscriptions";
import type { SubscriptionPlan } from "@/common/interfaces/subscription.interface";
import { formatPlanPrice, toPersianDigits } from "@/common/utils";

export type DiscountResults = Record<string, DiscountValidation>;

function normalize(raw: string) {
  return raw
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/\s+/g, "")
    .toUpperCase();
}

/**
 * Prices every eligible plan with the code on the server as the user types.
 * The page only displays what the server returns; it never computes prices.
 */
export function useDiscountCode(plans: SubscriptionPlan[]) {
  const [code, setCode] = useState("");
  const [results, setResults] = useState<DiscountResults>({});
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const planIds = plans.map((plan) => plan._id).join(",");

  useEffect(() => {
    const normalized = normalize(code);
    const id = ++requestId.current;
    if (normalized.length < 3 || !planIds) {
      setResults({});
      setError(null);
      setChecking(false);
      return;
    }
    setChecking(true);
    const timer = window.setTimeout(async () => {
      try {
        const entries = await Promise.all(planIds.split(",").map(async (planId) => [planId, await subscriptionApi.validateDiscountCode(planId, normalized)] as const));
        if (id !== requestId.current) return;
        setResults(Object.fromEntries(entries));
        setError(null);
      } catch (caught) {
        if (id !== requestId.current) return;
        setResults({});
        const status = (caught as { response?: { status?: number } })?.response?.status;
        setError(status === 429 ? "تعداد تلاش‌ها زیاد است؛ چند دقیقه بعد دوباره امتحان کنید." : "بررسی کد ممکن نشد؛ دوباره تلاش کنید.");
      } finally {
        if (id === requestId.current) setChecking(false);
      }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [code, planIds]);

  const anyValid = Object.values(results).some((result) => result.valid);
  /** The code to send for a plan, only when the server accepted it for that plan. */
  const codeFor = (planId: string) => (results[planId]?.valid ? normalize(code) : undefined);
  return { code, setCode, results, checking, error, anyValid, codeFor };
}

export function DiscountCodeBox({ discount, hint }: { discount: ReturnType<typeof useDiscountCode>; hint?: string }) {
  const [open, setOpen] = useState(false);
  const { code, setCode, results, checking, error, anyValid } = discount;
  const firstReason = Object.values(results).find((result) => !result.valid) as Extract<DiscountValidation, { valid: false }> | undefined;
  const firstValid = Object.values(results).find((result) => result.valid) as Extract<DiscountValidation, { valid: true }> | undefined;

  if (!open && !code) {
    return (
      <div className="flex justify-center">
        <button type="button" onClick={() => setOpen(true)} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-accent/50 bg-accent/5 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/10">
          <DiscountShape size={18} variant="Bold" />
          کد تخفیف دارید؟
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-accent/30 bg-surface p-4">
      <label className="flex items-center gap-2 text-sm font-semibold" htmlFor="plans-discount-code">
        <DiscountShape size={18} className="text-accent" variant="Bold" />
        کد تخفیف
      </label>
      <div className="mt-2 flex gap-2">
        <Input
          id="plans-discount-code"
          variant="secondary"
          dir="ltr"
          autoComplete="off"
          autoFocus
          className="w-full font-mono uppercase tracking-wider"
          placeholder="مثلاً NOWRUZ"
          value={code}
          onChange={(event) => setCode(event.target.value.slice(0, 40))}
        />
        {code ? (
          <Button
            isIconOnly
            variant="ghost"
            aria-label="حذف کد"
            onPress={() => {
              setCode("");
              setOpen(false);
            }}
          >
            <CloseCircle size={18} />
          </Button>
        ) : null}
      </div>
      <div className="mt-2 min-h-5 text-xs leading-5" aria-live="polite">
        {checking ? (
          <span className="text-muted">در حال بررسی کد…</span>
        ) : error ? (
          <span className="text-danger">{error}</span>
        ) : anyValid && firstValid ? (
          <span className="inline-flex items-center gap-1 font-semibold text-success-foreground">
            <TickCircle size={15} variant="Bold" />
            کد «{firstValid.code}» اعمال شد
            {firstValid.type === "percent" ? ` — ${toPersianDigits(firstValid.value)}٪ تخفیف` : ` — ${formatPlanPrice(firstValid.discount)} ${firstValid.priceUnit} تخفیف`}؛ قیمت جدید روی پلن‌ها نمایش داده شده است.
          </span>
        ) : firstReason ? (
          <span className="text-danger">{firstReason.reason}</span>
        ) : null}
      </div>
      {hint ? <p className="mt-1 text-[11px] leading-5 text-muted">{hint}</p> : null}
    </div>
  );
}

/** Price block for a plan card: struck-through original and the server's discounted price. */
export function DiscountedPrice({ result, codeApplies }: { result?: DiscountValidation; codeApplies: boolean }) {
  if (!result || !codeApplies) return null;
  if (!result.valid) return <p className="mt-1 text-xs text-danger">{result.reason}</p>;
  const percent = result.original ? Math.round((result.discount / result.original) * 100) : 0;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-sm">
      <span className="text-muted line-through">{formatPlanPrice(result.original)}</span>
      <span className="font-extrabold text-success-foreground">
        {result.final === 0 ? "رایگان" : `${formatPlanPrice(result.final)} ${result.priceUnit}`}
      </span>
      <span className="rounded-full bg-success/20 px-2 py-0.5 text-[11px] font-bold text-success-foreground">{toPersianDigits(percent)}٪ تخفیف</span>
    </div>
  );
}
