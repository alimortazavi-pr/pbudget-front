import {
  Button,
  FormControl,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { ChangeEvent, useEffect, useState } from "react";
import Select from "react-select";

//Types
import { moreFilterModalProps } from "@/ts/types/layouts.type";

//Redux
import { categoriesSelector } from "@/store/category/selectors";
import { useAppSelector } from "@/store/hooks";
import FilterDatePicker from "./FilterDatePicker";

//Tools

//Validators

export default function MoreFilterModal({
  isOpen,
  onOpen,
  onClose,
}: moreFilterModalProps) {
  //Redux
  const categories = useAppSelector(categoriesSelector);

  //Next
  const router = useRouter();

  //States
  const [category, setCategory] = useState<string>("");
  const [categoriesOptions, setCategoriesOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [date, setDate] = useState<{
    year: string;
    month: string;
    day: string;
  }>({ year: "", month: "", day: "" });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //Effects
  useEffect(() => {
    if (router.query.category) {
      setCategory(router.query.category as string);
    } else {
      setCategory("همه دسته بندی ها");
    }
  }, [router.query]);

  useEffect(() => {
    let categoriesOptionsHandler: { value: string; label: string }[] = [
      { value: "", label: "همه دسته بندی ها" },
    ];
    categories?.forEach((category) => {
      categoriesOptionsHandler.push({
        value: category._id,
        label: category.title,
      });
    });
    setCategoriesOptions(categoriesOptionsHandler);
  }, [categories]);

  //Functions
  function submit() {
    setIsLoading(true);
    router.replace({
      pathname: "/",
      query: {
        ...router.query,
        year: date.year,
        month: date.month,
        day: date.day,
        category: category,
      },
    });
    setIsLoading(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <span className="text-gray-800 dark:text-white">
            فیلتر دریافتی/پرداختی ها
          </span>
        </ModalHeader>
        <ModalBody>
          <FormControl className="mb-2">
            <Select
              options={categoriesOptions}
              onChange={(val: any) => setCategory(val.label)}
              placeholder="فیلتر بر اساس دسته بندی"
              className="my-react-select-container"
              classNamePrefix="my-react-select"
              noOptionsMessage={() => "هنوز دسته‌ای ایجاد نکرده اید"}
              value={
                category
                  ? categoriesOptions.find((cat) => cat.label === category)
                  : ""
              }
            />
          </FormControl>
          <FilterDatePicker date={date} setDate={setDate} />
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="gray" ml={3} onClick={onClose}>
            بستن
          </Button>
          <Button isLoading={isLoading} onClick={submit} colorScheme="rose">
            فیلتر
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
