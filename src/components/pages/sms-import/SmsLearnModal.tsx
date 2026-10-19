"use client";

import { Fragment, useMemo, useState } from "react";
import { Button, Modal } from "@heroui/react";

import * as smsApi from "@/common/api/sms-import";
import {
  DEFAULT_USER_PREFERENCES,
  resolveBudgetDateCalendar,
} from "@/common/constants/user-preferences";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { toPersianDigits } from "@/common/utils/persian-digits";
import {
  learn,
  parse,
  type SmsAmountUnit,
  type SmsKind,
} from "@/common/utils/sms-parser";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormInput, FormTextArea } from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader, modalSheetBodyClass } from "@/components/common/ui/AppModal";
import { smsBalanceInUserUnit, smsPreviewLine } from "@/components/pages/sms-import/sms-preview";
import { useTranslation } from "@/i18n";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (format: smsApi.ISmsFormat) => void;
};

type Span = { start: number; end: number; kind: "amount" | "balance" | "card" | "date" };

const SPAN_CLASS: Record<Span["kind"], string> = {
  amount: "bg-accent/25 text-foreground ring-1 ring-accent/50",
  balance: "bg-surface-secondary text-muted ring-1 ring-border",
  card: "bg-warning/25 ring-1 ring-warning/50",
  date: "bg-success/20 ring-1 ring-success/40",
};

