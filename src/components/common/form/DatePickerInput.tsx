"use client";

import type { ComponentProps } from "react";
import { Input } from "@heroui/react";

type PickerInjectedProps = {
  openCalendar?: () => void;
  handleValueChange?: unknown;
  locale?: unknown;
  separator?: unknown;
};

/**
 * Read-only input for react-multi-date-picker's `render` prop. The picker
 * clones its render element with helper props (openCalendar, locale, …) that
 * must not reach the DOM, so they are dropped here.
 */
export function DatePickerInput(allProps: ComponentProps<typeof Input> & PickerInjectedProps) {
  const props: Record<string, unknown> & ComponentProps<typeof Input> = { ...allProps };
  const openCalendar = allProps.openCalendar;
  for (const key of ["openCalendar", "handleValueChange", "locale", "separator"]) delete props[key];
  return <Input variant="secondary" readOnly className="pb-form-date-input" {...props} onClick={openCalendar} />;
}
