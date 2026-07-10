"use client";

import { BOARD_COLUMN_COLORS } from "@/common/utils/board-colors";
import { useTranslation } from "@/components/providers/LanguageProvider";

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
  const { t } = useTranslation();

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
          aria-label={t("common.colorAria", { color })}
        />
      ))}
    </div>
  );
}
