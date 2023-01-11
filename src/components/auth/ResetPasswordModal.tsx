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
import { useRouter } from "next/router";
import { ChangeEvent, useEffect, useState } from "react";

//Types
import { resetPasswordModalProps } from "@/ts/types/auth.type";
import {
  IResetPasswordForm,
  IValidationErrorsResetPasswordForm,
} from "@/ts/interfaces/auth.interface";

//Redux
import { useAppDispatch } from "@/store/hooks";
import { resetPasswordValidator } from "@/validators/authValidator";

//Tools
import { toast } from "react-toastify";
import { resetPassword } from "@/store/auth/actions";

export default function ResetPasswordModal({
  isOpen,
  onOpen,
  onClose,
}: resetPasswordModalProps) {
  //Redux
  const dispatch = useAppDispatch();

  //Next
  const router = useRouter();

  //States
  const [form, setForm] = useState<IResetPasswordForm>({
    email: "",
    code: "",
    password: "",
    passwordConfirmation: "",
  });
  const [errors, setErrors] = useState<IValidationErrorsResetPasswordForm>({
    paths: [],
    messages: {
      email: "",
      code: "",
      password: "",
      passwordConfirmation: "",
    },
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //Effects
  useEffect(() => {
    if (router.query.email && router.query.code) {
      setForm({
        ...form,
        email: router.query.email as string,
        code: router.query.code as string,
      });
    } else {
      onClose();
    }
  }, [router.query]);

  //Functions
  function inputHandler(e: ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function submit() {
    setErrors({
      paths: [],
      messages: {
        email: "",
        code: "",
        password: "",
        passwordConfirmation: "",
      },
    });
    setIsLoading(true);
    resetPasswordValidator
      .validate(form, { abortEarly: false })
      .then(async () => {
        try {
          await dispatch(resetPassword(form));
          toast.success("رمزعبور شما باموفقیت بازیابی شد", {
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
        let errorsArray: IValidationErrorsResetPasswordForm = {
          paths: [],
          messages: {
            email: "",
            code: "",
            password: "",
            passwordConfirmation: "",
          },
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
          <span className="text-gray-800 dark:text-white">بازیابی رمزعبور</span>
        </ModalHeader>
        <ModalBody>
          <FormControl
            isInvalid={errors.paths.includes("email")}
            variant={"floating"}
            className="mb-4"
          >
            <Input
              focusBorderColor="rose.400"
              placeholder=" "
              type="text"
              value={form.email}
              onChange={inputHandler}
              name="email"
              disabled
            />
            <FormLabel>ایمیل</FormLabel>
            <FormErrorMessage>
              {errors.paths.includes("email") ? errors.messages.email : ""}
            </FormErrorMessage>
          </FormControl>
          <FormControl
            isInvalid={errors.paths.includes("password")}
            variant={"floating"}
            className="mb-4"
          >
            <Input
              focusBorderColor="rose.400"
              placeholder=" "
              type="text"
              value={form.password}
              onChange={inputHandler}
              name="password"
            />
            <FormLabel>رمزعبور جدید</FormLabel>
            <FormErrorMessage>
              {errors.paths.includes("password")
                ? errors.messages.password
                : ""}
            </FormErrorMessage>
          </FormControl>
          <FormControl
            isInvalid={errors.paths.includes("passwordConfirmation")}
            variant={"floating"}
            className="mb-4"
          >
            <Input
              focusBorderColor="rose.400"
              placeholder=" "
              type="text"
              value={form.passwordConfirmation}
              onChange={inputHandler}
              name="passwordConfirmation"
            />
            <FormLabel>تایید رمزعبور جدید</FormLabel>
            <FormErrorMessage>
              {errors.paths.includes("passwordConfirmation")
                ? errors.messages.passwordConfirmation
                : ""}
            </FormErrorMessage>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="gray" ml={3} onClick={onClose}>
            بستن
          </Button>
          <Button isLoading={isLoading} onClick={submit} colorScheme="rose">
            بازیابی
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
