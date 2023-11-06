import { Dispatch, SetStateAction } from "react";

export type theNavigationProps = {
  title: string;
  isEnabledPreviousPageIcon?: boolean;
  isEnabledPreviousPage?: boolean;
  previousPage?: string;
};

export type chakraUIModalsProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export type filterDatePickerProps = {
  date: { year: string; month: string; day: string };
  setDate: Dispatch<
    SetStateAction<{ year: string; month: string; day: string }>
  >;
};

export type durationTypes = "all" | "yearly" | "monthly" | "daily";
export type exportTypes = "excel" | "html";
