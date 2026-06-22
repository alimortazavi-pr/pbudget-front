"use client";

import { Button } from "@heroui/react";
import { ArrowDown2 } from "iconsax-reactjs";

type BudgetMoreToggleProps = {
  open: boolean;
  onToggle: () => void;
  hint?: string | null;
};

export function BudgetMoreToggle({ open, onToggle, hint }: BudgetMoreToggleProps) {
  return (
    <div className="space-y-2 border-t border-border/50 pt-4">
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-between"
        onPress={onToggle}
      >
        <span>{open ? "کمتر" : "بیشتر"}</span>
        <ArrowDown2
          size={18}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </Button>
      {!open && hint ? (
        <p className="text-xs leading-6 text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
