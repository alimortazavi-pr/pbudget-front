"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useState } from "react";
import { Button, Checkbox, TextArea } from "@heroui/react";
import { Add, Alarm, Trash } from "iconsax-reactjs";

import type {
  INoteLine,
  INoteLineReminder,
  IUserNote,
} from "@/common/interfaces/note.interface";
import { formatJalaliDateTime, getJalaliNow } from "@/common/utils/jalali-date";
import { ReminderDateTimePicker } from "@/components/pages/planning/ReminderDateTimePicker";

export type EditorLine = INoteLine;

function newLineId() {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyReminder(): INoteLineReminder {
  const now = getJalaliNow();
  return {
    year: now.jYear(),
    month: now.jMonth() + 1,
    day: now.jDate(),
    hour: 8,
    minute: 0,
    beforeMinutes: 30,
  };
}

function reminderFromLine(r?: INoteLineReminder | null): INoteLineReminder | null {
  if (!r?.year) return null;
  return {
    year: r.year,
    month: r.month,
    day: r.day,
    hour: r.hour ?? 0,
    minute: r.minute ?? 0,
    beforeMinutes: r.beforeMinutes ?? 30,
  };
}

export function linesFromNote(
  note: IUserNote | INoteLine[] | null | undefined,
): EditorLine[] {
  const items = Array.isArray(note) ? note : note?.items;
  if (!items?.length) {
    return [{ id: newLineId(), type: "text", text: "", done: false, reminder: null }];
  }
  return items.map((item) => ({
    id: item.id || newLineId(),
    type: item.type === "checkbox" ? "checkbox" : "text",
    text: item.text ?? "",
    done: Boolean(item.done),
    reminder: reminderFromLine(item.reminder),
  }));
}

export function hasEditorContent(lines: EditorLine[]) {
  const { t } = useTranslation();
  return lines.some((line) => line.text.trim().length > 0);
}

type AppleNoteEditorProps = {
  items: EditorLine[];
  onChange: (items: EditorLine[]) => void;
};

function ReminderPanel({
  reminder,
  onChange,
  onRemove,
}: {
  reminder: INoteLineReminder;
  onChange: (r: INoteLineReminder) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(reminder);

  useEffect(() => {
    setDraft(reminder);
  }, [
    reminder.year,
    reminder.month,
    reminder.day,
    reminder.hour,
    reminder.minute,
  ]);

  return (
    <div className="mt-2 rounded-xl border border-default-200 bg-default-50 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-default-600">{t("planning.telegramReminder")}</span>
        <Button size="sm" variant="ghost" onPress={onRemove}>
          حذف یادآوری
        </Button>
      </div>
      <ReminderDateTimePicker
        year={draft.year}
        month={draft.month}
        day={draft.day}
        hour={draft.hour}
        minute={draft.minute}
        onDraftChange={({ year, month, day, hour, minute }) =>
          setDraft((prev) => ({ ...prev, year, month, day, hour, minute }))
        }
      />
      <p className="text-xs text-default-500 leading-relaxed">
        {formatJalaliDateTime(
          draft.year,
          draft.month,
          draft.day,
          draft.hour,
          draft.minute,
        )}
        {" — "}
        ۳۰ دقیقه قبل و سر وقت در تلگرام پیام می‌گیرید.
      </p>
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="primary"
          onPress={() => onChange({ ...draft, beforeMinutes: draft.beforeMinutes ?? 30 })}
        >
          تأیید یادآوری
        </Button>
      </div>
    </div>
  );
}

export function AppleNoteEditor({ items, onChange }: AppleNoteEditorProps) {  const { t } = useTranslation();

  const [expandedReminderId, setExpandedReminderId] = useState<string | null>(null);
  const lineIdsKey = items.map((line) => line.id).join("|");

  useEffect(() => {
    setExpandedReminderId(null);
  }, [lineIdsKey]);

  const updateLine = (id: string, patch: Partial<EditorLine>) => {
    onChange(items.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const addTextLine = () => {
    onChange([
      ...items,
      { id: newLineId(), type: "text", text: "", done: false, reminder: null },
    ]);
  };

  const addCheckboxLine = () => {
    onChange([
      ...items,
      { id: newLineId(), type: "checkbox", text: "", done: false, reminder: null },
    ]);
  };

  const removeLine = (id: string) => {
    if (items.length <= 1) return;
    onChange(items.filter((l) => l.id !== id));
  };

  const toggleReminder = (line: EditorLine) => {
    if (line.reminder) {
      updateLine(line.id, { reminder: null });
      if (expandedReminderId === line.id) setExpandedReminderId(null);
    } else {
      updateLine(line.id, { reminder: emptyReminder() });
      setExpandedReminderId(line.id);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {items.map((line) => (
        <div key={line.id} className="group flex flex-col">
          <div className="flex items-start gap-2 py-0.5">
            {line.type === "checkbox" ? (
              <Checkbox
                variant="secondary"
                isSelected={line.done}
                onChange={(checked) => updateLine(line.id, { done: checked })}
                className="mt-2 shrink-0"
                aria-label={t("common.done")}
              >
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
              </Checkbox>
            ) : (
              <span className="mt-2 w-6 shrink-0" aria-hidden />
            )}
            <TextArea
              value={line.text}
              onChange={(e) => updateLine(line.id, { text: e.target.value })}
              placeholder={line.type === "checkbox" ? "کار یا یادآوری…" : "متن…"}
              rows={1}
              className="min-h-0 flex-1"
              variant="secondary"
            />
            <Button
              size="sm"
              variant={line.reminder ? "primary" : "ghost"}
              isIconOnly
              className="mt-1 shrink-0 opacity-60 group-hover:opacity-100"
              onPress={() => {
                if (line.reminder) {
                  setExpandedReminderId((id) => (id === line.id ? null : line.id));
                } else {
                  toggleReminder(line);
                }
              }}
              aria-label={t("common.reminder")}
            >
              <Alarm size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              className="mt-1 shrink-0 opacity-0 group-hover:opacity-100"
              onPress={() => removeLine(line.id)}
              aria-label={t("planning.deleteLine")}
            >
              <Trash size={16} />
            </Button>
          </div>
          {line.reminder && expandedReminderId === line.id && (
            <div className="ps-8">
              <ReminderPanel
                reminder={line.reminder}
                onChange={(r) => updateLine(line.id, { reminder: r })}
                onRemove={() => toggleReminder(line)}
              />
            </div>
          )}
          {line.reminder && expandedReminderId !== line.id && (
            <button
              type="button"
              className="ps-8 text-xs text-primary text-start hover:underline"
              onClick={() => setExpandedReminderId(line.id)}
            >
              ⏰{" "}
              {formatJalaliDateTime(
                line.reminder.year,
                line.reminder.month,
                line.reminder.day,
                line.reminder.hour,
                line.reminder.minute,
              )}
            </button>
          )}
        </div>
      ))}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onPress={addTextLine}>
          <Add size={16} />
          متن
        </Button>
        <Button size="sm" variant="secondary" onPress={addCheckboxLine}>
          <Add size={16} />
          چک‌باکس
        </Button>
      </div>
    </div>
  );
}

export function NotePreviewLine({ line }: { line: INoteLine }) {
  const prefix = line.type === "checkbox" ? (line.done ? "☑" : "☐") : "•";
  const reminderLabel =
    line.reminder?.year != null
      ? formatJalaliDateTime(
          line.reminder.year,
          line.reminder.month,
          line.reminder.day,
          line.reminder.hour,
          line.reminder.minute,
        )
      : null;
  return (
    <div className="text-sm text-default-700">
      <span className="me-1 text-default-500">{prefix}</span>
      <span className={line.done ? "line-through text-default-400" : ""}>
        {line.text}
      </span>
      {reminderLabel && (
        <span className="ms-2 text-xs text-primary">⏰ {reminderLabel}</span>
      )}
    </div>
  );
}
