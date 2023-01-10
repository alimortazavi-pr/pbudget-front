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
import { forgetPasswordModalProps } from "@/ts/types/auth.type";
import {
  IForgetPasswordForm,
  IValidationErrorsForgetPasswordForm,
} from "@/ts/interfaces/auth.interface";

//Redux
import { useAppDispatch } from "@/store/hooks";
import { forgetPasswordValidator } from "@/validators/authValidator";
import { forgetPassword } from "@/store/auth/actions";

//Tools
import { toast } from "react-toastify";

export default function ForgetPasswordModal({
  isOpen,
  onOpen,
  onClose,
  email,
}: forgetPasswordModalProps) {
  //Redux
  const dispatch = useAppDispatch();

  //Next
  const router = useRouter();

  //States
  const [form, setForm] = useState<IForgetPasswordForm>({
    email: "",
  });
  const [errors, setErrors] = useState<IValidationErrorsForgetPasswordForm>({
    paths: [],
    messages: {
      email: "",
    },
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //Effects
  useEffect(() => {
    if (email) {
      setForm({ ...form, email: email as string });
    }
  }, [email]);

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
      },
    });
    setIsLoading(true);
    forgetPasswordValidator
      .validate(form, { abortEarly: false })
      .then(async () => {
        try {
          await dispatch(forgetPassword(form));
          toast.success("لینک بازیابی به ایمیل شما ارسال شد", {
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
        let errorsArray: IValidationErrorsForgetPasswordForm = {
          paths: [],
          messages: {
            email: "",
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
        <ModalHeader>فراموشی رمزعبور</ModalHeader>
        <ModalBody>
          <FormControl
            isInvalid={errors.paths.includes("email")}
            variant={"floating"}
            className="mb-2"
          >
            <Input
              focusBorderColor="red"
              placeholder=" "
              type="text"
              value={form.email}
              onChange={inputHandler}
              name="email"
            />
            <FormLabel>ایمیل</FormLabel>
            <FormErrorMessage>
              {errors.paths.includes("email") ? errors.messages.email : ""}
            </FormErrorMessage>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="gray" ml={3} onClick={onClose}>
            بستن
          </Button>
          <Button isLoading={isLoading} onClick={submit} colorScheme="red">
            تایید
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
