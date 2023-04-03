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
  PinInput,
  PinInputField,
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
import { signUp, requestNewCode } from "@/store/auth/actions";

//Tools
import { toast } from "react-toastify";
import oneToTwoNumber from "one-to-two-num";
import convertToPersian from "num-to-persian";

//Validators
import { signUpValidator } from "@/validators/authValidator";

export default function SignUpModal({
  isOpen,
  onOpen,
  onClose,
  mobile,
}: signUpAndSignInProps) {
  //Redux
  const dispatch = useAppDispatch();

  //Next
  const router = useRouter();

  //States
  const [form, setForm] = useState<ISignUpForm>({
    firstName: "",
    lastName: "",
    mobile: "",
    code: "",
  });
  const [counter, setCounter] = useState<{ value: number; status: boolean }>({
    value: 120,
    status: true,
  });
  const [errors, setErrors] = useState<IValidationErrorsSignUpForm>({
    paths: [],
    messages: {
      firstName: "",
      lastName: "",
      mobile: "",
      code: "",
    },
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //Effects
  useEffect(() => {
    if (mobile) {
      setForm({ ...form, mobile: mobile as string });
    }
  }, [mobile]);

  useEffect(() => {
    if (isOpen) {
      requestCode();
    }
  }, [isOpen]);

  //Functions
  function calculatingCounter(time: number) {
    let count: number;
    count = time;
    (window as any).counterInterval = setInterval(() => {
      if (count !== 0) {
        count -= 1;
        setCounter({ status: true, value: count });
      } else {
        setCounter({ value: count, status: false });
        window.clearInterval((window as any).counterInterval);
      }
    }, 1000);
  }

  function inputHandler(e: ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function requestCode() {
    window.clearInterval((window as any).counterInterval);
    setIsLoading(true);
    try {
      await dispatch(requestNewCode(form.mobile));
      toast.success("کدتایید جدید برای شما ارسال شد", {
        position: toast.POSITION.TOP_CENTER,
      });
      calculatingCounter(120);
      setIsLoading(false);
    } catch (err: any) {
      toast.error(err.message, {
        position: toast.POSITION.TOP_CENTER,
      });
      setIsLoading(false);
      calculatingCounter(counter.value);
    }
  }

  function submit() {
    setErrors({
      paths: [],
      messages: {
        firstName: "",
        lastName: "",
        mobile: "",
        code: "",
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
            mobile: "",
            code: "",
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
              _invalid={{ borderColor: "inherit" }}
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
              _invalid={{ borderColor: "inherit" }}
            />
            <FormLabel>نام خانوادگی</FormLabel>
            <FormErrorMessage>
              {errors.paths.includes("lastName")
                ? errors.messages.lastName
                : ""}
            </FormErrorMessage>
          </FormControl>
          <FormControl
            isInvalid={errors.paths.includes("mobile")}
            variant={"floating"}
            className="mb-4"
          >
            <Input
              focusBorderColor="rose.400"
              placeholder=" "
              type="text"
              value={form.mobile}
              onChange={inputHandler}
              name="mobile"
              disabled
              _invalid={{ borderColor: "inherit" }}
            />
            <FormLabel>شماره موبایل</FormLabel>
            <FormErrorMessage>
              {errors.paths.includes("mobile") ? errors.messages.mobile : ""}
            </FormErrorMessage>
          </FormControl>
          <FormControl
            isInvalid={errors.paths.includes("code")}
            variant={"floating"}
            className="mb-2"
          >
            <div className="flex items-center justify-center">
              <div className="flex flex-row-reverse items-center">
                <PinInput
                  otp
                  onChange={(value) => {
                    setForm({ ...form, code: value });
                  }}
                >
                  <PinInputField
                    className="text-gray-800 dark:text-gray-200 dark:border-gray-500"
                    _focus={{ borderColor: "rose.400", boxShadow: "none" }}
                    mr={"2"}
                  />
                  <PinInputField
                    className="text-gray-800 dark:text-gray-200 dark:border-gray-500"
                    _focus={{ borderColor: "rose.400", boxShadow: "none" }}
                    mr={"2"}
                  />
                  <PinInputField
                    className="text-gray-800 dark:text-gray-200 dark:border-gray-500"
                    _focus={{ borderColor: "rose.400", boxShadow: "none" }}
                    mr={"2"}
                  />
                  <PinInputField
                    className="text-gray-800 dark:text-gray-200 dark:border-gray-500"
                    _focus={{ borderColor: "rose.400", boxShadow: "none" }}
                    mr={"2"}
                  />
                  <PinInputField
                    className="text-gray-800 dark:text-gray-200 dark:border-gray-500"
                    _focus={{ borderColor: "rose.400", boxShadow: "none" }}
                    mr={"2"}
                  />
                  <PinInputField
                    className="text-gray-800 dark:text-gray-200 dark:border-gray-500"
                    _focus={{ borderColor: "rose.400", boxShadow: "none" }}
                  />
                </PinInput>
              </div>
              <div className="mr-2 flex-1">
                {counter.status ? (
                  <div className="p-2 border rounded-md text-center text-gray-800 dark:text-gray-200 dark:border-gray-500">
                    <span>
                      {convertToPersian(
                        oneToTwoNumber(Math.floor(counter.value / 60)) +
                          ":" +
                          oneToTwoNumber(Math.floor(counter.value % 60))
                      )}
                    </span>
                  </div>
                ) : (
                  <Button
                    isLoading={isLoading}
                    colorScheme={"red"}
                    onClick={() => requestCode()}
                  >
                    ارسال مجدد کد
                  </Button>
                )}
              </div>
            </div>
            <FormErrorMessage>
              {errors.paths.includes("code") ? errors.messages.code : ""}
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
