import { FormControl, FormErrorMessage, Input } from "@chakra-ui/react";
import { useEffect, useState } from "react";

//Types
import { budgetDatePickerProps } from "@/ts/types/budget.type";

//Components

//Tools
import convertToPersian from "num-to-persian";
import DatePicker from "react-multi-date-picker";
import persianLocale from "react-date-object/locales/persian_fa";
import persianCalendar from "react-date-object/calendars/persian";
import moment from "jalali-moment";

export default function BudgetDatePicker({
  errors,
  setErrors,
  form,
  setForm,
}: budgetDatePickerProps) {
  //States
  const [datePickerValue, setDatePickerValue] = useState<number>();

  //Effects
  useEffect(() => {
    if (form.year && form.month && form.day && !datePickerValue) {
      setDatePickerValue(
        new Date(
          moment(
            `${form.year}/${form.month}/${form.day}`,
            "jYYYY/jMM/jDD"
          ).format("YYYY/MM/DD")
        ).getTime()
      );
    }
  }, [form.year, form.month, form.day]);

  //Functions
  function setDateFunc(date: any) {
    const convertDate = moment(parseInt(JSON.stringify(date)))
      .format("jYYYY/jMM/jDD")
      .split("/");
    setForm({
      ...form,
      year: convertDate[0],
      month: convertDate[1],
      day: convertDate[2],
    });
  }

  return (
    <FormControl
      isInvalid={
        errors.paths.includes("year") ||
        errors.paths.includes("month") ||
        errors.paths.includes("day")
      }
      className=""
    >
      <DatePicker
        value={datePickerValue}
        locale={persianLocale}
        calendar={persianCalendar}
        onChange={setDateFunc}
        format={"YYYY/MM/DD"}
        containerClassName="w-full outline-none"
        inputClass="w-full h-[2.5rem] outline-none rounded-[0.375rem] border border-[inherit] px-[1rem] dark:bg-transparent dark:text-gray-200 placeholder:text-gray-800 placeholder:dark:text-white"
        placeholder="تاریخ"
      />
      <FormErrorMessage>
        {errors.paths.includes("year") ||
        errors.paths.includes("month") ||
        errors.paths.includes("day")
          ? errors.messages.year || errors.messages.month || errors.messages.day
          : ""}
      </FormErrorMessage>
    </FormControl>
  );
}
