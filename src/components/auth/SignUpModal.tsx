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
import { ChangeEvent, useEffect, useState } from "react";

import { signUpAndSignInProps } from "@/ts/types/auth.type";
import {
  ISignUpForm,
  IValidationErrorsSignUpForm,
} from "@/ts/interfaces/auth.interface";
import { useAppDispatch } from "@/store/hooks";
import { signUp, requestNewCode } from "@/store/auth/actions";
import { toast } from "react-toastify";
import oneToTwoNumber from "one-to-two-num";
import convertToPersian from "num-to-persian";
import {
  signUpPasswordValidator,
  signUpSmsValidator,
} from "@/validators/authValidator";

type SignUpMethod = "password" | "sms";

export default function SignUpModal({
  isOpen,
  onClose,
  mobile,
}: signUpAndSignInProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [signUpMethod, setSignUpMethod] = useState<SignUpMethod>("password");
  const [form, setForm] = useState<ISignUpForm>({
    firstName: "",
    lastName: "",
    mobile: "",
    code: "",
    password: "",
    confirmPassword: "",
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
      password: "",
      confirmPassword: "",
    },
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (mobile) {
      setForm((prev) => ({ ...prev, mobile: mobile as string }));
    }
  }, [mobile]);

  useEffect(() => {
    if (isOpen) {
      setSignUpMethod("password");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && signUpMethod === "sms" && form.mobile) {
      requestCode();
    }
  }, [isOpen, signUpMethod, form.mobile]);

  function calculatingCounter(time: number) {
    let count = time;
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
        password: "",
        confirmPassword: "",
      },
    });
    setIsLoading(true);

    const validator =
      signUpMethod === "password" ? signUpPasswordValidator : signUpSmsValidator;

    validator
      .validate(form, { abortEarly: false })
      .then(async () => {
        try {
          const payload: ISignUpForm = {
            ...form,
            code: signUpMethod === "password" ? "" : form.code,
          };
          await dispatch(signUp(payload));
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
            password: "",
            confirmPassword: "",
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
          <div className="flex gap-2 mb-4">
            <Button
              size="sm"
              colorScheme={signUpMethod === "password" ? "rose" : "gray"}
              onClick={() => setSignUpMethod("password")}
              className="flex-1"
            >
              ثبت‌نام با رمز عبور
            </Button>
            <Button
              size="sm"
              colorScheme={signUpMethod === "sms" ? "rose" : "gray"}
              onClick={() => setSignUpMethod("sms")}
              className="flex-1"
            >
              ثبت‌نام با کد پیامک
            </Button>
          </div>

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

          {signUpMethod === "sms" ? (
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
                    {[...Array(6)].map((_, index) => (
                      <PinInputField
                        key={index}
                        className="text-gray-800 dark:text-gray-200 dark:border-gray-500"
                        _focus={{ borderColor: "rose.400", boxShadow: "none" }}
                        mr={index < 5 ? "2" : undefined}
                      />
                    ))}
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
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              می‌توانید بعداً از پروفایل شماره موبایل را تأیید کنید.
            </p>
          )}

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
            <FormLabel>
              {signUpMethod === "password" ? "رمز عبور" : "رمز عبور (اختیاری)"}
            </FormLabel>
            <FormErrorMessage>
              {errors.paths.includes("password")
                ? errors.messages.password
                : ""}
            </FormErrorMessage>
          </FormControl>
          {(signUpMethod === "password" || form.password) && (
            <FormControl
              isInvalid={errors.paths.includes("confirmPassword")}
              variant={"floating"}
              className="mb-2"
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
          )}
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
