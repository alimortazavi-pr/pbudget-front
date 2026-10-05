"use client";

import {
  Checkbox,
  ListBox,
  ListBoxItem,
  Radio,
  SearchField,
  Select,
  Slider,
} from "@heroui/react";
import type { ReactNode } from "react";

import { useFormModalPortalPopover } from "@/common/hooks/useFormModalPortalPopover";

/**
 * Thin wrappers so every control in the app is a HeroUI component with the
 * same look — no hand-styled native <input>/<select>/<input type=checkbox>.
 */

export type AppSelectOption = { value: string; label: string };

// HeroUI keys cannot be empty strings, but "All" options are exactly that.
const EMPTY_KEY = "__empty__";
const encodeKey = (value: string) => (value === "" ? EMPTY_KEY : value);
const decodeKey = (key: string) => (key === EMPTY_KEY ? "" : key);

/** Compact HeroUI Select (no visible label; pass `ariaLabel`). */
export function AppSelect({
  value,
  onChange,
  options,
  ariaLabel,
  className = "",
  triggerClassName = "",
  isDisabled,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: AppSelectOption[];
  ariaLabel: string;
  className?: string;
  triggerClassName?: string;
  isDisabled?: boolean;
  placeholder?: string;
}) {
  const { wrapperRef, portalProps } = useFormModalPortalPopover();
  return (
    <div ref={wrapperRef} className={`pb-form-select relative z-[1] ${className}`}>
      <Select
        fullWidth
        variant="secondary"
        aria-label={ariaLabel}
        isDisabled={isDisabled}
        placeholder={placeholder}
        selectedKey={options.some((o) => o.value === value) ? encodeKey(value) : null}
        onSelectionChange={(key) => {
          if (key == null) return;
          onChange(decodeKey(String(key)));
        }}
      >
        <Select.Trigger className={`min-h-10 w-full ${triggerClassName}`}>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover {...portalProps}>
          <ListBox aria-label={ariaLabel} className="max-h-64 overflow-y-auto p-1" items={options.map((o) => ({ id: encodeKey(o.value), label: o.label }))}>
            {(item) => (
              <ListBoxItem id={item.id} textValue={item.label}>
                {item.label}
              </ListBoxItem>
            )}
          </ListBox>
        </Select.Popover>
      </Select>
    </div>
  );
}

/** HeroUI SearchField with the clear button wired up. */
export function AppSearch({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = "",
  inputRef,
  onKeyDown,
  autoFocus,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
  className?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  onSubmit?: () => void;
}) {
  return (
    <SearchField
      value={value}
      onChange={onChange}
      onSubmit={onSubmit}
      aria-label={ariaLabel}
      variant="secondary"
      fullWidth
      autoFocus={autoFocus}
      className={className}
    >
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input ref={inputRef} placeholder={placeholder} onKeyDown={onKeyDown} />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );
}

export function AppCheckbox({
  isSelected,
  onChange,
  children,
  className = "",
}: {
  isSelected: boolean;
  onChange: (selected: boolean) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Checkbox variant="secondary" isSelected={isSelected} onChange={onChange} className={`flex items-center gap-2 text-sm ${className}`}>
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
      <Checkbox.Content>{children}</Checkbox.Content>
    </Checkbox>
  );
}

/** Single-value HeroUI Slider with an inline output. */
export function AppSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  ariaLabel,
  className = "",
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <Slider
      aria-label={ariaLabel}
      value={value}
      minValue={min}
      maxValue={max}
      step={step}
      onChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
      className={className}
    >
      <Slider.Track>
        <Slider.Fill />
        <Slider.Thumb />
      </Slider.Track>
    </Slider>
  );
}

export { Radio };
