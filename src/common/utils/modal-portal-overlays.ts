export const MODAL_PORTAL_TOP_LAYER_ATTR = "data-react-aria-top-layer";

/** Portaled pickers/popovers that must stay interactive while a modal is open. */
export const MODAL_PORTAL_OVERLAY_SELECTORS = [
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

/** React Aria marks everything outside an open modal as `inert`, which blocks portaled overlays on `body`. */
export function keepModalPortalOverlaysInteractive() {
  for (const selector of MODAL_PORTAL_OVERLAY_SELECTORS) {
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      el.setAttribute(MODAL_PORTAL_TOP_LAYER_ATTR, "true");
    });
  }
}

export function clearModalPortalOverlayMarkers() {
  document
    .querySelectorAll<HTMLElement>(`[${MODAL_PORTAL_TOP_LAYER_ATTR}]`)
    .forEach((el) => el.removeAttribute(MODAL_PORTAL_TOP_LAYER_ATTR));
}
