import { Dispatch, SetStateAction } from "react";
import { IBox } from "../interfaces/box.interface";

export type createBoxModalProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export type editBoxModalProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  box: IBox;
  setBoxEdit: Dispatch<SetStateAction<IBox | null | undefined>>;
};

export type theBoxesProps = {};

export type singleBoxProps = {
  box: IBox;
  setBoxEdit: Dispatch<SetStateAction<IBox | null | undefined>>;
  onOpen: () => void;
};

export type ChangeBoxBudgetProps = {
  box: IBox;
  onClose: () => void;
};
