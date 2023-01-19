import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  useDisclosure,
} from "@chakra-ui/react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

//Types
import {
  IEditProfileForm,
  IValidationErrorsEditProfileForm,
} from "@/ts/interfaces/profile.interface";
import { theProfileProps } from "@/ts/types/profile.type";

//Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { userSelector } from "@/store/profile/selectors";
import { editProfile } from "@/store/profile/actions";
import { darkModeSelector } from "@/store/layout/selectors";

//Components
import TheNavigation from "@/components/layouts/TheNavigation";
import ChangeUserBudgetModal from "@/components/profile/ChangeUserBudgetModal";

//Tools
import priceGenerator from "price-generator";
import convertToPersian from "num-to-persian";
import { toast } from "react-toastify";

//Validators
import { editProfileValidator } from "@/validators/profileValidator";
import ChangeMobileModal from "@/components/profile/ChangeMobileModal";

//Styles

export default function TheProfile({}: theProfileProps) {
  //Redux
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const isDarkMode = useAppSelector(darkModeSelector);

  //ChakraUI
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpenChangeMobile,
    onOpen: onOpenChangeMobile,
    onClose: onCloseChangeMobile,
  } = useDisclosure();

  //States
  const [form, setForm] = useState<IEditProfileForm>({
    firstName: "",
    lastName: "",
    mobile: "",
  });
  const [errors, setErrors] = useState<IValidationErrorsEditProfileForm>({
    paths: [],
    messages: {
      firstName: "",
      lastName: "",
      mobile: "",
    },
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //Effect
  useEffect(() => {
    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      mobile: user.mobile || "",
    });
  }, [user]);

  //Functions
  function inputHandler(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setErrors({
      paths: [],
      messages: {
        firstName: "",
        lastName: "",
        mobile: "",
      },
    });
    setIsLoading(true);
    editProfileValidator
      .validate(form, { abortEarly: false })
      .then(async () => {
        try {
          await dispatch(editProfile(form));
          toast.success("پروفایل شما با موفقیت ویرایش شد", {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
        } catch (err: any) {
          toast.error(err.message, {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        let errorsArray: IValidationErrorsEditProfileForm = {
          paths: [],
          messages: {
            firstName: "",
            lastName: "",
            mobile: "",
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
    <div className="flex flex-col items-center md:mt-5">
      <TheNavigation title="پروفایل" isEnabledPreviousPage />
      <div className="px-2 md:px-0 w-full max-w-md">
        <div className="w-full overflow-y-auto rounded-lg py-2 px-2 bg-sky-900 dark:bg-gray-800 mb-2">
          <div className="text-xl font-bold text-white dark:text-gray-200 md:mb-3">
            <span>موجودی</span>
            {user.budget && user?.budget < 0 ? (
              <span className="text-red-400 mr-1 text-sm self-center">
                (کمبود وجه)
              </span>
            ) : null}
          </div>
          <div className="flex items-end justify-start text-xl font-bold ltr-important mb-4">
            <span className="text-xs mr-1 text-white dark:text-gray-200">
              تومان
            </span>
            <span className="text-white dark:text-gray-200">
              {convertToPersian(priceGenerator(user.budget || 0))}
            </span>
          </div>
          <Button
            colorScheme={isDarkMode ? "teal" : "teal"}
            variant={isDarkMode ? "outline" : "solid"}
            className="w-full"
            type="submit"
            isLoading={isLoading || !form.firstName}
            onClick={onOpen}
          >
            تغییر موجودی
          </Button>
        </div>
        <hr className="my-2 dark:border-gray-600" />
        <form
          onSubmit={submit}
          className="px-3 flex flex-col gap-x-2 gap-y-4 bg-white dark:bg-gray-800 p-5 rounded-2xl md:rounded-md"
        >
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
              disabled={!form.firstName}
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
            className=""
          >
            <Input
              focusBorderColor="rose.400"
              placeholder=" "
              type="text"
              value={form.lastName}
              onChange={inputHandler}
              name="lastName"
              disabled={!form.firstName}
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
            className=""
          >
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  focusBorderColor="rose.400"
                  placeholder=" "
                  type="text"
                  value={form.mobile}
                  onChange={inputHandler}
                  name="mobile"
                  disabled
                />
                <FormLabel>شماره موبایل</FormLabel>
              </div>
              <div>
                <Button
                  colorScheme={isDarkMode ? "gray" : "blackAlpha"}
                  onClick={onOpenChangeMobile}
                >
                  تغییر شماره موبایل
                </Button>
              </div>
            </div>
            <FormErrorMessage>
              {errors.paths.includes("mobile") ? errors.messages.mobile : ""}
            </FormErrorMessage>
          </FormControl>
          <div className="flex flex-col-reverse items-center justify-center lg:flex-row">
            <Button
              colorScheme={"rose"}
              variant={"outline"}
              className="w-full"
              type="submit"
              isLoading={isLoading || !form.mobile}
            >
              ویرایش
            </Button>
          </div>
        </form>
      </div>
      <ChangeMobileModal
        isOpen={isOpenChangeMobile}
        onClose={onCloseChangeMobile}
        onOpen={onOpenChangeMobile}
        mobile={user.mobile as string}
      />
      <ChangeUserBudgetModal
        isOpen={isOpen}
        onClose={onClose}
        onOpen={onOpen}
      />
    </div>
  );
}
