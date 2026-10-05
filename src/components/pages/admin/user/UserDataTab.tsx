"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input, Switch } from "@heroui/react";
import { Add, ArrowRotateLeft, Code1, Edit2, Trash } from "iconsax-reactjs";

import * as insightsApi from "@/common/api/admin-insights";
import type { AdminUserOverview, AdminUserRecords } from "@/common/interfaces/admin";
import { toPersianDigits } from "@/common/utils";
import { showErrorToast, showToast } from "@/common/utils/toast";
import {
  AdminPanel,
  ConfirmDialog,
  EmptyState,
  Field,
  FormDialog,
  NativeSelect,
  PaginationBar,
  Pill,
  SegmentedTabs,
  SkeletonRows,
} from "../ui/AdminUi";
import { JsonDocumentDialog } from "../ui/JsonDocumentDialog";
import { CURRENCY_LABELS, formatDateTimeFa, formatMoneyFa } from "../ui/admin-format";

type RecordRow = Record<string, unknown> & { _id: string };

const TITLE_FIELDS = ["title", "person", "name", "content", "description", "fileName", "bankName"];
const AMOUNT_FIELDS = ["price", "totalAmount", "amount", "budget", "remainingAmount", "hourlyRate"];

function pick(row: RecordRow, fields: string[]) {
  for (const field of fields) {
    const value = row[field];
    if (value !== undefined && value !== null && value !== "") return { field, value };
  }
  return null;
}

function dateOf(row: RecordRow) {
  const raw = row.createdAt as unknown;
  if (raw && typeof raw === "object" && "$date" in (raw as Record<string, unknown>)) {
    return String((raw as { $date: string }).$date);
  }
  return typeof raw === "string" ? raw : null;
}

