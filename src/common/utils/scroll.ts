/** Scroll focused fields above the mobile keyboard (after keyboard animation). */
export function scrollFieldIntoView(element: HTMLElement) {
  window.setTimeout(() => {
    element.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
      inline: "nearest",
    });
  }, 320);
}
