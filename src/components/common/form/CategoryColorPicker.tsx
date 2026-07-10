"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { FormInput } from "@/components/common/form/FormFields";
import {
  DEFAULT_CATEGORY_COLORS,
  isValidHexColor,
} from "@/common/constants/category-colors";

type CategoryColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
};

export function CategoryColorPicker({ value, onChange }: CategoryColorPickerProps) {
  const { t } = useTranslation();
  const customValue = value && !DEFAULT_CATEGORY_COLORS.includes(value as never) ? value : "";

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{t("رنگ دسته")}</p>
      <div className="flex flex-wrap gap-2">
        {DEFAULT_CATEGORY_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`h-9 w-9 rounded-full border-2 transition ${
              value === color ? "border-foreground scale-110" : "border-transparent"
            }`}
            style={{ backgroundColor: color }}
            aria-label={`رنگ ${color}`}
          />
        ))}
      </div>
      <FormInput
        label={t("رنگ سفارشی (HEX)")}
        placeholder="#3b82f6"
        value={customValue}
        onChange={(e) => {
          const next = e.target.value.trim();
          if (!next) {
            onChange(DEFAULT_CATEGORY_COLORS[0]);
            return;
          }
          onChange(next.startsWith("#") ? next : `#${next}`);
        }}
        dir="ltr"
      />
      {value && !isValidHexColor(value) ? (
        <p className="text-xs text-danger">{t("فرمت رنگ نامعتبر است — مثال: #3b82f6")}</p>
      ) : null}
    </div>
  );
}
