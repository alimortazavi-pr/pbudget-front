"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@heroui/react";
import {
  ArrowLeft2,
  ArrowRight2,
  DocumentUpload,
  TickCircle,
} from "iconsax-reactjs";

import * as bankImportApi from "@/common/api/bank-import";
import * as banksApi from "@/common/api/banks";
import * as paymentCardsApi from "@/common/api/payment-cards";
import { PATHS } from "@/common/constants";
import type { IBank } from "@/common/interfaces/bank.interface";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { BankImportRowCard } from "@/components/pages/bank-import/BankImportRowCard";
import { BankImportRowEditorModal } from "@/components/pages/bank-import/BankImportRowEditorModal";
import type { ImportRowDraft } from "@/components/pages/bank-import/import-row.types";
import {
  buildConfirmPayloadRow,
  createImportRowDraft,
  isImportRowConfigured,
  validateImportRowDraft,
} from "@/components/pages/bank-import/import-row.util";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { bumpBudgetRevision } from "@/stores/budget";
import { categoriesSelector } from "@/stores/category";
import { setProfile, userSelector } from "@/stores/profile";

type WizardStep = 1 | 2 | 3 | 4;

const STEPS = [
  { id: 1, label: "انتخاب بانک" },
  { id: 2, label: "آپلود فایل" },
  { id: 3, label: "بررسی و تنظیم" },
  { id: 4, label: "پایان" },
] as const;

