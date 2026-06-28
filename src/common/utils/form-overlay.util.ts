/** True when focus moved into a portaled select/combobox menu (not a real "leave field" blur). */
export function isFormOverlayFocusTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(
    target.closest('[data-slot="combo-box-popover"]') ||
      target.closest('[data-slot="select-popover"]') ||
      target.closest('[data-slot="autocomplete-popover"]') ||
      target.closest('[data-slot="combo-box-trigger"]') ||
      target.closest(".combo-box__popover") ||
      target.closest(".select__popover"),
  );
}
