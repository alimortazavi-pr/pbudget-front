"use client";

import { Button } from "@heroui/react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import {
  getTourForPath,
  ONBOARDING_TOUR,
  type TourDefinition,
  type TourStep,
} from "@/common/constants/tours";
import {
  isOnboardingDone,
  isTourDone,
  setOnboardingDone,
  setTourDone,
} from "@/common/utils/version-storage";

type TourContextValue = {
  startTour: (tour: TourDefinition) => void;
  startOnboarding: () => void;
  startPageTour: () => void;
  activeTour: TourDefinition | null;
  isRunning: boolean;
};

import { createContext, useContext } from "react";

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}

type ActiveStep = {
  tour: TourDefinition;
  index: number;
  rect: DOMRect | null;
};

function findTarget(step: TourStep): Element | null {
  if (step.target.startsWith("[data-tour=")) {
    return document.querySelector(step.target);
  }
  return document.querySelector(step.target);
}

function TourOverlay({
  active,
  onNext,
  onPrev,
  onSkip,
  onFinish,
}: {
  active: ActiveStep;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onFinish: () => void;
}) {
  const step = active.tour.steps[active.index];
  const isLast = active.index === active.tour.steps.length - 1;
  const isFirst = active.index === 0;
  const placement = step.placement ?? "bottom";

  const tooltipStyle = useMemo(() => {
    if (!active.rect || placement === "center") {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: "22rem",
      } as const;
    }

    const gap = 12;
    const style: Record<string, string | number> = { maxWidth: "20rem" };

    switch (placement) {
      case "top":
        style.top = active.rect.top - gap;
        style.left = active.rect.left + active.rect.width / 2;
        style.transform = "translate(-50%, -100%)";
        break;
      case "bottom":
        style.top = active.rect.bottom + gap;
        style.left = active.rect.left + active.rect.width / 2;
        style.transform = "translate(-50%, 0)";
        break;
      case "start":
        style.top = active.rect.top + active.rect.height / 2;
        style.left = active.rect.left - gap;
        style.transform = "translate(-100%, -50%)";
        break;
      case "end":
        style.top = active.rect.top + active.rect.height / 2;
        style.left = active.rect.right + gap;
        style.transform = "translate(0, -50%)";
        break;
    }

    return style;
  }, [active.rect, placement]);

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onSkip} />

      {active.rect && placement !== "center" && (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-accent ring-offset-2 ring-offset-background transition-all duration-300"
          style={{
            top: active.rect.top - 4,
            left: active.rect.left - 4,
            width: active.rect.width + 8,
            height: active.rect.height + 8,
          }}
        />
      )}

      <div
        className="absolute z-[101] rounded-2xl border border-border/60 bg-surface p-5 shadow-2xl"
        style={tooltipStyle}
      >
        <p className="text-xs font-medium text-accent">
          {active.index + 1} از {active.tour.steps.length}
        </p>
        <h3 className="mt-1 text-base font-bold">{step.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{step.description}</p>

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
  const [active, setActive] = useState<ActiveStep | null>(null);
  const [mounted, setMounted] = useState(false);

  const updateRect = useCallback((tour: TourDefinition, index: number) => {
    const step = tour.steps[index];
    const el = findTarget(step);
    const rect = el?.getBoundingClientRect() ?? null;
    setActive({ tour, index, rect });
  }, []);

  const startTour = useCallback(
    (tour: TourDefinition) => {
      let index = 0;
      while (index < tour.steps.length && !findTarget(tour.steps[index])) {
        index++;
      }
      if (index >= tour.steps.length) return;
      updateRect(tour, index);
    },
    [updateRect],
  );

  const stopTour = useCallback((tourId: string) => {
    setTourDone(tourId);
    setActive(null);
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
    if (pathname.startsWith("/admin")) return;

    const timer = window.setTimeout(() => {
      if (!isOnboardingDone()) {
        startTour(ONBOARDING_TOUR);
        return;
      }

      const pageTour = getTourForPath(pathname);
      if (pageTour && !isTourDone(pageTour.id)) {
        startTour(pageTour);
      }
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [mounted, pathname, startTour]);

  useEffect(() => {
    if (!active) return;

    const onResize = () => updateRect(active.tour, active.index);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [active, updateRect]);

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
          onNext={() => {
            let next = active.index + 1;
            while (next < active.tour.steps.length && !findTarget(active.tour.steps[next])) {
              next++;
            }
            if (next < active.tour.steps.length) {
              updateRect(active.tour, next);
            } else {
              if (active.tour.id === "onboarding") setOnboardingDone();
              stopTour(active.tour.id);
            }
          }}
          onPrev={() => updateRect(active.tour, active.index - 1)}
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
