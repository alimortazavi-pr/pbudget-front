import { useEffect, useRef, useState } from "react";

const PICKER_TOP_LAYER_ATTR = "data-react-aria-top-layer";

/** React Aria marks everything outside an open modal as `inert`, which blocks portaled pickers on `body`. */
function keepPickerContainersInteractive() {
  document.querySelectorAll<HTMLElement>(".rmdp-container").forEach((el) => {
    el.setAttribute(PICKER_TOP_LAYER_ATTR, "true");
  });
}

function clearPickerContainerMarkers() {
  document
    .querySelectorAll<HTMLElement>(`.rmdp-container[${PICKER_TOP_LAYER_ATTR}]`)
    .forEach((el) => el.removeAttribute(PICKER_TOP_LAYER_ATTR));
}

export function useDatePickerOverlay(inModal: boolean) {
  const wrapperRef = useRef<HTMLDivElement>(null);
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

    keepPickerContainersInteractive();
    const observer = new MutationObserver(keepPickerContainersInteractive);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      clearPickerContainerMarkers();
    };
  }, [calendarOpen]);

  return {
    wrapperRef,
    calendarOpen,
    setCalendarOpen,
    portalTarget,
    usePortal: inModal ? Boolean(portalTarget) : true,
    resolvedPortalTarget: inModal && portalTarget ? portalTarget : undefined,
  };
}
