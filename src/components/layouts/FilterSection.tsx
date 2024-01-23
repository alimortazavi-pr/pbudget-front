import Select from "react-select";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { FormControl, useDisclosure } from "@chakra-ui/react";

//Redux
import { categoriesSelector } from "@/store/category/selectors";
import { useAppSelector } from "@/store/hooks";

//Tools
import { DocumentFilter } from "iconsax-react";
import MoreFilterModal from "./MoreFilterModal";

export default function FilterSection() {
  //Redux
  const categories = useAppSelector(categoriesSelector);

  //Next
  const router = useRouter();

  //ChakraUI
  const { isOpen, onOpen, onClose } = useDisclosure();

  //States
  const [category, setCategory] = useState<string>("");
  const [categoriesOptions, setCategoriesOptions] = useState<
    { value: string; label: string }[]
  >([]);

  //Effect
  useEffect(() => {
    let categoriesOptionsHandler: { value: string; label: string }[] = [
      { value: "", label: "همه دسته بندی ها" },
    ];
    categories?.forEach((category) => {
      categoriesOptionsHandler.push({
        value: category._id,
        label: category.title as string,
      });
    });
    setCategoriesOptions(categoriesOptionsHandler);
  }, [categories]);

  useEffect(() => {
    if (router.query.category) {
      setCategory(router.query.category as string);
    } else {
      setCategory("همه دسته بندی ها");
    }
  }, [router.query]);

  //Functions
  function categoryFilter(val: any) {
    setCategory(val.value);
    router.replace({
      pathname: "/",
      query: { ...router.query, category: val.label.trim() },
    });
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-2 mb-2 rounded-2xl md:rounded-md flex items-center gap-2">
      <FormControl className="w-full">
        <Select
          options={categoriesOptions}
          onChange={categoryFilter}
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
      <div
        className="flex items-center gap-2 p-[7px] text-gray-800 dark:text-gray-200 min-w-max border rounded-[0.375rem] border-gray-200 dark:border-white hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
        onClick={onOpen}
      >
        <span>فیلتر</span>
        <DocumentFilter size="18" />
      </div>
      <MoreFilterModal isOpen={isOpen} onOpen={onOpen} onClose={onClose} />
    </div>
  );
}
