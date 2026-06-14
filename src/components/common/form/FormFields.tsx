"use client";

import {
  ComboBox,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Select,
  TextArea,
  TextField,
} from "@heroui/react";
import type { ComponentProps } from "react";
import { useMemo } from "react";
import { FilterDatePicker } from "@/components/pages/dashboard/FilterDatePicker";

type FormPersonComboBoxProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
};

export function FormPersonComboBox({
  label,
  value,
  onChange,
  options,
  placeholder = "نام طرف حساب را انتخاب یا وارد کنید",
}: FormPersonComboBoxProps) {
  const items = useMemo(
    () => options.map((person) => ({ id: person, label: person })),
    [options],
  );

  const mergedItems = useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed || options.some((person) => person === trimmed)) {
      return items;
    }
    return [{ id: trimmed, label: trimmed }, ...items];
  }, [items, options, value]);

  return (
    <ComboBox
      allowsCustomValue
      fullWidth
      variant="secondary"
      menuTrigger="focus"
      inputValue={value}
      onInputChange={onChange}
      selectedKey={value.trim() || null}
      onSelectionChange={(key) => {
        if (key == null) return;
        onChange(String(key));
      }}
      items={mergedItems}
    >
      <Label className="mb-1.5 text-sm font-medium">{label}</Label>
      <ComboBox.InputGroup>
        <Input placeholder={placeholder} />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox
          aria-label={label}
          className="max-h-56 overflow-y-auto p-1"
          items={mergedItems}
        >
          {(item) => (
            <ListBoxItem id={item.id} textValue={item.label}>
              {item.label}
            </ListBoxItem>
          )}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}

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

type FormDatePickerProps = {
  label: string;
  year: string;
  month: string;
  day: string;
  onChange: (value: { year: string; month: string; day: string }) => void;
  hint?: string;
};

export function FormDatePicker({
  label,
  year,
  month,
  day,
  onChange,
  hint,
}: FormDatePickerProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      <FilterDatePicker year={year} month={month} day={day} onChange={onChange} />
    </div>
  );
}
