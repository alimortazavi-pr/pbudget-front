"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Modal, Switch } from "@heroui/react";
import { Add, Sms, TickCircle, Trash } from "iconsax-reactjs";

import * as profileApi from "@/common/api/profile";
import * as smsApi from "@/common/api/sms-import";
import { PATHS } from "@/common/constants";
import {
  DEFAULT_USER_PREFERENCES,
  resolveBudgetDateCalendar,
} from "@/common/constants/user-preferences";
import { toPersianDigits } from "@/common/utils/persian-digits";
import {
  buildSmsRef,
  coerceRules,
  normalizeSms,
  parse,
  splitMessages,
  type ParsedSms,
} from "@/common/utils/sms-parser";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormTextArea } from "@/components/common/form/FormFields";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { SmsLearnModal } from "@/components/pages/sms-import/SmsLearnModal";
import {
  SmsPendingCategorize,
  type PendingCategorizeHandle,
} from "@/components/pages/sms-import/SmsPendingCategorize";
import { smsPreviewLine } from "@/components/pages/sms-import/sms-preview";
import { useTranslation } from "@/i18n";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { bumpBudgetRevision } from "@/stores/budget";
import { setProfile, userSelector } from "@/stores/profile";

type PreviewRow = {
  key: string;
  parsed: ParsedSms;
  formatName: string;
  duplicate: boolean;
  selected: boolean;
};

