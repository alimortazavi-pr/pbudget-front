"use client";

import { Button } from "@heroui/react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createContext, useContext } from "react";
import { usePathname } from "next/navigation";

import {
  getTourForPath,
  getPersonaTour,
  ONBOARDING_TOUR,
  type TourDefinition,
  type TourStep,
} from "@/common/constants/tours";
import { consumePendingPersonaTour } from "@/common/utils/persona-onboarding";
import {
  isOnboardingDone,
  isTourDone,
  setOnboardingDone,
  setTourDone,
} from "@/common/utils/version-storage";
import {
  computeTooltipPosition,
  findStepIndexWithTarget,
  findVisibleTarget,
  getSpotlightRect,
  isMobileViewport,
  resolveTourSteps,
  scrollTargetIntoView,
  type ResolvedPlacement,
} from "@/common/utils/tour-utils";

type TourContextValue = {
  startTour: (tour: TourDefinition) => void;
  startOnboarding: () => void;
  startPageTour: () => void;
  activeTour: TourDefinition | null;
  isRunning: boolean;
};

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}

type ActiveTourState = {
  tour: TourDefinition;
  steps: TourStep[];
  index: number;
  rect: DOMRect | null;
};

function TourOverlay({
  active,
  onNext,
  onPrev,
  onSkip,
  onFinish,
}: {
  active: ActiveTourState;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onFinish: () => void;
}) {
  const maskId = useId().replace(/:/g, "");
  const tooltipRef = useRef<HTMLDivElement>(null);
  const step = active.steps[active.index];
  const isLast = active.index === active.steps.length - 1;
  const isFirst = active.index === 0;
  const preferred = (step.placement ?? "bottom") as ResolvedPlacement;
  const spotlight = getSpotlightRect(active.rect, isMobileViewport() ? 6 : 8);

  const [tooltipSize, setTooltipSize] = useState({ width: 320, height: 180 });

  useLayoutEffect(() => {
    const el = tooltipRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    if (width > 0 && height > 0) {
      setTooltipSize({ width, height });
    }
  }, [active.index, step.title, step.description, active.rect]);

  const tooltipPos = useMemo(
    () => computeTooltipPosition(active.rect, preferred, tooltipSize),
    [active.rect, preferred, tooltipSize],
  );

  const progress = ((active.index + 1) / active.steps.length) * 100;

  return (
    <div
      className="fixed inset-0 z-[100] touch-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-step-title"
      aria-describedby="tour-step-desc"
    >
      <svg
        className="absolute inset-0 size-full"
        aria-hidden
        onClick={onSkip}
      >
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.x}
                y={spotlight.y}
                width={spotlight.width}
                height={spotlight.height}
                rx={14}
                ry={14}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.72)"
          mask={`url(#${maskId})`}
        />
      </svg>

      {spotlight && (
        <div
          className="pointer-events-none absolute rounded-[14px] ring-2 ring-accent shadow-[0_0_0_4px_rgba(var(--accent-rgb,99,102,241),0.15)] transition-all duration-300 ease-out"
          style={{
            top: spotlight.y,
            left: spotlight.x,
            width: spotlight.width,
            height: spotlight.height,
          }}
        />
      )}

      <div
        ref={tooltipRef}
        className="absolute z-[101] rounded-2xl border border-border/60 bg-surface p-4 shadow-2xl sm:p-5"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          transform: tooltipPos.transform,
          maxWidth: tooltipPos.maxWidth,
          width: isMobileViewport() ? tooltipPos.maxWidth : undefined,
        }}
      >
        <div className="mb-3 h-1 overflow-hidden rounded-full bg-surface-secondary">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs font-medium text-accent">
          {active.index + 1} از {active.steps.length}
          <span className="mx-1.5 text-border">·</span>
          {active.tour.name}
        </p>
        <h3 id="tour-step-title" className="mt-1 text-base font-bold sm:text-lg">
          {step.title}
        </h3>
        <p id="tour-step-desc" className="mt-2 text-sm leading-6 text-muted">
          {step.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!isFirst && (
            <Button size="sm" variant="ghost" onPress={onPrev}>
              قبلی
            </Button>
          )}
          <div className="flex-1" />
          <Button size="sm" variant="ghost" onPress={onSkip}>
            رد کردن
          </Button>
          {isLast ? (
            <Button size="sm" variant="primary" onPress={onFinish}>
              پایان
            </Button>
          ) : (
            <Button size="sm" variant="primary" onPress={onNext}>
              بعدی
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function TourProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [active, setActive] = useState<ActiveTourState | null>(null);
  const [mounted, setMounted] = useState(false);
  const activeRef = useRef(active);
  activeRef.current = active;

  const showStep = useCallback(async (tour: TourDefinition, steps: TourStep[], index: number) => {
    const step = steps[index];
    if (!step) return;

    const el = step.target ? findVisibleTarget(step) : null;

    if (el) {
      await scrollTargetIntoView(el);
    }

    const rect = el?.getBoundingClientRect() ?? null;
    setActive({ tour, steps, index, rect });
  }, []);

  const startTour = useCallback(
    (tour: TourDefinition) => {
      const steps = resolveTourSteps(tour);
      if (steps.length === 0) return;

      const firstIndex = findStepIndexWithTarget(steps, 0, 1);
      if (firstIndex < 0 || firstIndex >= steps.length) return;

      void showStep(tour, steps, firstIndex);
    },
    [showStep],
  );

  const stopTour = useCallback((tourId: string) => {
    setTourDone(tourId);
    setActive(null);
  }, []);

  const goToStep = useCallback(
    (direction: 1 | -1) => {
      const current = activeRef.current;
      if (!current) return;

      const nextIndex = findStepIndexWithTarget(
        current.steps,
        current.index + direction,
        direction,
      );

      if (nextIndex < 0 || nextIndex >= current.steps.length) {
        if (direction === 1) {
          if (current.tour.id === "onboarding") setOnboardingDone();
          stopTour(current.tour.id);
        }
        return;
      }

      void showStep(current.tour, current.steps, nextIndex);
    },
    [showStep, stopTour],
  );

  const refreshRect = useCallback(() => {
    const current = activeRef.current;
    if (!current) return;

    const step = current.steps[current.index];
    const el = step.target ? findVisibleTarget(step) : null;
    const rect = el?.getBoundingClientRect() ?? null;
    setActive({ ...current, rect });
  }, []);

  const startOnboarding = useCallback(() => {
    startTour(ONBOARDING_TOUR);
  }, [startTour]);

  const startPageTour = useCallback(() => {
    const tour = getTourForPath(pathname);
    if (tour) startTour(tour);
  }, [pathname, startTour]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (pathname === "/get-started" || pathname === "/download") return;
    if (pathname === "/") return;

    const timer = window.setTimeout(() => {
      const pendingKind = consumePendingPersonaTour();
      if (pendingKind) {
        const personaTour = getPersonaTour(pendingKind);
        if (personaTour && !isTourDone(personaTour.id)) {
          startTour(personaTour);
          return;
        }
      }

      if (pathname.startsWith("/admin")) return;

      if (!isOnboardingDone()) {
        startTour(ONBOARDING_TOUR);
        return;
      }

      const pageTour = getTourForPath(pathname);
      if (pageTour && !isTourDone(pageTour.id)) {
        startTour(pageTour);
      }
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [mounted, pathname, startTour]);

  useEffect(() => {
    if (!active) return;

    document.body.style.overflow = "hidden";

    const onResize = () => refreshRect();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (active.tour.id === "onboarding") setOnboardingDone();
        stopTour(active.tour.id);
      }
      if (e.key === "ArrowLeft") goToStep(1);
      if (e.key === "ArrowRight") goToStep(-1);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    window.addEventListener("keydown", onKeyDown);

    const step = active.steps[active.index];
    const el = step.target ? findVisibleTarget(step) : null;
    const ro =
      el && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => refreshRect())
        : null;
    ro?.observe(el as Element);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      window.removeEventListener("keydown", onKeyDown);
      ro?.disconnect();
    };
  }, [active, refreshRect, goToStep, stopTour]);

  const ctx = useMemo(
    () => ({
      startTour,
      startOnboarding,
      startPageTour,
      activeTour: active?.tour ?? null,
      isRunning: active !== null,
    }),
    [startTour, startOnboarding, startPageTour, active],
  );

  return (
    <TourContext.Provider value={ctx}>
      {children}
      {active && (
        <TourOverlay
          active={active}
          onNext={() => goToStep(1)}
          onPrev={() => goToStep(-1)}
          onSkip={() => {
            if (active.tour.id === "onboarding") setOnboardingDone();
            stopTour(active.tour.id);
          }}
          onFinish={() => {
            if (active.tour.id === "onboarding") setOnboardingDone();
            stopTour(active.tour.id);
          }}
        />
      )}
    </TourContext.Provider>
  );
}
