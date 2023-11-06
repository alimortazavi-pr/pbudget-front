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
import { useEffect, useState } from "react";
import Select from "react-select";

//Types
import {
  chakraUIModalsProps,
  durationTypes,
  exportTypes,
} from "@/ts/types/layouts.type";

//Redux
import { categoriesSelector } from "@/store/category/selectors";
import { useAppSelector } from "@/store/hooks";
import { tokenSelector } from "@/store/auth/selectors";

//Components
import FilterDatePicker from "@/components/layouts/FilterDatePicker";

//Tools
import api from "@/api";

export default function HtmlAndExcelExportModal({
  isOpen,
  onOpen,
  onClose,
}: chakraUIModalsProps) {
  //Redux
  const categories = useAppSelector(categoriesSelector);
  const token = useAppSelector(tokenSelector);

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
  const [duration, setDuration] = useState<durationTypes>("monthly");
  const [exportType, setExportType] = useState<exportTypes>("excel");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //Effects
  useEffect(() => {
    if (router.query.duration) {
      setDuration(router.query.duration as durationTypes);
    }
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
        label: category.title as string,
      });
    });
    setCategoriesOptions(categoriesOptionsHandler);
  }, [categories]);

  //Functions
  async function exportHandler() {
    setIsLoading(true);
    try {
      if (exportType == "excel") {
        const response = await api(
          `/budgets/excel-export?duration=${duration}&year=${date.year}&month=${date.month
          }${duration === "daily" ? "&day=" + date.day : ""}${category && category != "همه دسته بندی ها"
            ? "&category=" + category
            : ""
          }`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            responseType: "blob",
          }
        );

        const file = new File(
          [response.data],
          `excel-export-${new Date().getTime()}.xlsx`
        );
        const url = window.URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = url;
        link.download = `excel-export-${new Date().getTime()}.xlsx`;
        link.click();
      } else if (exportType == "html") {
        const response = await api(
          `/budgets/${exportType}-export?duration=${duration}&year=${date.year
          }&month=${date.month}${duration === "daily" ? "&day=" + date.day : ""
          }${category && category != "همه دسته بندی ها"
            ? "&category=" + category
            : ""
          }`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            responseType: "blob",
          }
        );
        const file = new File(
          [response.data],
          `html-export-${new Date().getTime()}.html`
        );
        const url = window.URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = url;
        link.download = `html-export-${new Date().getTime()}.html`;
        link.click();
      }
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      console.log(err.message);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <span className="text-gray-800 dark:text-white">خروجی تراکنش ها</span>
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
          <hr className="border-rose-300 my-3" />
          <div className="grid grid-cols-3 items-center gap-2">
            <div
              onClick={() => setDuration("daily")}
              className={`col-span-1 flex items-center justify-center h-10 border border-rose-500 ${duration == "daily"
                  ? "bg-rose-500 text-gray-100"
                  : "bg-transparent text-gray-800"
                } rounded-lg cursor-pointer`}
            >
              <span className="leading-none">روزانه</span>
            </div>
            <div
              onClick={() => setDuration("monthly")}
              className={`col-span-1 flex items-center justify-center h-10 border border-rose-500 ${duration == "monthly"
                  ? "bg-rose-500 text-gray-100"
                  : "bg-transparent text-gray-800"
                } rounded-lg cursor-pointer`}
            >
              <span className="leading-none">ماهانه</span>
            </div>
            <div
              onClick={() => setDuration("yearly")}
              className={`col-span-1 flex items-center justify-center h-10 border border-rose-500 ${duration == "yearly"
                  ? "bg-rose-500 text-gray-100"
                  : "bg-transparent text-gray-800"
                } rounded-lg cursor-pointer`}
            >
              <span className="leading-none">سالانه</span>
            </div>
            <div
              onClick={() => setDuration("all")}
              className={`col-span-3 flex items-center justify-center h-10 border border-rose-500 ${duration == "all"
                  ? "bg-rose-500 text-gray-100"
                  : "bg-transparent text-gray-800"
                } rounded-lg cursor-pointer`}
            >
              <span className="leading-none">تمام تراکنش ها</span>
            </div>
          </div>
          <hr className="border-rose-300 my-3" />
          <div className="flex items-center gap-2">
            <div
              onClick={() => setExportType("excel")}
              className={`flex-1 flex items-center justify-center h-10 border border-rose-500 ${exportType == "excel"
                  ? "bg-rose-500 text-gray-100"
                  : "bg-transparent text-gray-800"
                } rounded-lg cursor-pointer`}
            >
              <span className="leading-none font-poppins text-sm">Excel</span>
            </div>
            <div
              onClick={() => setExportType("html")}
              className={`flex-1 flex items-center justify-center h-10 border border-rose-500 ${exportType == "html"
                  ? "bg-rose-500 text-gray-100"
                  : "bg-transparent text-gray-800"
                } rounded-lg cursor-pointer`}
            >
              <span className="leading-none font-poppins text-sm">
                Web (HTML)
              </span>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="gray" ml={3} onClick={onClose}>
            بستن
          </Button>
          <Button
            isLoading={isLoading}
            onClick={exportHandler}
            colorScheme="rose"
          >
            دریافت خروجی
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
