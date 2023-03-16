import {
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Switch,
  useDisclosure,
} from "@chakra-ui/react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Select from "react-select";
import { useRouter } from "next/router";

//Types
import {
  ICreateAndEditBudgetForm,
  IValidationErrorsCreateAndEditBudgetForm,
} from "@/ts/interfaces/budget.interface";
import { createBudgetProps } from "@/ts/types/budget.type";
import { budgetTypeEnum } from "@/ts/enums/budget.enum";

//Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createBudget } from "@/store/budget/actions";
import { categoriesSelector } from "@/store/category/selectors";

//Components
import TheNavigation from "@/components/layouts/TheNavigation";
import CreateCategoryModal from "@/components/categories/CreateCategoryModal";
import BudgetDatePicker from "@/components/budgets/BudgetDatePicker";

//Tools
import priceGenerator from "price-generator";
import convertToPersian from "num-to-persian";
import { toast } from "react-toastify";
import convertAPToEnglish from "ap-to-english";

//Validators
import { createAndEditBudget } from "@/validators/budgetValidator";

export default function CreateBudget({}: createBudgetProps) {
  //Redux
  const dispatch = useAppDispatch();
  const categories = useAppSelector(categoriesSelector);

  //Next
  const router = useRouter();

  //ChakraUI
  const { isOpen, onOpen, onClose } = useDisclosure();

  //States
  const [form, setForm] = useState<ICreateAndEditBudgetForm>({
    price: "",
    type: 0,
    year: "",
    month: "",
    day: "",
    category: "",
  });
  const [errors, setErrors] =
    useState<IValidationErrorsCreateAndEditBudgetForm>({
      paths: [],
      messages: {
        price: "",
        type: "",
        year: "",
        month: "",
        day: "",
        category: "",
      },
    });
  const [categoriesOptions, setCategoriesOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //Effect
  useEffect(() => {
    let categoriesOptionsHandler: { value: string; label: string }[] = [];
    categories?.forEach((category) => {
      categoriesOptionsHandler.push({
        value: category._id,
        label: category.title as string,
      });
    });
    setCategoriesOptions(categoriesOptionsHandler);
  }, [categories]);

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

  function typeHandler(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      setForm({ ...form, type: budgetTypeEnum.COST });
    } else {
      setForm({ ...form, type: budgetTypeEnum.INCOME });
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setErrors({
      paths: [],
      messages: {
        price: "",
        type: "",
        year: "",
        month: "",
        day: "",
        category: "",
      },
    });
    setIsLoading(true);
    createAndEditBudget
      .validate(
        {
          ...form,
          price:
            parseInt(
              convertAPToEnglish(form.price.toString().replace(/\,/g, ""))
            ) || "",
        },
        { abortEarly: false }
      )
      .then(async () => {
        try {
          await dispatch(
            createBudget({
              ...form,
              price: parseInt(
                convertAPToEnglish(form.price.toString().replace(/\,/g, ""))
              ),
            })
          );
          toast.success("تراکنش باموفقیت ایجاد شد", {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
          router.push({
            pathname: "/",
            query: {
              duration: "monthly",
              year: form.year,
              month: form.month,
            },
          });
        } catch (err: any) {
          toast.error(err.message, {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        let errorsArray: IValidationErrorsCreateAndEditBudgetForm = {
          paths: [],
          messages: {
            price: "",
            type: "",
            year: "",
            month: "",
            day: "",
            category: "",
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
      <TheNavigation title="ایجاد تراکنش" isEnabledPreviousPageIcon />
      <div className="px-2 md:px-0 w-full max-w-md">
        <form
          onSubmit={submit}
          className="px-3 flex flex-col gap-x-2 gap-y-5 bg-white dark:bg-gray-800 p-5 rounded-2xl md:rounded-md"
        >
          <div className="flex items-start justify-between gap-2">
            <FormControl
              isInvalid={errors.paths.includes("price")}
              variant={"floating"}
              className=""
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
            </FormControl>
            <div>
              <FormControl className="flex items-center h-10">
                <FormLabel
                  htmlFor="type"
                  mb="0"
                  ml={"2"}
                  className="dark:text-white"
                >
                  {form.type === budgetTypeEnum.INCOME ? "دریافتی" : "پرداختی"}
                </FormLabel>
                <Switch
                  id="type"
                  onChange={typeHandler}
                  colorScheme={"rose"}
                  isChecked={form.type === budgetTypeEnum.COST ? true : false}
                />
              </FormControl>
            </div>
          </div>
          <BudgetDatePicker
            errors={errors}
            setErrors={setErrors}
            form={form}
            setForm={setForm}
          />
          <FormControl
            isInvalid={errors.paths.includes("category")}
            className=""
          >
            <Select
              options={categoriesOptions}
              onChange={(val: any) =>
                setForm({ ...form, category: val.value as string })
              }
              placeholder="دسته بندی"
              className="my-react-select-container"
              classNamePrefix="my-react-select"
              noOptionsMessage={() => "هنوز دسته‌ای ایجاد نکرده اید"}
              value={
                form.category
                  ? categoriesOptions.find(
                      (category) => category.value === form.category
                    )
                  : ""
              }
            />
            <FormErrorMessage>
              {errors.paths.includes("category")
                ? errors.messages.category
                : ""}
            </FormErrorMessage>
          </FormControl>
          <div className="col-span-12 flex flex-col-reverse items-center justify-center lg:flex-row">
            <Button
              colorScheme={"rose"}
              variant={"outline"}
              className="w-full"
              type="submit"
              isLoading={isLoading}
            >
              ایجاد
            </Button>
          </div>
        </form>
        <hr className="my-2 dark:border-gray-600" />
        <Button
          colorScheme={"rose"}
          className="w-full"
          type="submit"
          isLoading={isLoading}
          onClick={onOpen}
        >
          ایجاد دسته بندی
        </Button>
      </div>
      <CreateCategoryModal isOpen={isOpen} onClose={onClose} onOpen={onOpen} />
    </div>
  );
}
