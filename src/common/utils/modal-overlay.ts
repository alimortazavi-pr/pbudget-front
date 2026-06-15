const PORTAL_OVERLAY_SELECTORS = [
  ".rmdp-wrapper",
  ".rmdp-container",
  ".rmdp-calendar",
  ".rmdp-day-picker",
  ".rmdp-month-picker",
  ".rmdp-year-picker",
  ".rmdp-header",
  ".rmdp-arrow",
  ".rmdp-arrow-container",
  ".rmdp-day",
  ".rmdp-day span",
  ".rmdp-week-day",
  ".rmdp-time-picker",
  '[data-slot="combo-box-popover"]',
  '[data-slot="select-popover"]',
  '[data-slot="autocomplete-popover"]',
  '[data-slot="popover"]',
  ".combo-box__popover",
  ".select__popover",
] as const;

/** Return false to keep the modal open when interacting with portaled pickers/popovers. */
export function shouldCloseModalOnInteractOutside(element: Element) {
  return !PORTAL_OVERLAY_SELECTORS.some((selector) => element.closest(selector));
}
