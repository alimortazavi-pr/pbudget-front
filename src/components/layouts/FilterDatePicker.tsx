import { FormControl } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

//Types
import { filterDatePickerProps } from "@/ts/types/layouts.type";

//Components

//Tools
import moment from "jalali-moment";
import DatePicker from "react-multi-date-picker";
import persianLocale from "react-date-object/locales/persian_fa";
import persianCalendar from "react-date-object/calendars/persian";

export default function FilterDatePicker({
  date,
  setDate,
}: filterDatePickerProps) {
  //Next
  const router = useRouter();

  //States
  const [dateValue, setDateValue] = useState<string>("");

  //Effects
  useEffect(() => {
    if (router.query.year && router.query.month && !dateValue) {
      setDateValue(
        `${router.query.year}/${router.query.month}/${
          router.query.day ? router.query.day : "01"
        }`
      );
      setDate({
        year: router.query.year as string,
        month: router.query.month as string,
        day: router.query.day ? (router.query.day as string) : "01",
      });
    }
  }, [router.query]);

  //Functions
  function setDateFunc(date: any) {
    const convertDate = moment(parseInt(JSON.stringify(date)))
      .format("jYYYY/jMM/jDD")
      .split("/");
    setDate({
      year: convertDate[0],
      month: convertDate[1],
      day: convertDate[2],
    });
  }

  return (
    <FormControl className="">
      <DatePicker
        locale={persianLocale}
        calendar={persianCalendar}
        onChange={setDateFunc}
        format={"YYYY/MM/DD"}
        containerClassName="w-full outline-none"
        inputClass="w-full h-[2.5rem] outline-none rounded-[0.375rem] border border-[inherit] px-[1rem] dark:bg-transparent dark:text-gray-200 placeholder:text-gray-800 placeholder:dark:text-white"
        placeholder="تاریخ"
      />
      <div className="text-rose-400 font-medium mt-1 text-xs">
        <span>
          اگر تاریخ را در حالت ماهانه قرار داده باشید روز تاریخ محاسبه نمی‌شود
        </span>
      </div>
    </FormControl>
  );
}
