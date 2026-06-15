"use client";

import { Suspense } from "react";

import { DashboardPage } from "@/components/pages/dashboard";
import { TimelineHomePage } from "@/components/pages/timeline/TimelineHomePage";
import { useExperience } from "@/components/providers/ExperienceProvider";

function HomeRouterInner() {
  const { experienceMode, mounted } = useExperience();

  if (!mounted) {
    return <div className="pb-shimmer h-40 w-full rounded-2xl" />;
  }

  if (experienceMode === "timeline") {
    return <TimelineHomePage />;
  }

  return <DashboardPage />;
}

export function HomeRouter() {
  return (
    <Suspense fallback={<div className="pb-shimmer h-40 w-full rounded-2xl" />}>
      <HomeRouterInner />
    </Suspense>
  );
}
