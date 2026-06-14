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
    <TextField className="gap-3">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <div className="flex justify-center" dir="ltr">
        <InputOTP
          maxLength={OTP_LENGTH}
          value={value}
          onChange={onChange}
          variant="secondary"
        >
          <InputOTP.Group className="gap-2">
            {Array.from({ length: OTP_LENGTH }, (_, index) => (
              <InputOTP.Slot
                key={index}
                index={index}
                className="size-11 rounded-xl border border-gray-200 text-lg font-semibold text-gray-900"
              />
            ))}
          </InputOTP.Group>
        </InputOTP>
      </div>
    </TextField>
  );
}
