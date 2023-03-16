import { Button } from "@chakra-ui/button";
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
} from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDisclosure } from "@chakra-ui/react";

//Types
import { IValidationErrorsCheckMobileExist } from "@/ts/interfaces/auth.interface";

//Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { checkMobileExist } from "@/store/auth/actions";
import { isAuthSelector } from "@/store/auth/selectors";

//Components
import SignUpModal from "@/components/auth/SignUpModal";
import SignInModal from "@/components/auth/SignInModal";

//Tools
import { toast } from "react-toastify";

//Validators
import { checkMobileExistValidator } from "@/validators/authValidator";

export default function GetStarted() {
  //Redux
  const dispatch = useAppDispatch();
  const isAuth = useAppSelector(isAuthSelector);

  //Next
  const router = useRouter();

  //ChakraUI
  const {
    isOpen: isOpenSignUp,
    onOpen: onOpenSignUp,
    onClose: onCloseSignUp,
  } = useDisclosure();
  const {
    isOpen: isOpenSignIn,
    onOpen: onOpenSignIn,
    onClose: onCloseSignIn,
  } = useDisclosure();
  const {
    isOpen: isOpenResetCode,
    onOpen: onOpenResetCode,
    onClose: onCloseResetCode,
  } = useDisclosure();

  //States
  const [mobile, setMobile] = useState<string>("");
  const [errors, setErrors] = useState<IValidationErrorsCheckMobileExist>({
    paths: [],
    messages: {
      mobile: "",
    },
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //Effects
  useEffect(() => {
    if (isAuth) {
      router.push("/");
    }
  }, [isAuth]);

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight);
    }, 100);
  }, []);

  //Functions
  function inputHandler(e: ChangeEvent<HTMLInputElement>) {
    setMobile(e.target.value);
  }

  async function authModalHandler() {
    const res: any = await dispatch(checkMobileExist(mobile));
    if (res) {
      onOpenSignUp();
    } else {
      onOpenSignIn();
    }
  }

  async function submit(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    setErrors({
      paths: [],
      messages: {
        mobile: "",
      },
    });
    setIsLoading(true);
    checkMobileExistValidator
      .validate({ mobile: mobile }, { abortEarly: false })
      .then(async () => {
        try {
          await authModalHandler();
          setIsLoading(false);
        } catch (err: any) {
          toast.error(err.message, {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        let errorsArray: IValidationErrorsCheckMobileExist = {
          paths: [],
          messages: {
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
    <div className="min-w-full min-h-screen bg-rose-400">
      <div className="h-[65vh] w-full bg-rose-400 flex items-center justify-center">
        <span className="text-3xl font-extralight font-poppins">P BUDGET</span>
      </div>
      <div className="min-h-[35vh] w-full bg-white dark:bg-gray-800 rounded-t-xl px-5 flex flex-col">
        <div>
          <div className="pt-6 mb-5">
            <span className="text-gray-800 dark:text-white font-bold text-2xl">
              خیلی خوش آمدی :)
            </span>
          </div>
          <div className="mb-4">
            <span className="text-gray-800 dark:text-white">
              لطفا برای ورود یا ثبت‌نام شماره موبایل خود را وارد کنید.
            </span>
          </div>
        </div>
        <form
          className="flex-1 flex flex-col justify-end pb-5"
          onSubmit={submit}
        >
          <FormControl
            isInvalid={errors.paths.includes("mobile")}
            variant={"floating"}
            className="mb-3"
          >
            <Input
              focusBorderColor="rose.400"
              placeholder=" "
              type="text"
              value={mobile}
              onChange={inputHandler}
              name="mobile"
              _invalid={{ borderColor: "inherit" }}
            />
            <FormLabel>شماره موبایل</FormLabel>
            <FormErrorMessage>
              {errors.paths.includes("mobile") ? errors.messages.mobile : ""}
            </FormErrorMessage>
          </FormControl>
          <Button
            isLoading={isLoading}
            type="submit"
            colorScheme={"rose"}
            className="w-full"
          >
            ادامه
          </Button>
        </form>
      </div>
      <SignUpModal
        isOpen={isOpenSignUp}
        onOpen={onOpenSignUp}
        onClose={onCloseSignUp}
        mobile={mobile}
      />
      <SignInModal
        isOpen={isOpenSignIn}
        onOpen={onOpenSignIn}
        onClose={onCloseSignIn}
        mobile={mobile}
      />
    </div>
  );
}
