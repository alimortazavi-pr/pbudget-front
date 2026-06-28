import { useEffect } from "react";

import {
  clearModalPortalOverlayMarkers,
  keepModalPortalOverlaysInteractive,
} from "@/common/utils/modal-portal-overlays";

/** Keep portaled pickers/popovers clickable while a modal is open. */
export function useModalPortalOverlays(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    keepModalPortalOverlaysInteractive();
    const observer = new MutationObserver(keepModalPortalOverlaysInteractive);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      clearModalPortalOverlayMarkers();
    };
  }, [enabled]);
}
