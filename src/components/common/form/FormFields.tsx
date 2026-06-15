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
import type { ChangeEvent, ComponentProps, FocusEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { formatPriceInput, parsePriceInput } from "@/common/utils/price-input";
import { FilterDatePicker } from "@/components/pages/dashboard/FilterDatePicker";
import { scrollFieldIntoView } from "@/common/utils/scroll";

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
        <Input placeholder={placeholder} dir="rtl" className="text-start" />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox
          aria-label={label}
          className="max-h-56 overflow-y-auto p-1 text-start"
          dir="rtl"
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

type FormCategoryComboBoxProps = {
  label: string;
  placeholder?: string;
  selectedKey?: string;
  onSelectionChange?: (key: string) => void;
  options: FormSelectOption[];
  emptyMessage?: string;
  isDisabled?: boolean;
};

export function FormCategoryComboBox({
  label,
  placeholder = "جستجو یا انتخاب دسته‌بندی",
  selectedKey,
  onSelectionChange,
  options,
  emptyMessage = "دسته‌ای یافت نشد",
  isDisabled,
}: FormCategoryComboBoxProps) {
  const selectedOption = useMemo(
    () => options.find((item) => item.id === selectedKey),
    [options, selectedKey],
  );
  const [inputValue, setInputValue] = useState(selectedOption?.label ?? "");

  useEffect(() => {
    setInputValue(selectedOption?.label ?? "");
  }, [selectedOption?.label, selectedKey]);

  const filteredItems = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query || inputValue === selectedOption?.label) return options;
    return options.filter((item) => item.label.toLowerCase().includes(query));
  }, [inputValue, options, selectedOption?.label]);

  function resetInputToSelection() {
    setInputValue(selectedOption?.label ?? "");
  }

  return (
    <ComboBox
      fullWidth
      variant="secondary"
      menuTrigger="focus"
      isDisabled={isDisabled}
      selectedKey={selectedKey ?? null}
      inputValue={inputValue}
      onInputChange={setInputValue}
      onSelectionChange={(key) => {
        if (key == null) return;
        const nextKey = String(key);
        const nextLabel = options.find((item) => item.id === nextKey)?.label ?? "";
        onSelectionChange?.(nextKey);
        setInputValue(nextLabel);
      }}
      items={filteredItems}
    >
      <Label className="mb-1.5 text-sm font-medium">{label}</Label>
      <ComboBox.InputGroup>
        <Input
          placeholder={placeholder}
          dir="rtl"
          className="text-start"
          onBlur={resetInputToSelection}
        />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        {filteredItems.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted">{emptyMessage}</p>
        ) : (
          <ListBox
            aria-label={label}
            className="max-h-64 overflow-y-auto p-1 text-start"
            dir="rtl"
            items={filteredItems}
          >
            {(item) => (
              <ListBoxItem id={item.id} textValue={item.label}>
                {item.label}
              </ListBoxItem>
            )}
          </ListBox>
        )}
      </ComboBox.Popover>
    </ComboBox>
  );
}

type FormInputProps = ComponentProps<typeof Input> & {
  label: string;
};

type FormPriceInputProps = Omit<ComponentProps<typeof Input>, "value" | "onChange"> & {
  label: string;
  value: string;
  onChange: (rawValue: string) => void;
  allowNegative?: boolean;
};

export function FormPriceInput({
  label,
  value,
  onChange,
  allowNegative = false,
  onFocus,
  ...props
}: FormPriceInputProps) {
  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    onFocus?.(event);
    scrollFieldIntoView(event.currentTarget);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(parsePriceInput(event.target.value, allowNegative));
  }

  return (
    <TextField className="gap-2">
      <Label>{label}</Label>
      <Input
        variant="secondary"
        inputMode="numeric"
        dir="ltr"
        className="text-left"
        value={formatPriceInput(value, allowNegative)}
        onChange={handleChange}
        onFocus={handleFocus}
        {...props}
      />
    </TextField>
  );
}

export function FormInput({ label, onFocus, ...props }: FormInputProps) {
  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    onFocus?.(event);
    scrollFieldIntoView(event.currentTarget);
  }

  return (
    <TextField className="gap-2">
      <Label>{label}</Label>
      <Input variant="secondary" onFocus={handleFocus} {...props} />
    </TextField>
  );
}

type FormTextAreaProps = ComponentProps<typeof TextArea> & {
  label: string;
};

export function FormTextArea({ label, onFocus, ...props }: FormTextAreaProps) {
  function handleFocus(event: FocusEvent<HTMLTextAreaElement>) {
    onFocus?.(event);
    scrollFieldIntoView(event.currentTarget);
  }

  return (
    <TextField className="gap-2">
      <Label>{label}</Label>
      <TextArea variant="secondary" onFocus={handleFocus} {...props} />
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
  inModal?: boolean;
};

export function FormDatePicker({
  label,
  year,
  month,
  day,
  onChange,
  hint,
  inModal = false,
}: FormDatePickerProps) {
  return (
    <div className="pb-filter-date flex flex-col gap-2">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      <FilterDatePicker
        year={year}
        month={month}
        day={day}
        onChange={onChange}
        hideHint
        inModal={inModal}
      />
    </div>
  );
}
