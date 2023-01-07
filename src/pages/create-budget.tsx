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
import { GetServerSideProps } from "next";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Select from "react-select";
import { useRouter } from "next/router";

//Types
import {
  ICreateAndEditBudgetForm,
  IValidationErrorsCreateAndEditBudgetForm,
} from "@/ts/interfaces/budget.interface";
import { createBudgetProps } from "@/ts/types/budget.type";
import { ICategory } from "@/ts/interfaces/category.interface";
import { budgetTypeEnum } from "@/ts/enums/budget.enum";

//Redux
import { useAppDispatch } from "@/store/hooks";
import { createBudget } from "@/store/budget/actions";

//Components
import TheNavigation from "@/components/layouts/TheNavigation";
import CreateCategoryModal from "@/components/categories/CreateCategoryModal";
import BudgetDatePicker from "@/components/budgets/BudgetDatePicker";

//Tools
import api from "@/api";
import priceGenerator from "price-generator";
import convertToPersian from "num-to-persian";
import { toast } from "react-toastify";

//Validators
import { createAndEditBudget } from "@/validators/budgetValidator";

//Styles
import CustomReactSelectStyle from "@/assets/styles/CustomReactSelectStyle";

export default function CreateBudget({ categories }: createBudgetProps) {
  //Redux
  const dispatch = useAppDispatch();

  //Next
  const router = useRouter();

  //ChakraUI
  const { isOpen, onOpen, onClose } = useDisclosure();

  //States
  const [form, setForm] = useState<ICreateAndEditBudgetForm>({
    price: "",
    type: 0,
    date: "",
    category: "",
  });
  const [pricePreview, setPricePreview] = useState<string>("0");
  const [errors, setErrors] =
    useState<IValidationErrorsCreateAndEditBudgetForm>({
      paths: [],
      messages: {
        price: "",
        type: "",
        date: "",
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
    categories.forEach((category) => {
      categoriesOptionsHandler.push({
        value: category._id,
        label: category.title,
      });
    });
    setCategoriesOptions(categoriesOptionsHandler);
  }, [categories]);

  useEffect(() => {
    setPricePreview(
      convertToPersian(
        priceGenerator(form.price?.toString().split(",").join("") || "0")
      )
    );
  }, [form.price]);

  //Functions
  function inputHandler(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
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
        date: "",
        category: "",
      },
    });
    setIsLoading(true);
    createAndEditBudget
      .validate(form, { abortEarly: false })
      .then(async () => {
        try {
          await dispatch(createBudget(form));
          toast.success("دریافتی/پرداختی باموفقیت ایجاد شد", {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
          router.push("/");
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
            date: "",
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
      <TheNavigation title="ایجاد دریافتی/پرداختی" isEnabledPreviousPage />
      <div className="px-2 md:px-0 w-full max-w-md">
        <form
          onSubmit={submit}
          className="px-3 flex flex-col gap-x-2 gap-y-5 bg-white p-5 rounded-2xl md:rounded-md"
        >
          <div className="flex items-start justify-between gap-2">
            <FormControl
              isInvalid={errors.paths.includes("price")}
              variant={"floating"}
              className=""
            >
              <Input
                focusBorderColor="red.400"
                placeholder=" "
                type="number"
                value={form.price}
                onChange={inputHandler}
                name="price"
              />
              <FormLabel>مبلغ</FormLabel>
              <FormHelperText mt={"1"}>
                <span>{pricePreview ? pricePreview : "۰"}</span>
                <span className="mr-1">تومان</span>
              </FormHelperText>
              <FormErrorMessage>
                {errors.paths.includes("price") ? errors.messages.price : ""}
              </FormErrorMessage>
            </FormControl>
            <div>
              <FormControl className="flex items-center h-10">
                <FormLabel htmlFor="type" mb="0" ml={"2"}>
                  {form.type === budgetTypeEnum.INCOME ? "دریافتی" : "پرداختی"}
                </FormLabel>
                <Switch
                  id="type"
                  onChange={typeHandler}
                  colorScheme={"red"}
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
              styles={CustomReactSelectStyle}
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
              colorScheme="red"
              variant={"outline"}
              className="w-full"
              type="submit"
              isLoading={isLoading}
            >
              ایجاد
            </Button>
          </div>
        </form>
        <hr className="my-2" />
        <Button
          colorScheme="red"
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

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  query,
}) => {
  let categories: ICategory[] = [];
  try {
    if (req.cookies.userAuthorization) {
      const transformedData = JSON.parse(req.cookies.userAuthorization);
      const response = await api.get(`/categories`, {
        headers: {
          Authorization: `Bearer ${transformedData.token}`,
        },
      });
      categories = response.data.categories;
    }
  } catch (error: any) {
    console.log(error.response?.data);
  }

  return {
    props: {
      categories: categories,
    },
  };
};
