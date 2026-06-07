export type signUpAndSignInProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  mobile: string;
  hasPassword?: boolean;
};

export type forgetCodeModalProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  mobile: string;
};

export type resetCodeModalProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};
