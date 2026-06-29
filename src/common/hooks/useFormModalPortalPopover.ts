import { useRef } from "react";

/**
 * HeroUI popovers default to `document.body`.
 * Do not portal into `.modal__dialog` — modal containers clip overflow and cut off dropdowns.
 * `useModalPortalOverlays` keeps body-portaled overlays interactive while a modal is open.
 */
export function useFormModalPortalPopover<T extends HTMLElement = HTMLDivElement>() {
  const wrapperRef = useRef<T>(null);
  return { wrapperRef, portalProps: {} };
}
