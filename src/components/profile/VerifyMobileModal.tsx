import {
  Button,
  FormControl,
  FormErrorMessage,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  PinInput,
  PinInputField,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

import {
  IVerifyMobileForm,
  IValidationErrorsVerifyMobileForm,
} from "@/ts/interfaces/profile.interface";
import { useAppDispatch } from "@/store/hooks";
import { requestNewCode } from "@/store/auth/actions";
import { verifyMobile } from "@/store/profile/actions";
import { toast } from "react-toastify";
import oneToTwoNumber from "one-to-two-num";
import convertToPersian from "num-to-persian";
import { verifyMobileValidator } from "@/validators/authValidator";

type VerifyMobileModalProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  mobile: string;
};

export default function VerifyMobileModal({
  isOpen,
  onClose,
  mobile,
}: VerifyMobileModalProps) {
  const dispatch = useAppDispatch();

  const [form, setForm] = useState<IVerifyMobileForm>({ code: "" });
  const [counter, setCounter] = useState<{ value: number; status: boolean }>({
    value: 120,
    status: true,
  });
  const [errors, setErrors] = useState<IValidationErrorsVerifyMobileForm>({
    paths: [],
    messages: { code: "" },
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && mobile) {
      setForm({ code: "" });
      setErrors({ paths: [], messages: { code: "" } });
      requestCode();
    }
  }, [isOpen, mobile]);

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

  async function requestCode() {
    window.clearInterval((window as any).counterInterval);
    setIsLoading(true);
    try {
      await dispatch(requestNewCode(mobile));
      toast.success("کد تأیید برای شما ارسال شد", {
        position: toast.POSITION.TOP_CENTER,
      });
      calculatingCounter(120);
      setIsLoading(false);
    } catch (err: any) {
      toast.error(err.message, { position: toast.POSITION.TOP_CENTER });
      setIsLoading(false);
      calculatingCounter(counter.value);
    }
  }

  function submit() {
    setErrors({ paths: [], messages: { code: "" } });
    setIsLoading(true);

    verifyMobileValidator
      .validate(form, { abortEarly: false })
      .then(async () => {
        try {
          await dispatch(verifyMobile(form.code));
          toast.success("شماره موبایل با موفقیت تأیید شد", {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
          onClose();
        } catch (err: any) {
          toast.error(err.message, { position: toast.POSITION.TOP_CENTER });
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        let errorsArray: IValidationErrorsVerifyMobileForm = {
          paths: [],
          messages: { code: "" },
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
          <span className="text-gray-800 dark:text-white">تأیید شماره موبایل</span>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            کد تأیید به شماره {mobile} ارسال می‌شود.
          </p>
          <FormControl isInvalid={errors.paths.includes("code")}>
            <div className="flex items-center justify-center">
              <div className="flex flex-row-reverse items-center">
                <PinInput
                  otp
                  onChange={(value) => setForm({ code: value })}
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
                    colorScheme="red"
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
            تأیید
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
