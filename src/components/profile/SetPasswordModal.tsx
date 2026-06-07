import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { ChangeEvent, useEffect, useState } from "react";

import {
  ISetPasswordForm,
  IValidationErrorsSetPasswordForm,
} from "@/ts/interfaces/auth.interface";
import { useAppDispatch } from "@/store/hooks";
import { setPassword } from "@/store/profile/actions";
import { toast } from "react-toastify";
import { setPasswordValidator } from "@/validators/authValidator";

type SetPasswordModalProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export default function SetPasswordModal({
  isOpen,
  onClose,
}: SetPasswordModalProps) {
  const dispatch = useAppDispatch();

  const [form, setForm] = useState<ISetPasswordForm>({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<IValidationErrorsSetPasswordForm>({
    paths: [],
    messages: {
      password: "",
      confirmPassword: "",
    },
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setForm({ password: "", confirmPassword: "" });
      setErrors({
        paths: [],
        messages: { password: "", confirmPassword: "" },
      });
    }
  }, [isOpen]);

  function inputHandler(e: ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function submit() {
    setErrors({
      paths: [],
      messages: { password: "", confirmPassword: "" },
    });
    setIsLoading(true);

    setPasswordValidator
      .validate(form, { abortEarly: false })
      .then(async () => {
        try {
          await dispatch(setPassword(form.password));
          toast.success("رمز عبور با موفقیت تنظیم شد", {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
          onClose();
        } catch (err: any) {
          toast.error(err.message, {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        let errorsArray: IValidationErrorsSetPasswordForm = {
          paths: [],
          messages: { password: "", confirmPassword: "" },
        };
        err.inner.forEach((error: any) => {
          errorsArray = {
            paths: [...errorsArray.paths, error.path],
            messages: { ...errorsArray.messages, [error.path]: error.message },
          };
        });
        setErrors(errorsArray);
        setIsLoading(false);
      });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <span className="text-gray-800 dark:text-white">تنظیم رمز عبور</span>
        </ModalHeader>
        <ModalBody>
          <FormControl
            isInvalid={errors.paths.includes("password")}
            variant={"floating"}
            className="mb-3"
          >
            <Input
              focusBorderColor="rose.400"
              placeholder=" "
              type="password"
              value={form.password}
              onChange={inputHandler}
              name="password"
              _invalid={{ borderColor: "inherit" }}
            />
            <FormLabel>رمز عبور جدید</FormLabel>
            <FormErrorMessage>
              {errors.paths.includes("password")
                ? errors.messages.password
                : ""}
            </FormErrorMessage>
          </FormControl>
          <FormControl
            isInvalid={errors.paths.includes("confirmPassword")}
            variant={"floating"}
          >
            <Input
              focusBorderColor="rose.400"
              placeholder=" "
              type="password"
              value={form.confirmPassword}
              onChange={inputHandler}
              name="confirmPassword"
              _invalid={{ borderColor: "inherit" }}
            />
            <FormLabel>تکرار رمز عبور</FormLabel>
            <FormErrorMessage>
              {errors.paths.includes("confirmPassword")
                ? errors.messages.confirmPassword
                : ""}
            </FormErrorMessage>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="gray" ml={3} onClick={onClose}>
            بستن
          </Button>
          <Button isLoading={isLoading} onClick={submit} colorScheme="rose">
            ذخیره
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
