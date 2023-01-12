import { FormControl, FormErrorMessage, Input } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

//Types
import { filterDatePickerProps } from "@/ts/types/layouts.type";

//Components
import { DatePicker } from "react-advance-jalaali-datepicker";

//Tools
import convertToPersian from "num-to-persian";

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
  function DatePickerInput(props: any) {
    return (
      <div>
        <Input
          focusBorderColor="rose.400"
          {...props}
          value={convertToPersian(dateValue || "")}
          placeholder="تاریخ"
          className="placeholder:text-gray-800 placeholder:dark:text-white"
        />
        <div className="text-rose-400 font-medium mt-1 text-xs">
          <span>
            اگر تاریخ را در حالت ماهانه قرار داده باشید روز تاریخ محاسبه نمی‌شود
          </span>
        </div>
      </div>
    );
  }

  function dateHandler(unix: string, formatted: string) {
    const splitDate = formatted.split("/");
    setDateValue(formatted);
    setDate({
      year: splitDate[0],
      month: splitDate[1],
      day: splitDate[2],
    });
  }

  return (
    <FormControl className="">
      <DatePicker
        inputComponent={DatePickerInput}
        format="jYYYY/jMM/jDD"
        onChange={dateHandler}
        id="datePicker"
      />
    </FormControl>
  );
}
