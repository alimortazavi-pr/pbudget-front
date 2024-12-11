import {
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Switch,
  Textarea,
  useDisclosure,
} from "@chakra-ui/react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Select from "react-select";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";

//Types
import {
  IBudget,
  ICreateAndEditBudgetForm,
  IValidationErrorsCreateAndEditBudgetForm,
} from "@/ts/interfaces/budget.interface";
import { editBudgetProps } from "@/ts/types/budget.type";
import { budgetTypeEnum } from "@/ts/enums/budget.enum";
import { categoriesSelector } from "@/store/category/selectors";
import {
  ICreateAndEditCreditForm,
  IValidationErrorsCreateAndEditCreditForm,
} from "@/ts/interfaces/credit.interface";

//Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { darkModeSelector } from "@/store/layout/selectors";
import { editBudget } from "@/store/budget/actions";
import { createCredit, editCredit } from "@/store/credit/actions";

//Components
import TheNavigation from "@/components/layouts/TheNavigation";
import CreateCategoryModal from "@/components/categories/CreateCategoryModal";
import BudgetDatePicker from "@/components/budgets/BudgetDatePicker";
import CreateOrEditCredit from "@/components/credits/CreateOrEditCredit";

//Tools
import priceGenerator from "price-generator";
import convertToPersian from "num-to-persian";
import convertAPToEnglish from "ap-to-english";
import { toast } from "react-toastify";
import api from "@/api";

//Validators
import { createAndEditBudget } from "@/validators/budgetValidator";

export default function EditBudget({ budget }: editBudgetProps) {
  //Redux
  const dispatch = useAppDispatch();
  const categories = useAppSelector(categoriesSelector);
  const isDarkMode = useAppSelector(darkModeSelector);

  //Next
  const router = useRouter();

  //ChakraUI
  const { isOpen, onOpen, onClose } = useDisclosure();

  //States
  const [form, setForm] = useState<ICreateAndEditBudgetForm>({
    price: "",
    type: 1,
    year: "",
    month: "",
    day: "",
    category: "",
    description: "",
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
        description: "",
      },
    });
  const [formCredit, setFormCredit] = useState<ICreateAndEditCreditForm>({
    price: "",
    type: 1,
    year: "",
    month: "",
    day: "",
    category: "",
    description: "",
    paid: false,
    person: "",
  });
  const [errorsCredit, setErrorsCredit] =
    useState<IValidationErrorsCreateAndEditCreditForm>({
      paths: [],
      messages: {
        price: "",
        type: "",
        year: "",
        month: "",
        day: "",
        category: "",
        description: "",
        paid: false,
        person: "",
      },
    });
  const [categoriesOptions, setCategoriesOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreatingCredit, setIsCreatingCredit] = useState<boolean>(true);

  //Effect
  useEffect(() => {
    setForm({
      ...budget,
      category: budget.category._id,
      price: convertToPersian(
        priceGenerator(
          convertAPToEnglish(budget.price.toString().replace(/\,/g, ""))
        )
      ),
    });
    if (budget.credits && budget.credits.length > 0) {
      setFormCredit({
        ...budget,
        category: budget.category._id,
        price: convertToPersian(
          priceGenerator(
            convertAPToEnglish(budget.price.toString().replace(/\,/g, ""))
          )
        ),
        paid: budget.credits[0].paid,
        person: budget.credits[0].person,
      });
    } else {
      setIsCreatingCredit(false);
    }
  }, [budget]);

  useEffect(() => {
    if (
      isCreatingCredit &&
      !formCredit.person &&
      budget.credits &&
      budget.credits.length > 0
    ) {
      setFormCredit({
        ...form,
        paid: budget.credits[0].paid,
        person: budget.credits[0].person,
      });
    } else if (isCreatingCredit) {
      setFormCredit({
        ...form,
        paid: formCredit.paid,
        person: formCredit.person,
      });
    }
  }, [isCreatingCredit, form]);

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

  function descriptionHandler(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({
      ...form,
      description: convertAPToEnglish(e.target.value.replace(/\,/g, "")),
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
        year: "",
        month: "",
        day: "",
        category: "",
        description: "",
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
          if (budget.credits && budget.credits.length > 0) {
            await dispatch(
              editCredit(
                {
                  ...formCredit,
                  price: parseInt(
                    convertAPToEnglish(form.price.toString().replace(/\,/g, ""))
                  ),
                },
                budget.credits[0]._id
              )
            );
          } else if(formCredit.person) {
            await dispatch(
              createCredit(
                {
                  ...formCredit,
                  price: parseInt(
                    convertAPToEnglish(form.price.toString().replace(/\,/g, ""))
                  ),
                },
                budget._id
              )
            );
          }
          await dispatch(
            editBudget(
              {
                ...form,
                price: parseInt(
                  convertAPToEnglish(form.price.toString().replace(/\,/g, ""))
                ),
              },
              budget._id
            )
          );
          toast.success("تراکنش باموفقیت ویرایش شد", {
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
            description: "",
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
      <TheNavigation title="ویرایش تراکنش" isEnabledPreviousPageIcon />
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
              styles={{
                menu: (provided) => ({
                  ...provided,
                  zIndex: 5,
                }),
              }}
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
          <FormControl
            isInvalid={errors.paths.includes("description")}
            variant={"floating"}
            className=""
            style={{
              color: isDarkMode ? "white" : "black",
            }}
          >
            <Textarea
              focusBorderColor="rose.400"
              placeholder=" "
              value={form.description}
              onChange={descriptionHandler}
              name="description"
              _invalid={{ borderColor: "inherit" }}
            />
            <FormLabel>توضیحات دلخواه</FormLabel>
            <FormErrorMessage>
              {errors.paths.includes("description")
                ? errors.messages.description
                : ""}
            </FormErrorMessage>
          </FormControl>
          <CreateOrEditCredit
            form={formCredit}
            setForm={setFormCredit}
            errors={errorsCredit}
            isCreating={isCreatingCredit}
            setIsCreating={setIsCreatingCredit}
          />
          <div className="col-span-12 flex flex-col-reverse items-center justify-center lg:flex-row">
            <Button
              colorScheme={"rose"}
              variant={"outline"}
              className="w-full"
              type="submit"
              isLoading={isLoading}
            >
              ویرایش
            </Button>
          </div>
        </form>
        <hr className="my-2 dark:border-gray-600" />
        <Button
          colorScheme="rose"
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
  let budget: IBudget | object = {};
  try {
    if (req.cookies.userAuthorization) {
      const transformedData = JSON.parse(req.cookies.userAuthorization);
      const budgetResponse = await api.get(`/budgets/${query.budgetId}`, {
        headers: {
          Authorization: `Bearer ${transformedData.token}`,
        },
      });
      budget = budgetResponse.data.budget;
    }
  } catch (error: any) {
    console.log(error.response?.data);
  }

  return {
    props: {
      budget: budget,
    },
  };
};
