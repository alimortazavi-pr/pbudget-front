import {
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Skeleton,
} from "@chakra-ui/react";
import { ChangeEvent, useEffect, useState } from "react";

//Types
import {
  IChangeUserBudgetForm,
  IValidationErrorsChangeUserBudgetForm,
} from "@/ts/interfaces/profile.interface";
import { changeUserBudgetModalProps } from "@/ts/types/profile.type";

//Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { changeUserBudget } from "@/store/profile/actions";
import { darkModeSelector } from "@/store/layout/selectors";
import { userSelector } from "@/store/profile/selectors";

//Tools
import { toast } from "react-toastify";
import convertToPersian from "num-to-persian";
import priceGenerator from "price-generator";
import convertAPToEnglish from "ap-to-english";

//Validators
import { changeUserBudgetValidator } from "@/validators/profileValidator";

export default function ChangeUserBudgetModal({
  isOpen,
  onOpen,
  onClose,
}: changeUserBudgetModalProps) {
  //Redux
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector(darkModeSelector);
  const user = useAppSelector(userSelector);

  //Next

  //States
  const [form, setForm] = useState<IChangeUserBudgetForm>({
    price: "",
  });
  const [errors, setErrors] = useState<IValidationErrorsChangeUserBudgetForm>({
    paths: [],
    messages: {
      price: "",
    },
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //Functions
  function inputHandler(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    if (!e.target.value) {
      setForm({
        price: convertToPersian(
          priceGenerator(convertAPToEnglish(e.target.value.replace(/\,/g, "")))
        ),
      });
    } else if (
      !convertAPToEnglish(e.target.value.replace(/\,/g, "")).match(/^-?\d+$/)
    ) {
      return;
    } else {
      setForm({
        price: convertToPersian(
          priceGenerator(convertAPToEnglish(e.target.value.replace(/\,/g, "")))
        ),
      });
    }
  }

  function submit(type: "increase" | "decrease") {
    setErrors({
      paths: [],
      messages: {
        price: "",
      },
    });
    setIsLoading(true);
    changeUserBudgetValidator
      .validate(form, { abortEarly: false })
      .then(async () => {
        try {
          await dispatch(
            changeUserBudget(
              type === "increase"
                ? parseInt(
                    convertAPToEnglish(form.price.toString().replace(/\,/g, ""))
                  )
                : -parseInt(
                    convertAPToEnglish(form.price.toString().replace(/\,/g, ""))
                  )
            )
          );
          toast.success("موجودی شما باموفقیت تغییر کرد", {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
          setForm({
            price: "",
          });
          onClose();
        } catch (err: any) {
          toast.error(err.message, {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        let errorsArray: IValidationErrorsChangeUserBudgetForm = {
          paths: [],
          messages: {
            price: "",
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
        <ModalCloseButton className="dark:text-gray-200" />
        <ModalHeader>
          <span className="text-gray-800 dark:text-white">تغییر موجودی</span>
        </ModalHeader>
        <ModalBody>
          <FormControl
            isInvalid={errors.paths.includes("price")}
            variant={"floating"}
            className="mb-3"
          >
            <Input
              focusBorderColor="rose.400"
              placeholder=" "
              type="text"
              value={form.price}
              onChange={inputHandler}
              name="price"
              _invalid={{ borderColor: "inherit" }}
            />
            <FormLabel>مبلغ (تومان)</FormLabel>
            <FormErrorMessage>
              {errors.paths.includes("price") ? errors.messages.price : ""}
            </FormErrorMessage>
            <FormHelperText mt={"2"} mx={"2"}>
              <div className="flex items-center justify-between">
                <div className="text-gray-800 dark:text-gray-200 font-semibold text-sm">
                  <span>موجودی فعلی:</span>
                </div>
                <div className="flex items-center justify-start font-semibold ltr-important text-sm">
                  <span className="mr-1 text-gray-800 dark:text-gray-200">
                    تومان
                  </span>
                  <Skeleton
                    minH="20px"
                    minW={"100px"}
                    isLoaded={user.budget != null ? true : false}
                  >
                    <span className="text-gray-800 dark:text-gray-200">
                      {convertToPersian(priceGenerator(user.budget || 0))}
                    </span>
                  </Skeleton>
                </div>
              </div>
            </FormHelperText>
          </FormControl>
          <div className="mb-4 flex items-center gap-2">
            <Button
              className="flex-1"
              isLoading={isLoading}
              onClick={() => submit("decrease")}
              colorScheme={"rose"}
              variant={isDarkMode ? "outline" : "solid"}
            >
              از حسابم کم کن
            </Button>
            <Button
              className="flex-1"
              isLoading={isLoading}
              onClick={() => submit("increase")}
              colorScheme="green"
              variant={isDarkMode ? "outline" : "solid"}
            >
              به حسابم اضافه کن
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
