import type { TourDefinition, TourStep } from "@/common/constants/tours";

const MOBILE_QUERY = "(max-width: 1023px)";

export function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

export function isElementVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 && rect.height <= 0) return false;

  const style = window.getComputedStyle(el);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0" ||
    style.pointerEvents === "none"
  ) {
    return false;
  }

  return true;
}

export function findVisibleTarget(step: TourStep): Element | null {
  if (!step.target) return null;

  const nodes = document.querySelectorAll(step.target);
  for (const node of nodes) {
    if (isElementVisible(node)) return node;
  }

  return null;
}

export function filterStepsForPlatform(steps: TourStep[]): TourStep[] {
  const mobile = isMobileViewport();
  return steps.filter((step) => {
    const when = step.when ?? "all";
    if (when === "mobile") return mobile;
    if (when === "desktop") return !mobile;
    return true;
  });
}

export function resolveTourSteps(tour: TourDefinition): TourStep[] {
  return filterStepsForPlatform(tour.steps).filter((step) => {
    if (step.placement === "center" || !step.target) return true;
    if (step.optional) return true;
    return Boolean(findVisibleTarget(step));
  });
}

export function findStepIndexWithTarget(
  steps: TourStep[],
  startIndex: number,
  direction: 1 | -1,
): number {
  let index = startIndex;
  while (index >= 0 && index < steps.length) {
    const step = steps[index];
    if (step.placement === "center" || !step.target || findVisibleTarget(step)) {
      return index;
    }
    index += direction;
  }
  return direction === 1 ? steps.length : -1;
}

export type ResolvedPlacement = "top" | "bottom" | "start" | "end" | "center";

export type TooltipPosition = {
  top: number;
  left: number;
  transform: string;
  placement: ResolvedPlacement;
  maxWidth: number;
};

const TOOLTIP_GAP = 14;
const VIEWPORT_PAD = 12;

export function computeTooltipPosition(
  rect: DOMRect | null,
  preferred: ResolvedPlacement,
  tooltipSize: { width: number; height: number },
): TooltipPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxWidth = Math.min(vw - VIEWPORT_PAD * 2, isMobileViewport() ? vw - 24 : 360);

  if (!rect || preferred === "center") {
    return {
      top: vh / 2,
      left: vw / 2,
      transform: "translate(-50%, -50%)",
      placement: "center",
      maxWidth,
    };
  }

  const candidates: ResolvedPlacement[] = [
    preferred,
    "bottom",
    "top",
    "start",
    "end",
    "center",
  ];

  for (const placement of candidates) {
    const pos = placementToCoords(rect, placement, tooltipSize, vw, vh, maxWidth);
    if (pos) return { ...pos, placement, maxWidth };
  }

  return {
    top: vh / 2,
    left: vw / 2,
    transform: "translate(-50%, -50%)",
    placement: "center",
    maxWidth,
  };
}

function placementToCoords(
  rect: DOMRect,
  placement: ResolvedPlacement,
  tooltipSize: { width: number; height: number },
  vw: number,
  vh: number,
  maxWidth: number,
): Omit<TooltipPosition, "placement" | "maxWidth"> | null {
  const w = Math.min(tooltipSize.width, maxWidth);
  const h = tooltipSize.height;
  let top = 0;
  let left = 0;
  let transform = "";

  switch (placement) {
    case "top":
      top = rect.top - TOOLTIP_GAP;
      left = rect.left + rect.width / 2;
      transform = "translate(-50%, -100%)";
      break;
    case "bottom":
      top = rect.bottom + TOOLTIP_GAP;
      left = rect.left + rect.width / 2;
      transform = "translate(-50%, 0)";
      break;
    case "start":
      top = rect.top + rect.height / 2;
      left = rect.left - TOOLTIP_GAP;
      transform = "translate(-100%, -50%)";
      break;
    case "end":
      top = rect.top + rect.height / 2;
      left = rect.right + TOOLTIP_GAP;
      transform = "translate(0, -50%)";
      break;
    default:
      return null;
  }

  const [tx, ty] = parseTransformTranslate(transform, w, h, top, left);

  if (
    tx < VIEWPORT_PAD ||
    ty < VIEWPORT_PAD ||
    tx + w > vw - VIEWPORT_PAD ||
    ty + h > vh - VIEWPORT_PAD
  ) {
    return null;
  }

  return { top, left, transform };
}

function parseTransformTranslate(
  transform: string,
  width: number,
  height: number,
  top: number,
  left: number,
): [number, number] {
  if (transform === "translate(-50%, -100%)") {
    return [left - width / 2, top - height];
  }
  if (transform === "translate(-50%, 0)") {
    return [left - width / 2, top];
  }
  if (transform === "translate(-100%, -50%)") {
    return [left - width, top - height / 2];
  }
  if (transform === "translate(0, -50%)") {
    return [left, top - height / 2];
  }
  return [left, top];
}

export function scrollTargetIntoView(el: Element): Promise<void> {
  return new Promise((resolve) => {
    el.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
    window.setTimeout(resolve, 320);
  });
}

export function getSpotlightRect(rect: DOMRect | null, padding = 8): DOMRect | null {
  if (!rect) return null;
  return new DOMRect(
    rect.left - padding,
    rect.top - padding,
    rect.width + padding * 2,
    rect.height + padding * 2,
  );
}
