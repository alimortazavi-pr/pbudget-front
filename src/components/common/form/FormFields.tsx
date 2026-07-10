"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

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
import { useFormModalPortalPopover } from "@/common/hooks/useFormModalPortalPopover";
import { isFormOverlayFocusTarget } from "@/common/utils/form-overlay.util";
import type { UserDateCalendar } from "@/common/constants/user-preferences";
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
  placeholder,
}: FormPersonComboBoxProps) {
  const { t } = useTranslation();
  const { wrapperRef, portalProps } = useFormModalPortalPopover();
  const resolvedPlaceholder =
    placeholder ?? t("common.personAccountPlaceholder");

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
    <div ref={wrapperRef} className="pb-form-combobox relative z-[1]">
      <ComboBox
        allowsCustomValue
        fullWidth
        variant="secondary"
        menuTrigger="input"
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
          <Input placeholder={resolvedPlaceholder} dir="rtl" className="text-start" />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover {...portalProps}>
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
    </div>
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
  placeholder,
  selectedKey,
  onSelectionChange,
  options,
  emptyMessage,
  isDisabled,
}: FormCategoryComboBoxProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("common.searchCategoryPlaceholder");
  const resolvedEmptyMessage = emptyMessage ?? t("common.noCategoryFound");

  const { wrapperRef, portalProps } = useFormModalPortalPopover();
  const isNeutralSelection = !selectedKey || selectedKey === "all";

  const selectedOption = useMemo(
    () => options.find((item) => item.id === selectedKey),
    [options, selectedKey],
  );

  const committedLabel = isNeutralSelection ? "" : (selectedOption?.label ?? "");

  const [inputValue, setInputValue] = useState(committedLabel);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isSearching) {
      setInputValue(committedLabel);
    }
  }, [committedLabel, isSearching]);

  const filteredItems = useMemo(() => {
    if (!isSearching) return options;
    const query = inputValue.trim().toLowerCase();
    if (!query) return options;
    return options.filter((item) => item.label.toLowerCase().includes(query));
  }, [inputValue, isSearching, options]);

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    requestAnimationFrame(() => {
      if (document.activeElement === event.currentTarget) {
        event.currentTarget.select();
      }
    });
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    if (isFormOverlayFocusTarget(event.relatedTarget)) return;
    setIsSearching(false);
    setInputValue(committedLabel);
  }

  return (
    <div ref={wrapperRef} className="pb-form-combobox relative z-[1]">
      <ComboBox
        fullWidth
        variant="secondary"
        menuTrigger="input"
        isDisabled={isDisabled}
        selectedKey={selectedKey ?? null}
        inputValue={inputValue}
        onInputChange={(value) => {
          setInputValue(value);
          setIsSearching(true);
        }}
        onSelectionChange={(key) => {
          if (key == null) return;
          const nextKey = String(key);
          const isNeutral = nextKey === "all";
          onSelectionChange?.(nextKey);
          setInputValue(isNeutral ? "" : options.find((item) => item.id === nextKey)?.label ?? "");
          setIsSearching(false);
        }}
        items={filteredItems}
      >
        <Label className="mb-1.5 text-sm font-medium">{label}</Label>
        <ComboBox.InputGroup>
          <Input
            placeholder={resolvedPlaceholder}
            dir="rtl"
            className="text-start"
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover {...portalProps}>
          {filteredItems.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">{resolvedEmptyMessage}</p>
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
    </div>
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
  currency?: import("@/common/constants/user-preferences").UserCurrency;
};

export function FormPriceInput({
  label,
  value,
  onChange,
  allowNegative = false,
  currency: _currency = "toman",
  onFocus,
  ...props
}: FormPriceInputProps) {  const { t } = useTranslation();

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
  placeholder,
  selectedKey,
  onSelectionChange,
  options,
  emptyMessage,
  isDisabled,
}: FormSelectProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("common.select");
  const resolvedEmptyMessage = emptyMessage ?? t("common.noItemsFound");
  const { wrapperRef, portalProps } = useFormModalPortalPopover();
  const resolvedKey = selectedKey || null;

  return (
    <div ref={wrapperRef} className="pb-form-select relative z-[1]">
      <Select
        fullWidth
        variant="secondary"
        isDisabled={isDisabled}
        selectedKey={resolvedKey}
        onSelectionChange={(key) => {
          if (key == null) return;
          onSelectionChange?.(String(key));
        }}
        placeholder={resolvedPlaceholder}
      >
        <Label className="mb-1.5 text-sm font-medium">{label}</Label>
        <Select.Trigger className="min-h-11 w-full">
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover {...portalProps}>
          {options.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">{resolvedEmptyMessage}</p>
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
    </div>
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
  calendarType?: UserDateCalendar;
};

export function FormDatePicker({
  label,
  year,
  month,
  day,
  onChange,
  hint,
  inModal = false,
  calendarType = "jalali",
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
        calendarType={calendarType}
      />
    </div>
  );
}
