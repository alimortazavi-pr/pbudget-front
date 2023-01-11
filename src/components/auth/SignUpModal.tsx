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
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

//Types
import { signUpAndSignInProps } from "@/ts/types/auth.type";
import {
  ISignUpForm,
  IValidationErrorsSignUpForm,
} from "@/ts/interfaces/auth.interface";

//Redux
import { useAppDispatch } from "@/store/hooks";
import { signUpValidator } from "@/validators/authValidator";
import { toast } from "react-toastify";
import { signUp } from "@/store/auth/actions";

export default function SignUpModal({
  isOpen,
  onOpen,
  onClose,
  email,
}: signUpAndSignInProps) {
  //Redux
  const dispatch = useAppDispatch();

  //Next
  const router = useRouter();

  //States
  const [form, setForm] = useState<ISignUpForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<IValidationErrorsSignUpForm>({
    paths: [],
    messages: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
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
        firstName: "",
        lastName: "",
        email: "",
        password: "",
      },
    });
    setIsLoading(true);
    signUpValidator
      .validate(form, { abortEarly: false })
      .then(async () => {
        try {
          await dispatch(signUp(form));
          toast.success("ثبت نام شما با موفقیت انجام شد", {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
          onClose();
          router.push("/");
        } catch (err: any) {
          toast.error(err.message, {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        let errorsArray: IValidationErrorsSignUpForm = {
          paths: [],
          messages: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
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
          <span className="text-gray-800 dark:text-white">ثبت‌ نام</span>
        </ModalHeader>
        <ModalBody>
          <FormControl
            isInvalid={errors.paths.includes("firstName")}
            variant={"floating"}
            className="mb-3"
          >
            <Input
              focusBorderColor="rose.400"
              placeholder=" "
              type="text"
              value={form.firstName}
              onChange={inputHandler}
              name="firstName"
            />
            <FormLabel>نام</FormLabel>
            <FormErrorMessage>
              {errors.paths.includes("firstName")
                ? errors.messages.firstName
                : ""}
            </FormErrorMessage>
          </FormControl>
          <FormControl
            isInvalid={errors.paths.includes("lastName")}
            variant={"floating"}
            className="mb-4"
          >
            <Input
              focusBorderColor="rose.400"
              placeholder=" "
              type="text"
              value={form.lastName}
              onChange={inputHandler}
              name="lastName"
            />
            <FormLabel>نام خانوادگی</FormLabel>
            <FormErrorMessage>
              {errors.paths.includes("lastName")
                ? errors.messages.lastName
                : ""}
            </FormErrorMessage>
          </FormControl>
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
              type="password"
              value={form.password}
              onChange={inputHandler}
              name="password"
            />
            <FormLabel>رمزعبور</FormLabel>
            <FormErrorMessage>
              {errors.paths.includes("password")
                ? errors.messages.password
                : ""}
            </FormErrorMessage>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="gray" ml={3} onClick={onClose}>
            بستن
          </Button>
          <Button isLoading={isLoading} onClick={submit} colorScheme="rose">
            ثبت‌ نام
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
