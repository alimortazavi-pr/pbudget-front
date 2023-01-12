import { Dispatch, SetStateAction } from "react";

export type theNavigationProps = {
  title: string;
  isEnabledPreviousPage?: boolean;
  previousPage?: string;
};

export type moreFilterModalProps = {
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