export function BankImportWizardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const categories = useAppSelector(categoriesSelector);

  const [step, setStep] = useState<WizardStep>(1);
  const [banks, setBanks] = useState<IBank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRowDraft[]>([]);
  const [paymentCards, setPaymentCards] = useState<IPaymentCard[]>([]);
  const [meta, setMeta] = useState<Record<string, string | undefined>>({});
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    skippedDuplicates: number;
  } | null>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedBank = useMemo(
    () => banks.find((bank) => bank._id === selectedBankId),
    [banks, selectedBankId],
  );

  const selectableRows = useMemo(
    () => rows.filter((row) => !row.isDuplicate),
    [rows],
  );

  const selectedRows = useMemo(
    () => rows.filter((row) => row.selected && !row.isDuplicate),
    [rows],
  );

  const incompleteSelectedCount = useMemo(
    () => selectedRows.filter((row) => !isImportRowConfigured(row)).length,
    [selectedRows],
  );

  const canFinish =
    selectedRows.length > 0 &&
    incompleteSelectedCount === 0 &&
    selectedRows.every((row) => !validateImportRowDraft(row));

  const editingRow = useMemo(
    () => rows.find((row) => row.tempId === editingRowId) ?? null,
    [rows, editingRowId],
  );

  const loadBanks = useCallback(async () => {
    setLoadingBanks(true);
    try {
      const data = await banksApi.fetchActiveBanks();
      setBanks(data);
      if (data.length === 1) {
        setSelectedBankId(data[0]._id);
      }
    } catch {
      showToast("بارگذاری بانک‌ها ناموفق بود", "danger");
    } finally {
      setLoadingBanks(false);
    }
  }, []);

  useEffect(() => {
    void loadBanks();
    void paymentCardsApi.fetchPaymentCards().then(setPaymentCards).catch(() => {
      setPaymentCards([]);
    });
  }, [loadBanks]);

  async function handleParse(selectedFile: File) {
    if (!selectedBankId) {
      showToast("ابتدا بانک را انتخاب کنید", "danger");
      return;
    }

    setParsing(true);
    try {
      const cards = paymentCards.length
        ? paymentCards
        : await paymentCardsApi.fetchPaymentCards().catch(() => []);
      if (!paymentCards.length && cards.length) {
        setPaymentCards(cards);
      }

      const preview = await bankImportApi.previewBankImport(selectedBankId, selectedFile);
      setMeta(preview.meta);
      setDuplicateCount(preview.duplicateCount);
      setRows(
        preview.rows.map((row) => createImportRowDraft(row, cards, user?._id)),
      );
      setFile(selectedFile);
      setStep(3);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خواندن فایل ناموفق بود", "danger");
    } finally {
      setParsing(false);
    }
  }

  async function handleConfirm() {
    if (!selectedBankId || !selectedRows.length) {
      showToast("حداقل یک تراکنش انتخاب کنید", "danger");
      return;
    }

    if (incompleteSelectedCount > 0) {
      showToast("برای همه تراکنش‌های انتخاب‌شده دسته‌بندی الزامی است", "danger");
      return;
    }

    for (const row of selectedRows) {
      const error = validateImportRowDraft(row);
      if (error) {
        showToast(error, "danger");
        setEditingRowId(row.tempId);
        return;
      }
    }

    setConfirming(true);
    try {
      const result = await bankImportApi.confirmBankImport({
        bankId: selectedBankId,
        fileName: file?.name,
        rows: selectedRows.map((row) => buildConfirmPayloadRow(row)),
      });

      if (user && result.userBudget !== undefined) {
        dispatch(setProfile({ ...user, budget: result.userBudget }));
      }
      dispatch(bumpBudgetRevision());

      setImportResult({
        importedCount: result.importedCount,
        skippedDuplicates: result.skippedDuplicates,
      });
      setStep(4);
      showToast(`${toPersianDigits(result.importedCount)} تراکنش ثبت شد`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ثبت تراکنش‌ها ناموفق بود", "danger");
    } finally {
      setConfirming(false);
    }
  }

  function setRowCategory(tempId: string, categoryId: string) {
    setRows((prev) =>
      prev.map((row) => (row.tempId === tempId ? { ...row, categoryId } : row)),
    );
  }

  function toggleRow(tempId: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.tempId === tempId && !row.isDuplicate
          ? { ...row, selected: !row.selected }
          : row,
      ),
    );
  }

  function setAllSelected(selected: boolean) {
    setRows((prev) =>
      prev.map((row) => (row.isDuplicate ? row : { ...row, selected })),
    );
  }

  function saveRowDraft(updated: ImportRowDraft) {
    setRows((prev) =>
      prev.map((row) => (row.tempId === updated.tempId ? updated : row)),
    );
  }

  function resetWizard() {
    setStep(1);
    setFile(null);
    setRows([]);
    setMeta({});
    setImportResult(null);
    setEditingRowId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ایمپورت صورتحساب بانکی</h1>
        <p className="mt-1 text-sm text-muted">
          تراکنش‌ها را انتخاب کنید، با دکمه ویرایش تنظیمات کامل ثبت تراکنش را
          اعمال کنید، سپس اتمام را بزنید
        </p>
      </div>

      <div className="grid grid-cols-4 gap-1.5 xs:gap-2">
        {STEPS.map((item) => {
          const isActive = step === item.id;
          const isCompleted = step > item.id;
          return (
            <div
              key={item.id}
              className={`rounded-xl py-2 px-1 text-center text-[10px] min-[360px]:text-[11px] xs:text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? "bg-accent/15 text-accent ring-1 ring-accent/30 font-semibold"
                  : isCompleted
                    ? "bg-accent/5 text-accent/70"
                    : "bg-surface-secondary text-muted"
              }`}
            >
              {item.label}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <section className="glass space-y-4 rounded-2xl p-6">
          <h2 className="font-bold">بانک خود را انتخاب کنید</h2>
          {loadingBanks ? (
            <div className="h-24 animate-pulse rounded-xl bg-surface-secondary" />
          ) : banks.length ? (
            <div className="grid gap-3">
              {banks.map((bank) => (
                <button
                  key={bank._id}
                  type="button"
                  onClick={() => setSelectedBankId(bank._id)}
                  className={`rounded-xl border p-4 text-start transition-colors ${
                    selectedBankId === bank._id
                      ? "border-accent bg-accent/10"
                      : "border-border/60 hover:border-accent/40"
                  }`}
                >
                  <p className="font-bold">{bank.title}</p>
                  <p className="mt-1 text-xs text-muted">فرمت Excel</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">بانک فعالی ثبت نشده — از پنل ادمین اضافه کنید.</p>
          )}
          <Button className="w-full" isDisabled={!selectedBankId} onPress={() => setStep(2)}>
            ادامه
            <ArrowLeft2 size={18} />
          </Button>
        </section>
      )}

      {step === 2 && (
        <section className="glass space-y-4 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">آپلود فایل Excel</h2>
            {selectedBank ? (
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                {selectedBank.title}
              </span>
            ) : null}
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/70 bg-surface-secondary/40 px-6 py-12 transition-colors hover:border-accent/50">
            <DocumentUpload size={40} className="text-accent" />
            <div className="text-center">
              <p className="font-medium">فایل .xlsx را انتخاب کنید</p>
              <p className="mt-1 text-xs text-muted">
                همان خروجی Excel که از اپ بلوبانک می‌گیرید
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) void handleParse(selected);
              }}
            />
          </label>

          {parsing ? (
            <p className="text-center text-sm text-muted">در حال خواندن فایل…</p>
          ) : null}

          <Button variant="secondary" onPress={() => setStep(1)}>
            <ArrowRight2 size={18} />
            بازگشت
          </Button>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          {(meta.accountHolder || meta.periodFrom) && (
            <div className="glass rounded-2xl p-4 text-sm text-muted">
              {meta.accountHolder ? <p>صاحب حساب: {meta.accountHolder}</p> : null}
              {meta.periodFrom && meta.periodTo ? (
                <p>
                  بازه: {meta.periodFrom} تا {meta.periodTo}
                </p>
              ) : null}
              {duplicateCount > 0 ? (
                <p className="mt-1 text-warning-foreground">
                  {toPersianDigits(duplicateCount)} تراکنش تکراری — از لیست حذف شده‌اند
                </p>
              ) : null}
            </div>
          )}

          <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
            <div className="text-sm">
              <p className="font-medium">
                {toPersianDigits(selectedRows.length)} از{" "}
                {toPersianDigits(selectableRows.length)} تراکنش انتخاب‌شده
              </p>
              {incompleteSelectedCount > 0 ? (
                <p className="mt-1 text-xs text-warning-foreground">
                  {toPersianDigits(incompleteSelectedCount)} مورد هنوز دسته‌بندی نشده
                </p>
              ) : selectedRows.length > 0 ? (
                <p className="mt-1 text-xs text-success-foreground">آماده ثبت</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onPress={() => setAllSelected(true)}>
                انتخاب همه
              </Button>
              <Button size="sm" variant="secondary" onPress={() => setAllSelected(false)}>
                لغو انتخاب همه
              </Button>
              <Button size="sm" variant="secondary" onPress={() => setStep(2)}>
                تغییر فایل
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {rows.map((row) => (
              <BankImportRowCard
                key={row.tempId}
                row={row}
                categories={categories ?? []}
                paymentCards={paymentCards}
                onToggle={() => toggleRow(row.tempId)}
                onCategoryChange={(categoryId) => setRowCategory(row.tempId, categoryId)}
                onEdit={() => setEditingRowId(row.tempId)}
              />
            ))}
          </div>

          <div className="glass rounded-2xl p-4">
            <p className="mb-3 text-xs text-muted">
              دسته‌بندی را در همین لیست انتخاب کنید. دکمه «بیشتر» برای کارت،
              پروژه، کسب‌وکار و طلب/بدهی است.
            </p>
            <Button
              className="w-full"
              isPending={confirming}
              isDisabled={!canFinish}
              onPress={() => void handleConfirm()}
            >
              اتمام و ثبت {toPersianDigits(selectedRows.length)} تراکنش
            </Button>
          </div>
        </section>
      )}

      {step === 4 && importResult && (
        <section className="glass space-y-5 rounded-2xl p-6 text-center">
          <TickCircle size={56} className="mx-auto text-success" variant="Bold" />
          <div>
            <h2 className="text-xl font-bold">ایمپورت انجام شد</h2>
            <p className="mt-2 text-sm text-muted">
              {toPersianDigits(importResult.importedCount)} تراکنش ثبت شد
              {importResult.skippedDuplicates
                ? ` · ${toPersianDigits(importResult.skippedDuplicates)} تکراری رد شد`
                : ""}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href={PATHS.HOME} className="flex-1">
              <Button variant="secondary" className="w-full">
                مشاهده در خانه
              </Button>
            </Link>
            <Button className="flex-1" onPress={resetWizard}>
              ایمپورت جدید
            </Button>
          </div>
        </section>
      )}

      <BankImportRowEditorModal
        open={Boolean(editingRowId)}
        draft={editingRow}
        onOpenChange={(open) => {
          if (!open) setEditingRowId(null);
        }}
        onSave={saveRowDraft}
      />
    </div>
  );
}
