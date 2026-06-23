"use client";

import { BOARD_COLUMN_COLORS } from "@/common/utils/board-colors";

type BoardColumnColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
  compact?: boolean;
};

export function BoardColumnColorPicker({
  value,
  onChange,
  compact = false,
}: BoardColumnColorPickerProps) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? "" : "mt-2"}`}>
      {BOARD_COLUMN_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`rounded-full border-2 transition ${
            compact ? "size-5" : "size-7"
          } ${value === color ? "border-foreground scale-110" : "border-transparent"}`}
          style={{ backgroundColor: color }}
          aria-label={`رنگ ${color}`}
        />
      ))}
    </div>
  );
}
