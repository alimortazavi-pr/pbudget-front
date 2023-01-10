export type signUpAndSignInProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  email: string;
};

export type forgetPasswordModalProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  email: string;
};

export type resetPasswordModalProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};
