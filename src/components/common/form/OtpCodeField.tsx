"use client";

import { InputOTP, Label, TextField } from "@heroui/react";
import { useEffect, useRef } from "react";

import { scrollFieldIntoView } from "@/common/utils/scroll";

const OTP_LENGTH = 6;

type OtpCodeFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function OtpCodeField({ label, value, onChange }: OtpCodeFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    function handleFocusIn(event: FocusEvent) {
      const target = event.target;
      if (target instanceof HTMLElement) {
        scrollFieldIntoView(target);
      }
    }

    root.addEventListener("focusin", handleFocusIn);
    return () => root.removeEventListener("focusin", handleFocusIn);
  }, []);

  return (
    <TextField className="w-full gap-3">
      <Label className="text-sm font-medium">{label}</Label>
      <div ref={rootRef} className="w-full px-0.5" dir="ltr">
        <InputOTP
          maxLength={OTP_LENGTH}
          value={value}
          onChange={onChange}
          variant="secondary"
          className="w-full"
        >
          <InputOTP.Group className="grid w-full grid-cols-6 gap-1.5 sm:gap-2">
            {Array.from({ length: OTP_LENGTH }, (_, index) => (
              <InputOTP.Slot
                key={index}
                index={index}
                className="flex aspect-square w-full min-w-0 items-center justify-center rounded-xl border border-border text-base font-semibold sm:text-lg"
              />
            ))}
          </InputOTP.Group>
        </InputOTP>
      </div>
    </TextField>
  );
}
