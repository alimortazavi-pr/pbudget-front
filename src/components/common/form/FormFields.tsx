"use client";

import { Input, Label, ListBox, ListBoxItem, Select, TextArea, TextField } from "@heroui/react";
import type { ComponentProps } from "react";

type FormInputProps = ComponentProps<typeof Input> & {
  label: string;
};

export function FormInput({ label, ...props }: FormInputProps) {
  return (
    <TextField className="gap-2">
      <Label>{label}</Label>
      <Input variant="secondary" {...props} />
    </TextField>
  );
}

type FormTextAreaProps = ComponentProps<typeof TextArea> & {
  label: string;
};

export function FormTextArea({ label, ...props }: FormTextAreaProps) {
  return (
    <TextField className="gap-2">
      <Label>{label}</Label>
      <TextArea variant="secondary" {...props} />
    </TextField>
  );
}

export type FormSelectOption = {
  id: string;
  label: string;
};

type FormSelectProps = {
  label: string;
  placeholder?: string;
  selectedKey?: string;
  onSelectionChange?: (key: string) => void;
  options: FormSelectOption[];
  emptyMessage?: string;
  isDisabled?: boolean;
};

export function FormSelect({
  label,
  placeholder = "انتخاب کنید",
  selectedKey,
  onSelectionChange,
  options,
  emptyMessage = "موردی یافت نشد",
  isDisabled,
}: FormSelectProps) {
  const resolvedKey = selectedKey || null;

  return (
    <Select
      fullWidth
      variant="secondary"
      isDisabled={isDisabled}
      selectedKey={resolvedKey}
      onSelectionChange={(key) => {
        if (key == null) return;
        onSelectionChange?.(String(key));
      }}
      placeholder={placeholder}
    >
      <Label className="mb-1.5 text-sm font-medium">{label}</Label>
      <Select.Trigger className="min-h-11 w-full">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        {options.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted">{emptyMessage}</p>
        ) : (
          <ListBox
            aria-label={label}
            className="max-h-64 overflow-y-auto p-1"
            items={options}
          >
            {(item) => (
              <ListBoxItem id={item.id} textValue={item.label}>
                {item.label}
              </ListBoxItem>
            )}
          </ListBox>
        )}
      </Select.Popover>
    </Select>
  );
}