export function SmsImportPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const currency = user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;
  const calendar = resolveBudgetDateCalendar(user?.preferences?.dateCalendar);

  const [formats, setFormats] = useState<smsApi.ISmsFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [learnOpen, setLearnOpen] = useState(false);
  const [removing, setRemoving] = useState<smsApi.ISmsFormat | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [pasted, setPasted] = useState("");
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [ignored, setIgnored] = useState(0);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ importedCount: number; skippedDuplicates: number; failed: number } | null>(null);
  const pendingRef = useRef<PendingCategorizeHandle>(null);

  const loadFormats = useCallback(async () => {
    try {
      setFormats(await smsApi.fetchSmsFormats());
    } catch (error) {
      showErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFormats();
  }, [loadFormats]);

  const enabledFormats = useMemo(() => formats.filter((f) => f.enabled !== false), [formats]);

  async function toggleFormat(format: smsApi.ISmsFormat, enabled: boolean) {
    setFormats((prev) => prev.map((f) => (f._id === format._id ? { ...f, enabled } : f)));
    try {
      await smsApi.updateSmsFormat(format._id, { enabled });
    } catch (error) {
      setFormats((prev) => prev.map((f) => (f._id === format._id ? { ...f, enabled: !enabled } : f)));
      showErrorToast(error);
    }
  }

  async function removeFormat() {
    if (!removing) return;
    setRemoveBusy(true);
    try {
      await smsApi.deleteSmsFormat(removing._id);
      setFormats((prev) => prev.filter((f) => f._id !== removing._id));
      setRemoving(null);
      showToast(t("common.deleted"), "success");
    } catch (error) {
      showErrorToast(error);
    } finally {
      setRemoveBusy(false);
    }
  }

  function check() {
    const messages = splitMessages(pasted);
    const now = Date.now();
    const seen = new Set<string>();
    const next: PreviewRow[] = [];
    let skipped = 0;

    for (const message of messages) {
      const normalized = normalizeSms(message);
      // Pasted text has no sender, so formats are recognised by their keywords; a format without any
      // keyword is tried last, and only when its amount label really appears in the message.
      const byKeywords = enabledFormats.filter((f) => {
        const keywords = coerceRules(f.rules).keywords;
        return keywords.length > 0 && keywords.every((k) => normalized.includes(k));
      });
      const fallback = enabledFormats.filter((f) => {
        if (byKeywords.includes(f)) return false;
        const label = coerceRules(f.rules).amountLabel;
        return Boolean(label) && normalized.includes(label);
      });

      let found: { parsed: ParsedSms; format: smsApi.ISmsFormat } | null = null;
      for (const format of [...byKeywords, ...fallback]) {
        const parsed = parse(message, coerceRules(format.rules), now, currency, calendar, {
          sourceName: format.bankName || format.name,
        });
        if (parsed) {
          found = { parsed, format };
          break;
        }
      }
      if (!found) {
        skipped += 1;
        continue;
      }
      // Pasted messages have no receive time: a fixed 0 keeps the id stable, so pasting the same
      // message again can never create a second transaction.
      const ref = buildSmsRef(found.format.sender ?? "", 0, normalized);
      const duplicate = seen.has(ref);
      seen.add(ref);
      next.push({
        // The same message pasted twice shares its ref, so the list key needs the position too.
        key: `${ref}#${next.length}`,
        parsed: { ...found.parsed, ref },
        formatName: found.format.bankName || found.format.name,
        duplicate,
        selected: !duplicate,
      });
    }

    setRows(next);
    setIgnored(skipped);
    setResult(null);
    if (!next.length) showToast(t("feat.sms.nothingFound"), "warning");
  }

  const selectedRows = (rows ?? []).filter((row) => row.selected && !row.duplicate);

  async function runImport() {
    if (!selectedRows.length) return;
    setImporting(true);
    try {
      const data = await smsApi.importSmsItems(
        selectedRows.map(({ parsed }) => ({
          ref: parsed.ref,
          type: parsed.type === "income" ? "0" : "1",
          price: String(parsed.price),
          year: String(parsed.year),
          month: String(parsed.month),
          day: String(parsed.day),
          description: parsed.description,
          cardLastFour: parsed.cardLast4 || undefined,
        })),
      );
      setResult({ importedCount: data.importedCount, skippedDuplicates: data.skippedDuplicates, failed: data.failed });
      setRows(null);
      setPasted("");
      dispatch(bumpBudgetRevision());
      void profileApi.fetchProfile().then((profile) => dispatch(setProfile(profile))).catch(() => undefined);
      pendingRef.current?.reload();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setImporting(false);
    }
  }

  function toggleRow(key: string) {
    setRows((prev) => prev?.map((row) => (row.key === key && !row.duplicate ? { ...row, selected: !row.selected } : row)) ?? prev);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        icon={<Sms size={24} variant="Bold" />}
        title={t("feat.sms.title")}
        description={t("feat.sms.subtitle")}
        actions={
          <Link href={PATHS.BANK_IMPORT} className="text-xs font-semibold text-accent hover:underline">
            {t("feat.sms.toStatement")}
          </Link>
        }
      />

      <section className="glass space-y-3 rounded-2xl p-4 sm:p-5" data-testid="sms-formats">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold">{t("feat.sms.formatsTitle")}</h2>
          <Button
            size="sm"
            variant={formats.length ? "secondary" : "primary"}
            isDisabled={formats.length >= smsApi.MAX_SMS_FORMATS}
            onPress={() => setLearnOpen(true)}
          >
            <Add size={16} />
            {formats.length ? t("feat.sms.addFormat") : t("feat.sms.teach")}
          </Button>
        </div>
        {loading ? (
          <div className="pb-shimmer h-16 rounded-xl" aria-hidden />
        ) : formats.length === 0 ? (
          <p className="text-sm leading-7 text-muted">{t("feat.sms.noFormats")}</p>
        ) : (
          <ul className="space-y-2">
            {formats.map((format) => (
              <li key={format._id} className="rounded-xl border border-border/50 bg-surface-secondary/40 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{format.name}</p>
                    <p className="truncate text-xs text-muted">
                      {format.sender ? t("feat.sms.fromSender", { sender: format.sender }) : t("feat.sms.byKeywords")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Switch
                      aria-label={format.name}
                      size="sm"
                      isSelected={format.enabled !== false}
                      onChange={(next) => void toggleFormat(format, next)}
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch>
                    <Button isIconOnly size="sm" variant="ghost" aria-label={t("common.delete")} onPress={() => setRemoving(format)}>
                      <Trash size={15} />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!loading && !formats.length ? null : (
      <section className="glass space-y-3 rounded-2xl p-4 sm:p-5" data-testid="sms-paste">
        <h2 className="text-base font-bold">{t("feat.sms.pasteTitle")}</h2>
        <FormTextArea
          label={t("feat.sms.pasteLabel")}
          value={pasted}
          rows={6}
          placeholder={t("feat.sms.pastePlaceholder")}
          onChange={(e) => {
            setPasted(e.target.value);
            if (rows) setRows(null);
          }}
        />
        <p className="text-xs leading-6 text-muted">{enabledFormats.length ? t("feat.sms.pasteHint") : t("feat.sms.teachFirst")}</p>
        <Button className="w-full" isDisabled={!pasted.trim() || !enabledFormats.length} onPress={check}>
          {t("feat.sms.check")}
        </Button>
      </section>
      )}

      {rows && rows.length > 0 ? (
        <section className="glass space-y-3 rounded-2xl p-4 sm:p-5" data-testid="sms-preview-list">
          <h2 className="text-base font-bold">{t("feat.sms.previewTitle", { count: toPersianDigits(rows.length) })}</h2>
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.key}>
                <button
                  type="button"
                  disabled={row.duplicate}
                  aria-pressed={row.selected}
                  onClick={() => toggleRow(row.key)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-start transition-colors ${
                    row.duplicate
                      ? "cursor-default border-border/40 opacity-60"
                      : row.selected
                        ? "cursor-pointer border-accent/50 bg-accent/8"
                        : "cursor-pointer border-border/50 bg-surface-secondary/40"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      row.selected && !row.duplicate ? "border-accent bg-accent text-accent-foreground" : "border-border"
                    }`}
                  >
                    {row.selected && !row.duplicate ? <TickCircle size={14} variant="Bold" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-semibold ${row.parsed.type === "cost" ? "text-danger" : "text-success"}`}>
                      {smsPreviewLine(row.parsed, currency)}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {toPersianDigits(`${row.parsed.year}/${String(row.parsed.month).padStart(2, "0")}/${String(row.parsed.day).padStart(2, "0")}`)}
                      {" · "}
                      {row.formatName}
                      {row.duplicate ? ` · ${t("feat.sms.duplicateInPaste")}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {ignored > 0 ? <p className="text-xs text-muted">{t("feat.sms.ignored", { count: toPersianDigits(ignored) })}</p> : null}
          <p className="text-xs leading-6 text-muted">{t("feat.sms.categoryLater")}</p>
          <Button className="w-full" isPending={importing} isDisabled={!selectedRows.length} onPress={() => void runImport()}>
            {t("feat.sms.import", { count: toPersianDigits(selectedRows.length) })}
          </Button>
        </section>
      ) : null}

      {result ? (
        <section className="glass flex items-start gap-3 rounded-2xl p-4" data-testid="sms-result">
          <TickCircle size={26} variant="Bold" className="mt-0.5 shrink-0 text-success" />
          <div>
            <p className="font-bold">{t("feat.sms.importedCount", { count: toPersianDigits(result.importedCount) })}</p>
            {result.skippedDuplicates > 0 ? (
              <p className="mt-0.5 text-xs text-muted">{t("feat.sms.skippedDuplicates", { count: toPersianDigits(result.skippedDuplicates) })}</p>
            ) : null}
            {result.failed > 0 ? (
              <p className="mt-0.5 text-xs text-danger">{t("feat.sms.failedCount", { count: toPersianDigits(result.failed) })}</p>
            ) : null}
          </div>
        </section>
      ) : null}

      <SmsPendingCategorize handleRef={pendingRef} />

      <SmsLearnModal
        open={learnOpen}
        onOpenChange={setLearnOpen}
        onSaved={(format) => setFormats((prev) => [...prev, format])}
      />

      <AppModal open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)} size="sm">
        <AppModalDialog>
          <AppModalHeader onClose={() => setRemoving(null)}>
            <Modal.Heading>{t("common.deleteConfirm", { name: removing?.name ?? "" })}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body>
            <p className="text-sm leading-7 text-muted">{t("feat.sms.removeFormatBody")}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onPress={() => setRemoving(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" isPending={removeBusy} onPress={() => void removeFormat()}>
              {t("common.delete")}
            </Button>
          </Modal.Footer>
        </AppModalDialog>
      </AppModal>
    </div>
  );
}
