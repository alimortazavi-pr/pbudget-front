import {
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Skeleton,
} from "@chakra-ui/react";
import { ChangeEvent, useState } from "react";

//Types
import {
  IChangeBudgetBoxForm,
  IValidationErrorsChangeBudgetBoxForm,
} from "@/ts/interfaces/box.interface";
import { ChangeBoxBudgetProps } from "@/ts/types/box.type";

//Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { darkModeSelector } from "@/store/layout/selectors";

//Tools
import { toast } from "react-toastify";
import convertToPersian from "num-to-persian";
import priceGenerator from "price-generator";
import convertAPToEnglish from "ap-to-english";

//Validators
import { changeUserBudgetValidator } from "@/validators/profileValidator";
import { changeBoxBudget } from "@/store/box/actions";

export default function ChangeBoxBudgetSection({
  box,
  onClose,
}: ChangeBoxBudgetProps) {
  //Redux
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector(darkModeSelector);

  //Next

  //States
  const [form, setForm] = useState<IChangeBudgetBoxForm>({
    price: "",
  });
  const [errors, setErrors] = useState<IValidationErrorsChangeBudgetBoxForm>({
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
        ...form,
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
        ...form,
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
            changeBoxBudget(
              {
                price:
                  type === "increase"
                    ? parseInt(
                        convertAPToEnglish(
                          form.price.toString().replace(/\,/g, "")
                        )
                      )
                    : -parseInt(
                        convertAPToEnglish(
                          form.price.toString().replace(/\,/g, "")
                        )
                      ),
              },
              box
            )
          );
          toast.success("موجودی باکس باموفقیت تغییر کرد", {
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
        let errorsArray: IValidationErrorsChangeBudgetBoxForm = {
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
    <div>
      <h6 className="text-gray-800 dark:text-gray-200 font-semibold mb-1">
        تغییر موجودی باکس
      </h6>
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
                isLoaded={box.budget != null ? true : false}
              >
                <span className="text-gray-800 dark:text-gray-200">
                  {convertToPersian(priceGenerator(box.budget || 0))}
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
          از حساب باکس کم کن
        </Button>
        <Button
          className="flex-1"
          isLoading={isLoading}
          onClick={() => submit("increase")}
          colorScheme="green"
          variant={isDarkMode ? "outline" : "solid"}
        >
          به حساب باکس اضافه کن
        </Button>
      </div>
    </div>
  );
}