function jalaliToday() {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", { year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date());
  const get = (type: string) => (parts.find((part) => part.type === type)?.value ?? "").replace(/\D/g, "");
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function UserDataTab({
  userId,
  overview,
  activeKey,
  onKeyChange,
  onChanged,
}: {
  userId: string;
  overview: AdminUserOverview;
  activeKey: string;
  onKeyChange: (key: string) => void;
  onChanged: () => Promise<void> | void;
}) {
  const [page, setPage] = useState(1);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [data, setData] = useState<AdminUserRecords | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingJson, setEditingJson] = useState<RecordRow | null>(null);
  const [deleting, setDeleting] = useState<RecordRow | null>(null);
  const [txDialog, setTxDialog] = useState<{ open: boolean; row: RecordRow | null }>({ open: false, row: null });
  const [busy, setBusy] = useState(false);

  const tabs = useMemo(
    () => overview.collections.map((item) => ({ id: item.key, label: item.label, count: item.count })),
    [overview.collections],
  );
  const collectionName = activeKey;
  const isLedger = activeKey === "budgets";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await insightsApi.fetchUserRecords(userId, activeKey, { page, limit: 25, includeDeleted }));
    } catch (error) {
      showErrorToast(error, "دریافت داده‌ها ناموفق بود");
    } finally {
      setLoading(false);
    }
  }, [activeKey, includeDeleted, page, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function afterChange(message: string) {
    showToast(message, "success");
    await Promise.all([load(), onChanged()]);
  }

  async function saveJson(value: Record<string, unknown>) {
    if (!editingJson) return;
    setBusy(true);
    try {
      await insightsApi.updateDocument(collectionName, editingJson._id, value);
      setEditingJson(null);
      await afterChange("رکورد ذخیره شد");
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: RecordRow) {
    setBusy(true);
    try {
      await insightsApi.deleteUserRecord(userId, activeKey, row._id);
      setDeleting(null);
      await afterChange(isLedger ? "تراکنش حذف و موجودی اصلاح شد" : "رکورد حذف شد");
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  async function restore(row: RecordRow) {
    try {
      await insightsApi.restoreUserRecord(userId, activeKey, row._id);
      await afterChange("رکورد بازگردانده شد");
    } catch (error) {
      showErrorToast(error);
    }
  }

  const rows = (data?.items ?? []) as RecordRow[];

  return (
    <div className="space-y-4">
      <SegmentedTabs
        size="sm"
        items={tabs}
        value={activeKey}
        onChange={(key) => {
          setPage(1);
          onKeyChange(key);
        }}
      />

      <AdminPanel
        title={data?.label ?? "داده‌ها"}
        description={
          isLedger
            ? "ویرایش و حذف تراکنش‌ها از همان مسیر اپ انجام می‌شود تا موجودی کیف پول همیشه درست بماند."
            : "حذف به صورت نرم انجام می‌شود (مثل حذف از داخل اپ) و قابل بازگشت است."
        }
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {!isLedger ? (
              <label className="flex items-center gap-2 text-xs text-muted">
                <Switch size="sm" isSelected={includeDeleted} onChange={(selected) => { setIncludeDeleted(selected); setPage(1); }}>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch>
                نمایش حذف‌شده‌ها
              </label>
            ) : (
              <Button size="sm" onPress={() => setTxDialog({ open: true, row: null })}>
                <Add size={16} />
                تراکنش جدید
              </Button>
            )}
          </div>
        }
      >
        {loading && !data ? (
          <SkeletonRows rows={6} />
        ) : rows.length === 0 ? (
          <EmptyState title="موردی وجود ندارد" />
        ) : (
          <div className={loading ? "opacity-60" : ""}>
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-surface-secondary/60 text-xs text-muted">
                  {isLedger ? (
                    <tr>
                      <th className="px-3 py-2.5 text-start font-medium">تاریخ</th>
                      <th className="px-3 py-2.5 text-start font-medium">دسته‌بندی</th>
                      <th className="px-3 py-2.5 text-start font-medium">مبلغ</th>
                      <th className="px-3 py-2.5 text-start font-medium">توضیح</th>
                      <th className="px-3 py-2.5 text-start font-medium">ثبت</th>
                      <th className="px-3 py-2.5" />
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-3 py-2.5 text-start font-medium">عنوان</th>
                      <th className="px-3 py-2.5 text-start font-medium">مقدار</th>
                      <th className="px-3 py-2.5 text-start font-medium">وضعیت</th>
                      <th className="px-3 py-2.5 text-start font-medium">ثبت</th>
                      <th className="px-3 py-2.5" />
                    </tr>
                  )}
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const deleted = Boolean(row.deleted);
                    if (isLedger) {
                      const income = Number(row.type) === 0;
                      const currency = String(row.currency ?? "toman");
                      return (
                        <tr key={row._id} className="border-t border-border/50">
                          <td className="px-3 py-2.5 tabular-nums" dir="ltr">
                            {toPersianDigits(`${row.year}/${row.month}/${row.day}`)}
                          </td>
                          <td className="px-3 py-2.5">{String(row.categoryTitle ?? "—")}</td>
                          <td className={`px-3 py-2.5 font-semibold tabular-nums ${income ? "text-income" : "text-expense"}`}>
                            {income ? "+" : "−"}
                            {formatMoneyFa(Number(row.price), currency)}
                          </td>
                          <td className="max-w-[16rem] truncate px-3 py-2.5 text-muted">{String(row.description ?? "") || "—"}</td>
                          <td className="px-3 py-2.5 text-xs text-muted">{formatDateTimeFa(dateOf(row))}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" isIconOnly aria-label="ویرایش" onPress={() => setTxDialog({ open: true, row })}>
                                <Edit2 size={16} />
                              </Button>
                              <Button size="sm" variant="ghost" isIconOnly aria-label="JSON" onPress={() => setEditingJson(row)}>
                                <Code1 size={16} />
                              </Button>
                              <Button size="sm" variant="ghost" isIconOnly aria-label="حذف" onPress={() => setDeleting(row)}>
                                <Trash size={16} className="text-danger" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    const title = pick(row, TITLE_FIELDS);
                    const amount = pick(row, AMOUNT_FIELDS);
                    return (
                      <tr key={row._id} className={`border-t border-border/50 ${deleted ? "opacity-60" : ""}`}>
                        <td className="max-w-[18rem] px-3 py-2.5">
                          <p className="truncate font-medium">{title ? String(title.value) : row._id}</p>
                          {row.categoryTitle ? <p className="text-xs text-muted">{String(row.categoryTitle)}</p> : null}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums">
                          {amount ? formatMoneyFa(Number(amount.value), String(row.currency ?? "toman")) : "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {deleted ? <Pill tone="danger">حذف‌شده</Pill> : null}
                            {row.status ? <Pill>{String(row.status)}</Pill> : null}
                            {row.active === false ? <Pill>غیرفعال</Pill> : null}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted">{formatDateTimeFa(dateOf(row))}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" isIconOnly aria-label="ویرایش JSON" onPress={() => setEditingJson(row)}>
                              <Code1 size={16} />
                            </Button>
                            {deleted ? (
                              <Button size="sm" variant="ghost" isIconOnly aria-label="بازگردانی" onPress={() => void restore(row)}>
                                <ArrowRotateLeft size={16} />
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" isIconOnly aria-label="حذف" onPress={() => setDeleting(row)}>
                                <Trash size={16} className="text-danger" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <PaginationBar pagination={data?.pagination} onPage={setPage} />
          </div>
        )}
      </AdminPanel>

      <JsonDocumentDialog
        open={Boolean(editingJson)}
        onOpenChange={(open) => !open && setEditingJson(null)}
        title={isLedger ? "ویرایش خام تراکنش" : "ویرایش رکورد"}
        document={editingJson}
        isPending={busy}
        onSave={(value) => void saveJson(value)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={isLedger ? "حذف تراکنش" : "حذف رکورد"}
        description={
          isLedger
            ? "تراکنش حذف می‌شود و اثر آن روی موجودی کیف پول برگردانده می‌شود. اتصال‌های آن به طلب/بدهی، قسط و چک هم اصلاح می‌شود."
            : "رکورد از دید کاربر حذف می‌شود و بعداً قابل بازگشت است."
        }
        confirmLabel="حذف"
        isPending={busy}
        onConfirm={() => deleting && void remove(deleting)}
      />

      {isLedger ? (
        <TransactionDialog
          open={txDialog.open}
          row={txDialog.row}
          userId={userId}
          onOpenChange={(open) => setTxDialog((current) => ({ ...current, open }))}
          onSaved={() => afterChange("تراکنش ذخیره شد")}
        />
      ) : null}
    </div>
  );
}

function TransactionDialog({
  open,
  row,
  userId,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  row: RecordRow | null;
  userId: string;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void> | void;
}) {
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [form, setForm] = useState({ type: "1", price: "", category: "", year: "", month: "", day: "", description: "", currency: "toman" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const today = jalaliToday();
    setForm({
      type: row ? String(row.type) : "1",
      price: row ? String(row.price) : "",
      category: row ? String(row.category ?? "") : "",
      year: row ? String(row.year) : today.year,
      month: row ? String(row.month) : today.month,
      day: row ? String(row.day) : today.day,
      description: row ? String(row.description ?? "") : "",
      currency: row ? String(row.currency ?? "toman") : "toman",
    });
    void insightsApi
      .fetchUserRecords(userId, "categories", { limit: 100 })
      .then((result) => {
        const options = (result.items as RecordRow[]).map((item) => ({ value: item._id, label: String(item.title ?? item._id) }));
        setCategories(options);
        setForm((current) => (current.category ? current : { ...current, category: options[0]?.value ?? "" }));
      })
      .catch((error) => showErrorToast(error));
  }, [open, row, userId]);

  async function submit() {
    if (!form.category) {
      showToast("دسته‌بندی را انتخاب کنید (کاربر هنوز دسته‌بندی ندارد)", "warning");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        price: form.price,
        type: form.type,
        category: form.category,
        year: form.year,
        month: form.month,
        day: form.day,
        description: form.description,
        currency: row ? undefined : form.currency,
      };
      if (row) await insightsApi.updateUserTransaction(userId, row._id, payload);
      else await insightsApi.createUserTransaction(userId, payload);
      onOpenChange(false);
      await onSaved();
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
      title={row ? "ویرایش تراکنش" : "ثبت تراکنش برای کاربر"}
      description="تاریخ به تقویم ذخیره‌شده‌ی تراکنش (معمولاً شمسی) است. موجودی کیف پول کاربر خودکار اصلاح می‌شود."
      isPending={saving}
      onSubmit={() => void submit()}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="نوع">
          <NativeSelect ariaLabel="نوع" value={form.type} onChange={(type) => setForm({ ...form, type })} options={[{ value: "1", label: "پرداخت (هزینه)" }, { value: "0", label: "دریافت (درآمد)" }]} />
        </Field>
        <Field label="مبلغ">
          <Input variant="secondary" dir="ltr" inputMode="decimal" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
        </Field>
        <Field label="دسته‌بندی">
          <NativeSelect ariaLabel="دسته‌بندی" value={form.category} onChange={(category) => setForm({ ...form, category })} options={categories.length ? categories : [{ value: "", label: "—" }]} />
        </Field>
        {!row ? (
          <Field label="ارز">
            <NativeSelect ariaLabel="ارز" value={form.currency} onChange={(currency) => setForm({ ...form, currency })} options={Object.entries(CURRENCY_LABELS).map(([value, label]) => ({ value, label }))} />
          </Field>
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="سال">
          <Input variant="secondary" dir="ltr" inputMode="numeric" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} />
        </Field>
        <Field label="ماه">
          <Input variant="secondary" dir="ltr" inputMode="numeric" value={form.month} onChange={(event) => setForm({ ...form, month: event.target.value })} />
        </Field>
        <Field label="روز">
          <Input variant="secondary" dir="ltr" inputMode="numeric" value={form.day} onChange={(event) => setForm({ ...form, day: event.target.value })} />
        </Field>
      </div>
      <Field label="توضیح">
        <Input variant="secondary" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      </Field>
    </FormDialog>
  );
}
