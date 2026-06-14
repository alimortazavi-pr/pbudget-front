"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button, Checkbox } from "@heroui/react";
import { TaskSquare, Text } from "iconsax-reactjs";

import type { INoteLine, NoteLineType } from "@/common/interfaces/note.interface";

function createLine(type: NoteLineType = "text"): INoteLine {
  return {
    id: crypto.randomUUID(),
    type,
    text: "",
    done: false,
  };
}

function normalizeLines(items: INoteLine[]) {
  return items.length ? items : [createLine("text")];
}

type AppleNoteEditorProps = {
  items: INoteLine[];
  onChange: (items: INoteLine[]) => void;
  disabled?: boolean;
};

export function AppleNoteEditor({
  items,
  onChange,
  disabled = false,
}: AppleNoteEditorProps) {
  const lines = normalizeLines(items);
  const inputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const updateLines = useCallback(
    (next: INoteLine[]) => {
      onChange(normalizeLines(next));
    },
    [onChange],
  );

  function updateLine(id: string, patch: Partial<INoteLine>) {
    updateLines(
      lines.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  }

  function insertLineAfter(id: string, type: NoteLineType) {
    const index = lines.findIndex((line) => line.id === id);
    const next = [...lines];
    const newLine = createLine(type);
    next.splice(index + 1, 0, newLine);
    updateLines(next);
    requestAnimationFrame(() => inputRefs.current[newLine.id]?.focus());
  }

  function removeLine(id: string) {
    const index = lines.findIndex((line) => line.id === id);
    const next = lines.filter((line) => line.id !== id);
    updateLines(next);
    const focusId = next[Math.max(0, index - 1)]?.id;
    if (focusId) {
      requestAnimationFrame(() => inputRefs.current[focusId]?.focus());
    }
  }

  function toggleLineType(id: string) {
    const line = lines.find((row) => row.id === id);
    if (!line) return;
    updateLine(id, {
      type: line.type === "checkbox" ? "text" : "checkbox",
      done: false,
    });
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
    line: INoteLine,
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      insertLineAfter(line.id, line.type);
      return;
    }

    if (event.key === "Backspace" && !line.text) {
      event.preventDefault();
      if (lines.length > 1) {
        removeLine(line.id);
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          isDisabled={disabled}
          onPress={() => updateLines([...lines, createLine("text")])}
        >
          <Text size={16} />
          خط متن
        </Button>
        <Button
          size="sm"
          variant="secondary"
          isDisabled={disabled}
          onPress={() => updateLines([...lines, createLine("checkbox")])}
        >
          <TaskSquare size={16} />
          چک‌لیست
        </Button>
      </div>

      <div className="min-h-48 rounded-2xl border border-border bg-field-background p-3">
        <div className="space-y-1">
          {lines.map((line) => (
            <div key={line.id} className="group flex items-start gap-2">
              {line.type === "checkbox" ? (
                <Checkbox
                  variant="secondary"
                  isSelected={Boolean(line.done)}
                  isDisabled={disabled}
                  onChange={(selected) =>
                    updateLine(line.id, { done: Boolean(selected) })
                  }
                  aria-label={line.text || "مورد چک‌لیست"}
                  className="mt-2 shrink-0"
                >
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                </Checkbox>
              ) : (
                <span className="mt-2.5 w-5 shrink-0 text-center text-xs text-muted">
                  •
                </span>
              )}

              <textarea
                ref={(node) => {
                  inputRefs.current[line.id] = node;
                }}
                rows={1}
                disabled={disabled}
                value={line.text}
                onChange={(event) => {
                  updateLine(line.id, { text: event.target.value });
                  event.target.style.height = "auto";
                  event.target.style.height = `${event.target.scrollHeight}px`;
                }}
                onKeyDown={(event) => handleKeyDown(event, line)}
                placeholder={
                  line.type === "checkbox"
                    ? "مثلاً: ۱۰ ت از علی میخوام"
                    : "متن آزاد…"
                }
                className={`min-h-[2rem] flex-1 resize-none bg-transparent py-1.5 text-sm leading-7 outline-none ${
                  line.type === "checkbox" && line.done
                    ? "text-muted line-through"
                    : ""
                }`}
              />

              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                isDisabled={disabled}
                className="mt-1 shrink-0 opacity-70 group-hover:opacity-100"
                onPress={() => toggleLineType(line.id)}
                aria-label={
                  line.type === "checkbox"
                    ? "تبدیل به متن"
                    : "تبدیل به چک‌لیست"
                }
              >
                {line.type === "checkbox" ? <Text size={16} /> : <TaskSquare size={16} />}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs leading-6 text-muted">
        Enter خط جدید می‌سازد. با آیکون کنار هر خط می‌توانید همان جمله را چک‌لیست
        یا متن عادی کنید.
      </p>
    </div>
  );
}

export function linesFromNote(note: { items?: INoteLine[] } | null) {
  if (!note?.items?.length) {
    return [createLine("text")];
  }
  return note.items.map((item) => ({
    id: item.id,
    type: item.type,
    text: item.text,
    done: Boolean(item.done),
  }));
}

export function hasEditorContent(items: INoteLine[]) {
  return items.some((item) => item.text.trim().length > 0);
}
