import { FormControl, FormErrorMessage, Input } from "@chakra-ui/react";
import { useEffect, useState } from "react";

//Types
import { budgetDatePickerProps } from "@/ts/types/budget.type";

//Components
import { DatePicker } from "react-advance-jalaali-datepicker";

//Tools
import convertToPersian from "num-to-persian";
import moment from "jalali-moment";

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
    if (form.date && !dateValue) {
      const date = moment(parseInt(form.date as string))
        .utc()
        .format("jYYYY/jMM/jDD");
      setDateValue(date);
    } else if (dateValue) {
      const date = moment(parseInt(form.date as string) + 24 * 60 * 60 * 1000)
        .utc()
        .format("jYYYY/jMM/jDD");
      setDateValue(date);
    }
  }, [form.date]);

  //Functions
  function DatePickerInput(props: any) {
    return (
      <Input
        focusBorderColor="red.400"
        {...props}
        value={convertToPersian(dateValue || 0)}
      />
    );
  }

  function dateHandler(unix: string, formatted: string) {
    const date = moment(formatted, "jYYYY/jMM/jDD").format();
    const dateToTime = new Date(date).getTime();
    setForm({ ...form, date: dateToTime?.toString() || "" });
  }

  return (
    <FormControl isInvalid={errors.paths.includes("date")} className="">
      <DatePicker
        inputComponent={DatePickerInput}
        placeholder="تاریخ"
        format="jYYYY/jMM/jDD"
        onChange={dateHandler}
        id="datePicker"
      />
      <FormErrorMessage>
        {errors.paths.includes("date") ? errors.messages.date : ""}
      </FormErrorMessage>
    </FormControl>
  );
}
