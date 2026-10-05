"use client";

import { useEffect, useState } from "react";
import { TextArea } from "@heroui/react";

import { FormDialog } from "./AdminUi";

/**
 * Edit one raw database document as Extended JSON. `_id` is shown for
 * reference but is never sent back (the server ignores it as well).
 */
export function JsonDocumentDialog({
  open,
  onOpenChange,
  title,
  document,
  readOnly = false,
  isPending,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  document: Record<string, unknown> | null;
  readOnly?: boolean;
  isPending?: boolean;
  onSave: (value: Record<string, unknown>) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const { _id, ...rest } = document ?? {};
    void _id;
    setText(JSON.stringify(rest, null, 2));
    setError(null);
  }, [open, document]);

  function submit() {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setError("سند باید یک شیء JSON باشد");
        return;
      }
      onSave(parsed as Record<string, unknown>);
    } catch (parseError) {
      setError(parseError instanceof Error ? `JSON نامعتبر: ${parseError.message}` : "JSON نامعتبر است");
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={
        document?._id ? (
          <span>
            شناسه: <span className="font-mono" dir="ltr">{String(document._id)}</span> · شناسه‌ها و تاریخ‌ها به صورت {"{"}&quot;$oid&quot;{"}"} و {"{"}&quot;$date&quot;{"}"} هستند.
          </span>
        ) : (
          "برای ObjectId از {\"$oid\": \"...\"} و برای تاریخ از {\"$date\": \"...\"} استفاده کنید."
        )
      }
      wide
      isPending={isPending}
      submitLabel={readOnly ? "بستن" : "ذخیره"}
      onSubmit={() => (readOnly ? onOpenChange(false) : submit())}
    >
      <TextArea
        aria-label="JSON"
        variant="secondary"
        dir="ltr"
        spellCheck={false}
        readOnly={readOnly}
        rows={18}
        className="min-h-[50dvh] w-full font-mono text-xs leading-5"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setError(null);
        }}
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </FormDialog>
  );
}
