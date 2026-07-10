"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as workTimeApi from "@/common/api/work-time";
import type { IWorkSession } from "@/common/interfaces/work-time.interface";
import {
  formatJalaliDateSlashed,
  getJalaliNow,
  normalizeJalaliPart,
  toEnglishDigits,
} from "@/common/utils";
import {
  formatDurationMinutes,
  minuteToTimeString,
  timeStringToMinute,
} from "@/common/utils/work-time";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormInput, FormTextArea } from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";

type ManualWorkSessionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  defaultYear: number;
  defaultMonth: number;
  defaultDay?: number;
  session?: IWorkSession | null;
  onSaved: () => void;
};

export function ManualWorkSessionModal({
  open,
  onOpenChange,
  projectId,
  defaultYear,
  defaultMonth,
  defaultDay,
  session,
  onSaved,
}: ManualWorkSessionModalProps) {
  const { t } = useTranslation();
  const now = getJalaliNow();
  const [year, setYear] = useState(String(defaultYear));
  const [month, setMonth] = useState(String(defaultMonth));
  const [day, setDay] = useState(
    String(defaultDay ?? now.jDate()),
  );
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (session) {
      setYear(String(session.year));
      setMonth(String(session.month));
      setDay(String(session.day));
      setStartTime(minuteToTimeString(session.startMinute));
      setEndTime(
        session.endMinute !== undefined
          ? minuteToTimeString(session.endMinute)
          : "17:00",
      );
      setDescription(session.description ?? "");
      return;
    }
    setYear(String(defaultYear));
    setMonth(String(defaultMonth));
    setDay(String(defaultDay ?? now.jDate()));
    setStartTime("09:00");
    setEndTime("17:00");
    setDescription("");
  }, [open, session, defaultYear, defaultMonth, defaultDay, now]);

  async function save(e?: FormEvent) {
    e?.preventDefault();

    const startMinute = timeStringToMinute(toEnglishDigits(startTime));
    const endMinute = timeStringToMinute(toEnglishDigits(endTime));
    if (startMinute === null || endMinute === null) {
      showToast(t("auto.k297d72a16b"));
      return;
    }

    const payload = {
      year: parseInt(toEnglishDigits(year), 10),
      month: parseInt(toEnglishDigits(month), 10),
      day: parseInt(toEnglishDigits(day), 10),
      startMinute,
      endMinute,
      description: description.trim() || undefined,
    };

    setSaving(true);
    try {
      if (session) {
        await workTimeApi.updateWorkSession(projectId, session._id, payload);
        showToast(t("auto.k9d0e05949b"), "success");
      } else {
        await workTimeApi.createManualWorkSession(projectId, payload);
        showToast(t("auto.ka04952d57e"), "success");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      showErrorToast(err);
    } finally {
      setSaving(false);
    }
  }

  const title = session ? "ویرایش ساعت کاری" : "ثبت دستی ساعت کاری";

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalDialog>
        <form onSubmit={(e) => void save(e)}>
          <AppModalHeader onClose={() => onOpenChange(false)}>
            <Modal.Heading>{title}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <FormInput
                label={t("auto.kd67d6b73c4")}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
              <FormInput
                label={t("auto.k1c9e87a670")}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
              <FormInput
                label={t("auto.k6702edb75e")}
                value={day}
                onChange={(e) => setDay(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FormInput
                label={t("auto.kd897dfd9ac")}
                placeholder="09:00"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <FormInput
                label={t("auto.kb93dbb459a")}
                placeholder="17:00"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <FormTextArea
              label={t("auto.kcc83fbb490")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="ghost" onPress={() => onOpenChange(false)}>
              بستن
            </Button>
            <Button type="submit" isPending={saving}>
              {session ? "ذخیره" : "ثبت"}
            </Button>
          </Modal.Footer>
        </form>
      </AppModalDialog>
    </AppModal>
  );
}

export function formatSessionRange(session: IWorkSession) {  const { t } = useTranslation();

  const date = formatJalaliDateSlashed(
    normalizeJalaliPart(session.year, ""),
    normalizeJalaliPart(session.month, ""),
    normalizeJalaliPart(session.day, ""),
  );
  const start = minuteToTimeString(session.startMinute);
  const end =
    session.endMinute !== undefined
      ? minuteToTimeString(session.endMinute)
      : "—";
  const duration =
    session.durationMinutes !== undefined
      ? formatDurationMinutes(session.durationMinutes)
      : "در حال کار";
  return { date, start, end, duration };
}
