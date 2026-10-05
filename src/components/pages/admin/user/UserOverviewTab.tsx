"use client";

import { useEffect, useState } from "react";
import { Button, Input, TextArea } from "@heroui/react";
import { ArrowDown, ArrowUp, Calendar, Note1, ReceiptText, Wallet2 } from "iconsax-reactjs";

import * as insightsApi from "@/common/api/admin-insights";
import type { AdminUserOverview } from "@/common/interfaces/admin";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { AdminPanel, EmptyState, Field, FormDialog, KeyValue, NativeSelect, Pill, StatTile } from "../ui/AdminUi";
import { CURRENCY_LABELS, formatDateFa, formatMoneyFa, formatNumberFa, formatRelativeFa } from "../ui/admin-format";

export function UserOverviewTab({
  overview,
  onReload,
  onOpenData,
}: {
  overview: AdminUserOverview;
  onReload: () => Promise<void> | void;
  onOpenData: (key: string) => void;
}) {
  const { user } = overview;
  const [note, setNote] = useState(user.adminNote ?? "");
  const [savingNote, setSavingNote] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);

  useEffect(() => setNote(user.adminNote ?? ""), [user.adminNote]);

  const balances = user.walletBalances ?? { toman: 0, usd: 0, dinar: 0 };
  const extraBalances = (["usd", "dinar"] as const).filter((currency) => balances[currency]);

  async function saveNote() {
    setSavingNote(true);
    try {
      await insightsApi.setUserNote(user._id, note);
      showToast("یادداشت ذخیره شد", "success");
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="موجودی کیف پول"
          value={formatMoneyFa(balances.toman, "toman")}
          hint={
            extraBalances.length ? (
              extraBalances.map((currency) => formatMoneyFa(balances[currency], currency)).join(" · ")
            ) : (
              <button type="button" className="cursor-pointer font-semibold text-accent" onClick={() => setWalletOpen(true)}>
                اصلاح موجودی
              </button>
            )
          }
          icon={<Wallet2 size={20} variant="Bold" />}
        />
        <StatTile
          label="کل تراکنش‌ها"
          value={formatNumberFa(overview.counts.budgets ?? 0)}
          hint={`${formatNumberFa(overview.transactionsLast30Days)} در ۳۰ روز اخیر`}
          icon={<ReceiptText size={20} variant="Bold" />}
          tone="info"
        />
        <StatTile
          label="آخرین تراکنش"
          value={<span className="text-lg">{formatRelativeFa(overview.lastTransactionAt, "ندارد")}</span>}
          hint={overview.firstTransactionAt ? `اولین: ${formatDateFa(overview.firstTransactionAt)}` : undefined}
          icon={<Calendar size={20} />}
          tone="success"
        />
        <StatTile
          label="تعداد ورود"
          value={formatNumberFa(user.loginCount ?? 0)}
          hint={`آخرین ورود ${formatRelativeFa(user.lastLoginAt)}`}
          icon={<ArrowDown size={20} />}
          tone="neutral"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <AdminPanel
          title="دفتر مالی"
          description="جمع دریافت و پرداخت به تفکیک ارز"
          actions={
            <Button size="sm" variant="secondary" onPress={() => setWalletOpen(true)}>
              <Wallet2 size={16} />
              اصلاح موجودی
            </Button>
          }
        >
          {overview.ledger.length === 0 ? (
            <EmptyState title="هنوز تراکنشی ثبت نکرده" />
          ) : (
            <div className="space-y-3">
              {overview.ledger.map((row) => (
                <div key={row.currency} className="grid gap-3 rounded-xl bg-surface-secondary/50 p-3 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted">ارز</p>
                    <p className="font-semibold">{CURRENCY_LABELS[row.currency] ?? row.currency} · {formatNumberFa(row.count)} ردیف</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-xs text-muted"><ArrowDown size={12} />دریافت</p>
                    <p className="font-semibold text-income tabular-nums">{formatMoneyFa(row.income, row.currency)}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-xs text-muted"><ArrowUp size={12} />پرداخت</p>
                    <p className="font-semibold text-expense tabular-nums">{formatMoneyFa(row.cost, row.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">خالص</p>
                    <p className={`font-semibold tabular-nums ${row.net >= 0 ? "text-income" : "text-expense"}`}>{formatMoneyFa(row.net, row.currency)}</p>
                  </div>
                </div>
              ))}
              {overview.openDebts.length ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {overview.openDebts.map((debt) => (
                    <Pill key={`${debt.type}-${debt.currency}`} tone={debt.type === "receivable" ? "success" : "danger"}>
                      {debt.type === "receivable" ? "طلب باز" : "بدهی باز"} {formatNumberFa(debt.count)} مورد · {formatMoneyFa(debt.remaining, debt.currency)}
                    </Pill>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </AdminPanel>

        <AdminPanel title="یادداشت داخلی" description="فقط ادمین‌ها می‌بینند؛ برای پیگیری‌ها و توافق‌ها">
          <TextArea
            aria-label="یادداشت داخلی"
            variant="secondary"
            rows={5}
            className="w-full"
            placeholder="مثلاً: تماس گرفت برای تمدید، قرار شد هفته بعد پیگیری شود…"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="mt-3 flex justify-end">
            <Button size="sm" isPending={savingNote} isDisabled={note === (user.adminNote ?? "")} onPress={() => void saveNote()}>
              <Note1 size={16} />
              ذخیره یادداشت
            </Button>
          </div>
        </AdminPanel>
      </div>

      <AdminPanel title="استفاده از امکانات" description="روی هر مورد بزنید تا داده‌هایش را ببینید و ویرایش کنید">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {overview.collections.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onOpenData(item.key)}
              className={`cursor-pointer rounded-xl border p-3 text-start transition hover:border-accent/40 ${
                item.count ? "border-border/60 bg-surface" : "border-dashed border-border/60 bg-surface-secondary/30 text-muted"
              }`}
            >
              <p className="text-xs text-muted">{item.label}</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{formatNumberFa(item.count)}</p>
            </button>
          ))}
        </div>
      </AdminPanel>

      <AdminPanel title="تنظیمات حساب">
        <div className="grid gap-x-8 sm:grid-cols-2">
          <KeyValue label="ارز پیش‌فرض">{CURRENCY_LABELS[user.preferences?.currency] ?? user.preferences?.currency}</KeyValue>
          <KeyValue label="تقویم">{user.preferences?.dateCalendar === "gregorian" ? "میلادی" : "شمسی"}</KeyValue>
          <KeyValue label="واحد نمایش">{user.preferences?.moneyDisplayUnit === "rial" ? "ریال" : "تومان"}</KeyValue>
          <KeyValue label="موبایل تأییدشده">{user.isVerifiedMobile ? "بله" : "خیر"}</KeyValue>
          <KeyValue label="رمز عبور">{user.hasPassword ? "تنظیم شده" : "ندارد"}</KeyValue>
          <KeyValue label="تلگرام">{user.telegramLinked ? "متصل" : "متصل نیست"}</KeyValue>
        </div>
      </AdminPanel>

      <WalletAdjustDialog open={walletOpen} onOpenChange={setWalletOpen} userId={user._id} onDone={onReload} />
    </div>
  );
}

function WalletAdjustDialog({
  open,
  onOpenChange,
  userId,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onDone: () => Promise<void> | void;
}) {
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("toman");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount("");
      setDirection("add");
      setCurrency("toman");
    }
  }, [open]);

  const numeric = Number(amount.replace(/[,٬\s]/g, "").replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))));

  async function submit() {
    if (!Number.isFinite(numeric) || numeric <= 0) {
      showToast("مبلغ معتبر وارد کنید", "warning");
      return;
    }
    setSaving(true);
    try {
      await insightsApi.adjustUserWallet(userId, direction === "add" ? numeric : -numeric, currency);
      showToast("موجودی اصلاح شد و تراکنش «تنظیم موجودی» ثبت شد", "success");
      onOpenChange(false);
      await onDone();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="اصلاح موجودی کیف پول"
      description="برای اینکه دفتر حساب همیشه با موجودی بخواند، اصلاح به صورت یک تراکنش «تنظیم موجودی» با تاریخ امروز ثبت می‌شود."
      isPending={saving}
      onSubmit={() => void submit()}
      submitLabel="ثبت اصلاح"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="نوع">
          <NativeSelect
            ariaLabel="نوع"
            value={direction}
            onChange={(value) => setDirection(value as "add" | "remove")}
            options={[
              { value: "add", label: "افزایش موجودی" },
              { value: "remove", label: "کاهش موجودی" },
            ]}
          />
        </Field>
        <Field label="ارز">
          <NativeSelect
            ariaLabel="ارز"
            value={currency}
            onChange={setCurrency}
            options={[
              { value: "toman", label: "تومان" },
              { value: "usd", label: "دلار" },
              { value: "dinar", label: "دینار" },
            ]}
          />
        </Field>
      </div>
      <Field label="مبلغ">
        <Input variant="secondary" dir="ltr" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
      </Field>
    </FormDialog>
  );
}
