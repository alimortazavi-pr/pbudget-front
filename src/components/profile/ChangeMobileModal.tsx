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
import { ChangeEvent, useEffect, useMemo, useState } from "react";

//Types
import {
  IChangeMobileForm,
  IValidationErrorsChangeMobileForm,
} from "@/ts/interfaces/profile.interface";
import { changeMobileModalProps } from "@/ts/types/profile.type";

//Redux
import { useAppDispatch } from "@/store/hooks";
import { requestNewCode } from "@/store/auth/actions";
import { changeMobile } from "@/store/profile/actions";

//Components

//Tools
import { toast } from "react-toastify";
import oneToTwoNumber from "one-to-two-num";
import convertToPersian from "num-to-persian";

//Validators
import {
  changeNumberValidator,
  requestToChangeNumberValidator,
} from "@/validators/profileValidator";

export default function ChangeMobileModal({
  isOpen,
  onOpen,
  onClose,
  mobile,
}: changeMobileModalProps) {
  //Redux
  const dispatch = useAppDispatch();

  //Next
  const router = useRouter();

  //States
  const [form, setForm] = useState<IChangeMobileForm>({
    mobile: "",
    code: "",
  });
  const [counter, setCounter] = useState<{ value: number; status: boolean }>({
    value: 120,
    status: true,
  });
  const [errors, setErrors] = useState<IValidationErrorsChangeMobileForm>({
    paths: [],
    messages: {
      mobile: "",
      code: "",
    },
  });
  const [requestToChange, setRequestToChange] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //Effects
  useEffect(() => {
    if (isOpen) {
      setRequestToChange(false);
      setForm({ mobile: "", code: "" });
      setErrors({
        paths: [],
        messages: {
          mobile: "",
          code: "",
        },
      });
    }
  }, [isOpen]);

  //Functions
  function inputHandler(e: ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

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
      calculatingCounter(counter.value);
      toast.error(err.message, {
        position: toast.POSITION.TOP_CENTER,
      });
      setIsLoading(false);
    }
  }

  async function requestToChangeHandler() {
    requestToChangeNumberValidator
      .validate(form, { abortEarly: false })
      .then(async () => {
        if (form.mobile !== mobile) {
          await requestCode();
          setRequestToChange(true);
        } else {
          toast.error("شماره موبایل وارد شده، شماره موبایل فعلی شما است", {
            position: toast.POSITION.TOP_CENTER,
          });
        }
      })
      .catch((err: any) => {
        let errorsArray: IValidationErrorsChangeMobileForm = {
          paths: [],
          messages: {
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

  function submit() {
    setErrors({
      paths: [],
      messages: {
        mobile: "",
        code: "",
      },
    });
    setIsLoading(true);
    changeNumberValidator
      .validate(form, { abortEarly: false })
      .then(async () => {
        try {
          await dispatch(changeMobile(form));
          toast.success("شماره موبایل شما باموفقیت تغییر کرد", {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
          onClose();
          router.push("/profile");
        } catch (err: any) {
          toast.error(err.message, {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        let errorsArray: IValidationErrorsChangeMobileForm = {
          paths: [],
          messages: {
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
    <div>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent className="bg-red-400">
          <ModalHeader>
            <span className="text-gray-800 dark:text-white">
              تغییر شماره موبایل
            </span>
          </ModalHeader>
          <ModalBody>
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
                disabled={requestToChange}
              />
              <FormLabel>شماره موبایل</FormLabel>
              <FormErrorMessage>
                {errors.paths.includes("mobile") ? errors.messages.mobile : ""}
              </FormErrorMessage>
            </FormControl>
            {requestToChange ? (
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
            ) : null}
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="gray" ml={3} onClick={onClose}>
              بستن
            </Button>
            {requestToChange ? (
              <Button isLoading={isLoading} onClick={submit} colorScheme="rose">
                تغییر شماره موبایل
              </Button>
            ) : (
              <Button
                isLoading={isLoading}
                onClick={requestToChangeHandler}
                colorScheme="rose"
              >
                درخواست کد تایید
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