/** Teach the app one example SMS: it finds the fields, the user fixes anything wrong, then saves the rules. */
export function SmsLearnModal({ open, onOpenChange, onSaved }: Props) {
  const { t } = useTranslation();
  const user = useAppSelector(userSelector);
  const currency = user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;
  const calendar = resolveBudgetDateCalendar(user?.preferences?.dateCalendar);

  const [sample, setSample] = useState("");
  const [analysed, setAnalysed] = useState(false);
  const [amountStart, setAmountStart] = useState<number | undefined>();
  const [kind, setKind] = useState<SmsKind | undefined>();
  const [unit, setUnit] = useState<SmsAmountUnit | undefined>();
  const [bankName, setBankName] = useState("");
  const [sender, setSender] = useState("");
  const [saving, setSaving] = useState(false);
  const [openedAt] = useState(() => Date.now());

  // The sample is analysed locally and is never stored or sent: only the rules are saved.
  const result = useMemo(
    () =>
      analysed && sample.trim()
        ? learn(sample, sender, { amountTokenStart: amountStart, type: kind, unit, bankName })
        : null,
    [analysed, sample, sender, amountStart, kind, unit, bankName],
  );
  const parsed = useMemo(
    () =>
      result
        ? parse(sample, result.rules, openedAt, currency, calendar, { sourceName: bankName })
        : null,
    [result, sample, currency, calendar, bankName, openedAt],
  );

  function reset() {
    setSample("");
    setAnalysed(false);
    setAmountStart(undefined);
    setKind(undefined);
    setUnit(undefined);
    setBankName("");
    setSender("");
  }

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) reset();
  }

  async function save() {
    if (!result || !parsed) return;
    const name = bankName.trim() || t("feat.sms.defaultName");
    setSaving(true);
    try {
      const format = await smsApi.createSmsFormat({
        name,
        bankName: bankName.trim() || undefined,
        sender: sender.trim() || undefined,
        rules: result.rules,
      });
      showToast(t("feat.sms.formatSaved"), "success");
      onSaved(format);
      close(false);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  const spans: Span[] = useMemo(() => {
    if (!result) return [];
    const list: Span[] = [];
    const { amount, balance, card, date } = result.detected.spans;
    if (amount) list.push({ start: amount[0], end: amount[1], kind: "amount" });
    if (balance) list.push({ start: balance[0], end: balance[1], kind: "balance" });
    if (card) list.push({ start: card[0], end: card[1], kind: "card" });
    if (date) list.push({ start: date[0], end: date[1], kind: "date" });
    return list.sort((a, b) => a.start - b.start).filter((s, i, all) => i === 0 || s.start >= all[i - 1].end);
  }, [result]);

  const activeKind = result?.detected.type ?? null;
  const activeUnit = result?.detected.unit;

  return (
    <AppModal open={open} onOpenChange={close} mobileFull>
      <AppModalDialog className="flex max-h-[100dvh] flex-col sm:max-w-lg">
        <AppModalHeader onClose={() => close(false)}>
          <Modal.Heading>{t("feat.sms.learnTitle")}</Modal.Heading>
        </AppModalHeader>

        <Modal.Body className={`${modalSheetBodyClass} space-y-4`}>
          {!result ? (
            <>
              <p className="text-sm leading-7 text-muted">{t("feat.sms.learnIntro")}</p>
              <FormTextArea
                label={t("feat.sms.sampleLabel")}
                value={sample}
                rows={6}
                placeholder={t("feat.sms.samplePlaceholder")}
                onChange={(e) => setSample(e.target.value)}
              />
              <p className="text-xs leading-6 text-muted">{t("feat.sms.privacyNote")}</p>
            </>
          ) : (
            <>
              <section className="space-y-2">
                <p className="text-sm font-medium">{t("feat.sms.detected")}</p>
                <p
                  className="whitespace-pre-wrap break-words rounded-xl border border-border/50 bg-surface-secondary/50 p-3 text-sm leading-8"
                  data-testid="sms-highlight"
                >
                  {renderHighlighted(result.normalized, spans)}
                </p>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {(["amount", "balance", "card", "date"] as const).map((k) => (
                    <span key={k} className={`rounded-md px-2 py-0.5 ${SPAN_CLASS[k]}`}>
                      {t(`feat.sms.legend.${k}`)}
                    </span>
                  ))}
                </div>
              </section>

              {result.candidates.length > 1 ? (
                <section className="space-y-2">
                  <p className="text-sm font-medium">{t("feat.sms.whichAmount")}</p>
                  <div className="flex flex-wrap gap-2">
                    {result.candidates.map((token) => {
                      const selected = result.detected.spans.amount?.[0] === token.start;
                      return (
                        <button
                          key={token.start}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setAmountStart(token.start)}
                          dir="ltr"
                          className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors ${
                            selected
                              ? "border-accent bg-accent/15 font-semibold text-accent"
                              : "border-border/60 bg-surface-secondary hover:border-accent/40"
                          }`}
                        >
                          {toPersianDigits(token.text)}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              <section className="grid gap-3 sm:grid-cols-2">
                <Segmented
                  label={t("feat.sms.kindLabel")}
                  value={activeKind}
                  onChange={(v) => setKind(v)}
                  options={[
                    { id: "cost", label: t("budget.expense") },
                    { id: "income", label: t("budget.income") },
                  ]}
                />
                <Segmented
                  label={t("feat.sms.unitLabel")}
                  value={activeUnit ?? null}
                  onChange={(v) => setUnit(v)}
                  options={[
                    { id: "rial", label: t("feat.sms.rial") },
                    { id: "toman", label: t("feat.sms.toman") },
                  ]}
                />
              </section>

              <section
                className={`rounded-xl border p-3 text-sm ${
                  parsed ? "border-accent/40 bg-accent/8" : "border-warning/50 bg-warning/10"
                }`}
                data-testid="sms-preview"
              >
                {parsed ? (
                  <>
                    <p className="font-bold">{smsPreviewLine(parsed, currency)}</p>
                    <p className="mt-1 text-xs leading-6 text-muted">
                      {parsed.balance != null
                        ? `${t("feat.sms.balanceLine", { amount: formatPriceWithCurrency(smsBalanceInUserUnit(parsed, currency) ?? 0, currency) })} · `
                        : ""}
                      {toPersianDigits(`${parsed.year}/${String(parsed.month).padStart(2, "0")}/${String(parsed.day).padStart(2, "0")}`)}
                      {parsed.hasDate ? "" : ` (${t("feat.sms.todayUsed")})`}
                    </p>
                  </>
                ) : (
                  <p className="leading-7">{t("feat.sms.cannotRead")}</p>
                )}
              </section>

              <FormInput
                label={t("feat.sms.bankNameLabel")}
                value={bankName}
                maxLength={80}
                placeholder={t("feat.sms.bankNamePlaceholder")}
                onChange={(e) => setBankName(e.target.value)}
              />
              <FormInput
                label={t("feat.sms.senderLabel")}
                value={sender}
                maxLength={40}
                dir="ltr"
                className="text-left"
                onChange={(e) => setSender(e.target.value)}
              />
              <p className="-mt-2 text-xs leading-6 text-muted">{t("feat.sms.senderHint")}</p>
            </>
          )}
        </Modal.Body>

        <Modal.Footer className="border-t border-border/40 px-5 py-4">
          {!result ? (
            <>
              <Button variant="ghost" onPress={() => close(false)}>
                {t("common.cancel")}
              </Button>
              <Button isDisabled={!sample.trim()} onPress={() => setAnalysed(true)}>
                {t("feat.sms.analyse")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onPress={reset}>
                {t("feat.sms.otherSample")}
              </Button>
              <Button isPending={saving} isDisabled={!parsed} onPress={() => void save()}>
                {t("feat.sms.saveFormat")}
              </Button>
            </>
          )}
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>
  );
}

function renderHighlighted(text: string, spans: Span[]) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  spans.forEach((span, index) => {
    if (span.start > cursor) parts.push(<Fragment key={`t${index}`}>{toPersianDigits(text.slice(cursor, span.start))}</Fragment>);
    parts.push(
      <mark key={`m${index}`} dir="ltr" className={`rounded px-1 [unicode-bidi:isolate] ${SPAN_CLASS[span.kind]}`}>
        {toPersianDigits(text.slice(span.start, span.end))}
      </mark>,
    );
    cursor = span.end;
  });
  if (cursor < text.length) parts.push(<Fragment key="end">{toPersianDigits(text.slice(cursor))}</Fragment>);
  return parts;
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: Array<{ id: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
            className={`cursor-pointer rounded-xl border px-3 py-2 text-sm transition-colors ${
              value === option.id
                ? "border-accent bg-accent/15 font-semibold text-accent ring-1 ring-accent/35"
                : "border-border/50 bg-surface-secondary/60 text-muted hover:border-accent/40"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
