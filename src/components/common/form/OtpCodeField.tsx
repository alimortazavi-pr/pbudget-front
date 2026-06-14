"use client";

import { InputOTP, Label, TextField } from "@heroui/react";

const OTP_LENGTH = 6;

type OtpCodeFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function OtpCodeField({ label, value, onChange }: OtpCodeFieldProps) {
  return (
    <TextField className="w-full gap-3">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="w-full overflow-hidden" dir="ltr">
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
