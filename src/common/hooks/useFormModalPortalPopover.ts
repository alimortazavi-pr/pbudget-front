import { useModalPortalContainer } from "@/common/hooks/useModalPortalContainer";

/** Portal HeroUI popovers into the nearest modal dialog when present. */
export function useFormModalPortalPopover<T extends HTMLElement = HTMLDivElement>() {
  const { wrapperRef, portalContainer, useModalPortal } = useModalPortalContainer<T>();

  const portalProps =
    useModalPortal && portalContainer
      ? { UNSTABLE_portalContainer: portalContainer }
      : {};

  return { wrapperRef, portalProps };
}
