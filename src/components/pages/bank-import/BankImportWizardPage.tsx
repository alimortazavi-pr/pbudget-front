"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

import { useTranslation } from "@/components/providers/LanguageProvider";

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
import { toPersianDigits, toEnglishDigits } from "@/common/utils";
import { mergeProfileWallet } from "@/common/utils/wallet-balances";
import { showToast } from "@/common/utils/toast";
import { FormInput } from "@/components/common/form/FormFields";
import { BankImportRowCard } from "@/components/pages/bank-import/BankImportRowCard";
import { BankImportRowGroup } from "@/components/pages/bank-import/BankImportRowGroup";
import { BankImportRowEditorModal } from "@/components/pages/bank-import/BankImportRowEditorModal";
import { groupImportRows } from "@/components/pages/bank-import/import-row-group.util";
import type { ImportRowDraft } from "@/components/pages/bank-import/import-row.types";
import {
  buildConfirmPayloadRow,
  createImportRowDraft,
  isImportRowConfigured,
  validateImportRowDraft,
  validateImportRowDraftAsync,
} from "@/components/pages/bank-import/import-row.util";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { bumpBudgetRevision } from "@/stores/budget";
import { categoriesSelector } from "@/stores/category";
import { setProfile, userSelector } from "@/stores/profile";

type WizardStep = 1 | 2 | 3 | 4;

const STEPS = [
  { id: 1, label: t("auto.k5a1352bc9e") },
  { id: 2, label: t("auto.k401c3c8f4c") },
  { id: 3, label: t("auto.k0b8ec3665d") },
  { id: 4, label: t("auto.k44856fc170") },
] as const;

