import { MODAL_PORTAL_OVERLAY_SELECTORS } from "@/common/utils/modal-portal-overlays";

/** Return false to keep the modal open when interacting with portaled pickers/popovers. */
export function shouldCloseModalOnInteractOutside(element: Element) {
  return !MODAL_PORTAL_OVERLAY_SELECTORS.some((selector) => element.closest(selector));
}
