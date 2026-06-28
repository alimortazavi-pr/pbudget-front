import { useEffect, useRef, useState } from "react";

/** Portal dropdowns into the nearest modal dialog so they stay interactive. */
export function useModalPortalContainer<T extends HTMLElement>() {
  const wrapperRef = useRef<T>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = wrapperRef.current?.closest(".modal__dialog");
    setPortalContainer(dialog instanceof HTMLElement ? dialog : null);
  }, []);

  return {
    wrapperRef,
    portalContainer,
    useModalPortal: Boolean(portalContainer),
  };
}
