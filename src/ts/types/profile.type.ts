//Interfaces
import { IProfile } from "../interfaces/profile.interface";

export type theProfileProps = {};

export type changeUserBudgetModalProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};
