"use client";

import type { ReactNode } from "react";

type TimelineWidgetTileProps = {
  title: string;
  value: string;
  subtitle?: string;
  status?: "neutral" | "good" | "warn" | "danger";
  icon?: ReactNode;
  onPress?: () => void;
};

const STATUS_CLASS = {
  neutral: "pb-hmi-neutral",
  good: "pb-hmi-good",
  warn: "pb-hmi-warn",
  danger: "pb-hmi-danger",
} as const;

export function TimelineWidgetTile({
  title,
  value,
  subtitle,
  status = "neutral",
  icon,
  onPress,
}: TimelineWidgetTileProps) {
  return (
    <button
      type="button"
      className={`pb-hmi-tile ${STATUS_CLASS[status]}`}
      onClick={onPress}
      disabled={!onPress}
    >
      <div className="pb-hmi-tile-accent" aria-hidden />
      <div className="pb-hmi-tile-body">
        <div className="flex items-start justify-between gap-2">
          <p className="pb-hmi-tile-title">{title}</p>
          {icon ? <span className="pb-hmi-tile-icon">{icon}</span> : null}
        </div>
        <p className="pb-hmi-tile-value">{value}</p>
        {subtitle ? (
          <p className="pb-hmi-tile-subtitle">{subtitle}</p>
        ) : null}
      </div>
    </button>
  );
}