export function BankImportWizardPage() {
  const { t } = useTranslation();
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
  const [rangeFromDay, setRangeFromDay] = useState("");
  const [rangeToDay, setRangeToDay] = useState("");
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

  const rowGroups = useMemo(() => groupImportRows(rows), [rows]);

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
      showToast(t("auto.kc30b8bd654"), "danger");
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
      showToast(t("auto.k4eabca2f1d"), "danger");
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
      showToast(err instanceof Error ? err.message : t("auto.k9417b15f0c"), "danger");
    } finally {
      setParsing(false);
    }
  }

  async function handleConfirm() {
    if (!selectedBankId || !selectedRows.length) {
      showToast(t("auto.ka39107688f"), "danger");
      return;
    }

    if (incompleteSelectedCount > 0) {
      showToast(t("auto.kfb42934376"), "danger");
      return;
    }

    for (const row of selectedRows) {
      const error = await validateImportRowDraftAsync(row);
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

      if (user) {
        dispatch(setProfile(mergeProfileWallet(user, result)));
      }
      dispatch(bumpBudgetRevision());

      setImportResult({
        importedCount: result.importedCount,
        skippedDuplicates: result.skippedDuplicates,
      });
      setStep(4);
      showToast(`${toPersianDigits(result.importedCount)} ${t("auto.keb7bb3e55b")} ${t("nav.create")} ${t("auto.k831c6609f1")}`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.k9ec8323799"), "danger");
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

  function parseDayInput(value: string): number | null {
    const normalized = toEnglishDigits(value).replace(/[^\d]/g, "");
    if (!normalized) return null;
    const day = Number(normalized);
    if (!Number.isInteger(day) || day < 1 || day > 31) return null;
    return day;
  }

  function setSelectedByDayRange(selected: boolean) {
    const fromDay = parseDayInput(rangeFromDay);
    const toDay = parseDayInput(rangeToDay);
    if (fromDay == null || toDay == null || fromDay > toDay) {
      showToast(t("budget.rangeInvalid"), "danger");
      return;
    }

    const matchedCount = rows.filter((row) => {
      if (row.isDuplicate) return false;
      const day = Number(row.day);
      return Number.isFinite(day) && day >= fromDay && day <= toDay;
    }).length;

    if (matchedCount === 0) {
      showToast(t("budget.rangeNoMatch"), "warning");
      return;
    }

    setRows((prev) =>
      prev.map((row) => {
        if (row.isDuplicate) return row;
        const day = Number(row.day);
        if (!Number.isFinite(day) || day < fromDay || day > toDay) return row;
        return { ...row, selected };
      }),
    );

    showToast(
      t(selected ? "budget.rangeAppliedSelect" : "budget.rangeAppliedUnselect", {
        count: toPersianDigits(matchedCount),
      }),
      "success",
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
    setRangeFromDay("");
    setRangeToDay("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("auto.k3785afd116")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t("auto.k1b3560798e")}
          {t("auto.kd484b5c2c5")}
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
          <h2 className="font-bold">{t("auto.ke6b33719b2")}</h2>
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
                  <p className="mt-1 text-xs text-muted">{t("auto.kc13249516f")}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">{t("auto.kb8d57243f9")}</p>
          )}
          <Button className="w-full" isDisabled={!selectedBankId} onPress={() => setStep(2)}>
            {t("auto.k3801960d42")}
            <ArrowLeft2 size={18} />
          </Button>
        </section>
      )}

      {step === 2 && (
        <section className="glass space-y-4 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">{t("auto.ke25a7b312c")}</h2>
            {selectedBank ? (
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                {selectedBank.title}
              </span>
            ) : null}
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/70 bg-surface-secondary/40 px-6 py-12 transition-colors hover:border-accent/50">
            <DocumentUpload size={40} className="text-accent" />
            <div className="text-center">
              <p className="font-medium">{t("auto.k1a605f5534")}</p>
              <p className="mt-1 text-xs text-muted">
                {t("auto.k11e8214c0c")}
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
            <p className="text-center text-sm text-muted">{t("auto.kab3cce4567")}</p>
          ) : null}

          <Button variant="secondary" onPress={() => setStep(1)}>
            <ArrowRight2 size={18} />
            {t("common.back")}
          </Button>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          {(meta.accountHolder || meta.periodFrom) && (
            <div className="glass rounded-2xl p-4 text-sm text-muted">
              {meta.accountHolder ? <p>{t("auto.keabc0b0df2")}{meta.accountHolder}</p> : null}
              {meta.periodFrom && meta.periodTo ? (
                <p>
                  {t("auto.k925df0a51f")}{meta.periodFrom} {t("auto.k19330ade57")} {meta.periodTo}
                </p>
              ) : null}
              {duplicateCount > 0 ? (
                <p className="mt-1 text-warning-foreground">
                  {t("budget.duplicateRowsRemoved", {
                    count: toPersianDigits(duplicateCount),
                  })}
                </p>
              ) : null}
            </div>
          )}

          <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
            <div className="text-sm">
              <p className="font-medium">
                {toPersianDigits(selectedRows.length)} {t("common.of")}{" "}
                {toPersianDigits(selectableRows.length)} {t("auto.k26a50cc8dc")}
              </p>
              {incompleteSelectedCount > 0 ? (
                <p className="mt-1 text-xs text-warning-foreground">
                  {toPersianDigits(incompleteSelectedCount)} {t("auto.k7cb796f3e0")}
                </p>
              ) : selectedRows.length > 0 ? (
                <p className="mt-1 text-xs text-success-foreground">{t("auto.k6559c79735")}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onPress={() => setAllSelected(true)}>
                {t("auto.kb14ad27418")}
              </Button>
              <Button size="sm" variant="secondary" onPress={() => setAllSelected(false)}>
                {t("auto.kad19414ad9")}
              </Button>
              <Button size="sm" variant="secondary" onPress={() => setStep(2)}>
                {t("auto.kbdfa7129cd")}
              </Button>
            </div>
          </div>

          <div className="glass space-y-3 rounded-2xl p-4">
            <div>
              <p className="text-sm font-medium">{t("budget.dateRangeTitle")}</p>
              <p className="mt-1 text-xs text-muted">{t("budget.dateRangeHint")}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormInput
                label={t("budget.fromDay")}
                inputMode="numeric"
                value={rangeFromDay}
                onChange={(e) => setRangeFromDay(e.target.value)}
                placeholder={toPersianDigits("1")}
              />
              <FormInput
                label={t("budget.toDay")}
                inputMode="numeric"
                value={rangeToDay}
                onChange={(e) => setRangeToDay(e.target.value)}
                placeholder={toPersianDigits("20")}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onPress={() => setSelectedByDayRange(true)}
              >
                {t("budget.selectRange")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onPress={() => setSelectedByDayRange(false)}
              >
                {t("budget.unselectRange")}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {rowGroups.map((group) => (
              <BankImportRowGroup key={group.groupKey} group={group}>
                {group.rows.map((row, index) => (
                  <BankImportRowCard
                    key={`${row.tempId}-${row.rowNumber ?? index}`}
                    row={row}
                    categories={categories ?? []}
                    paymentCards={paymentCards}
                    onToggle={() => toggleRow(row.tempId)}
                    onCategoryChange={(categoryId) => setRowCategory(row.tempId, categoryId)}
                    onEdit={() => setEditingRowId(row.tempId)}
                  />
                ))}
              </BankImportRowGroup>
            ))}
          </div>

          <div className="glass rounded-2xl p-4">
            <p className="mb-3 text-xs text-muted">
              {t("auto.kdb9368f054")}
              {t("auto.kd12395d3bd")}
            </p>
            <Button
              className="w-full"
              isPending={confirming}
              isDisabled={!canFinish}
              onPress={() => void handleConfirm()}
            >
              {t("auto.kb57cb1a33b")}{toPersianDigits(selectedRows.length)} {t("auto.keb7bb3e55b")}
            </Button>
          </div>
        </section>
      )}

      {step === 4 && importResult && (
        <section className="glass space-y-5 rounded-2xl p-6 text-center">
          <TickCircle size={56} className="mx-auto text-success" variant="Bold" />
          <div>
            <h2 className="text-xl font-bold">{t("auto.k99c78fd8ee")}</h2>
            <p className="mt-2 text-sm text-muted">
              {toPersianDigits(importResult.importedCount)} {t("auto.k99542d84e0")}
              {importResult.skippedDuplicates
                ? ` · ${toPersianDigits(importResult.skippedDuplicates)} ${t("auto.kf00932390e")} ${t("auto.kfa384f7e8b")} ${t("auto.k831c6609f1")}`
                : ""}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href={PATHS.HOME} className="flex-1">
              <Button variant="secondary" className="w-full">
                {t("auto.k0394842b1b")}
              </Button>
            </Link>
            <Button className="flex-1" onPress={resetWizard}>
              {t("auto.k8925aad6a3")}
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
