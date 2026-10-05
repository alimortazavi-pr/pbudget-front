import { useEffect, useRef, useState } from "react";

import {
  clearModalPortalOverlayMarkers,
  keepModalPortalOverlaysInteractive,
} from "@/common/utils/modal-portal-overlays";

export function useDatePickerOverlay(inModalProp: boolean) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Pickers inside a dialog must portal into it; detect that instead of
  // trusting every caller to pass `inModal` (a forgotten flag made the
  // calendar unclickable and impossible to close).
  const [insideDialog, setInsideDialog] = useState(false);
  useEffect(() => {
    setInsideDialog(Boolean(wrapperRef.current?.closest(".modal__dialog")));
  }, []);
  const inModal = inModalProp || insideDialog;
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!inModal) {
      setPortalTarget(document.body);
      return;
    }

    const dialog = wrapperRef.current?.closest(".modal__dialog");
    setPortalTarget(dialog instanceof HTMLElement ? dialog : null);
  }, [inModal]);

  useEffect(() => {
    if (!inModal || !calendarOpen) return;

    const dialog = wrapperRef.current?.closest(".modal__dialog");
    if (dialog instanceof HTMLElement) {
      setPortalTarget(dialog);
    }
  }, [calendarOpen, inModal]);

  useEffect(() => {
    if (!calendarOpen) return;

    keepModalPortalOverlaysInteractive();
    const observer = new MutationObserver(keepModalPortalOverlaysInteractive);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      clearModalPortalOverlayMarkers();
    };
  }, [calendarOpen]);

  return {
    inModal,
    wrapperRef,
    calendarOpen,
    setCalendarOpen,
    portalTarget,
    usePortal: inModal ? Boolean(portalTarget) : true,
    resolvedPortalTarget: inModal && portalTarget ? portalTarget : undefined,
  };
}
