import { FormControl, FormErrorMessage, Input } from "@chakra-ui/react";
import { useEffect, useState } from "react";

//Types
import { budgetDatePickerProps } from "@/ts/types/budget.type";

//Components
import { DatePicker } from "react-advance-jalaali-datepicker";

//Tools
import convertToPersian from "num-to-persian";

export default function BudgetDatePicker({
  errors,
  setErrors,
  form,
  setForm,
}: budgetDatePickerProps) {
  //States
  const [dateValue, setDateValue] = useState<string>("");

  //Effects
  useEffect(() => {
    if (form.year && form.month && form.day && !dateValue) {
      setDateValue(`${form.year}/${form.month}/${form.day}`);
    }
  }, [form.year, form.month, form.day]);

  //Functions
  function DatePickerInput(props: any) {
    return (
      <Input
        focusBorderColor="rose.400"
        {...props}
        value={convertToPersian(dateValue || "")}
        placeholder="تاریخ"
        className="placeholder:text-gray-800 placeholder:dark:text-white"
      />
    );
  }

  function dateHandler(unix: string, formatted: string) {
    const splitDate = formatted.split("/");
    setDateValue(formatted);
    setForm({
      ...form,
      year: splitDate[0],
      month: splitDate[1],
      day: splitDate[2],
    });
  }

  return (
    <FormControl isInvalid={errors.paths.includes("date")} className="">
      <DatePicker
        inputComponent={DatePickerInput}
        // placeholder="تاریخ"
        format="jYYYY/jMM/jDD"
        onChange={dateHandler}
        id="datePicker"
      />
      <FormErrorMessage>
        {errors.paths.includes("year") ||
        errors.paths.includes("month") ||
        errors.paths.includes("day")
          ? errors.messages.year
          : ""}
      </FormErrorMessage>
    </FormControl>
  );
}
