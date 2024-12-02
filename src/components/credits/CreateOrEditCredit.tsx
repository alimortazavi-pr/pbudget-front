import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Switch,
} from "@chakra-ui/react";
import { ArrowCircleDown, ArrowCircleUp } from "iconsax-react";
import { ChangeEvent, Dispatch, FC, SetStateAction, useState } from "react";
import convertToPersian from "num-to-persian";
import priceGenerator from "price-generator";
import convertAPToEnglish from "ap-to-english";

//Interfaces
import {
  ICreateAndEditCreditForm,
  IValidationErrorsCreateAndEditCreditForm,
} from "@/ts/interfaces/credit.interface";

//Enums
import { creditTypeEnum } from "@/ts/enums/credit.enum";

interface IProps {
  form: ICreateAndEditCreditForm;
  setForm: Dispatch<SetStateAction<ICreateAndEditCreditForm>>;
  errors: IValidationErrorsCreateAndEditCreditForm;
  isCreating: boolean;
  setIsCreating: Dispatch<SetStateAction<boolean>>;
}
const CreateOrEditCredit: FC<IProps> = ({
  form,
  errors,
  setForm,
  isCreating,
  setIsCreating,
}) => {
  //Functions
  function toggleIsSearching() {
    setIsCreating(!isCreating);
  }

  function inputHandler(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({
      ...form,
      person: convertToPersian(e.target.value),
    });
  }

  function typeHandler(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      setForm({ ...form, type: creditTypeEnum.DEBT });
    } else {
      setForm({ ...form, type: creditTypeEnum.DUES });
    }
  }

  function paidHandler(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      setForm({ ...form, paid: true });
    } else {
      setForm({ ...form, paid: false });
    }
  }

  return (
    <div>
      <div
        className="text-text-gray-800 dark:text-white flex items-center gap-1 cursor-pointer max-w-fit"
        onClick={toggleIsSearching}
      >
        <span className="leading-none">افزودن به لیست طلب/بدهی ها</span>
        {isCreating ? (
          <ArrowCircleUp className="w-5 h-5 text-rose-500" />
        ) : (
          <ArrowCircleDown className="w-5 h-5 text-rose-500" />
        )}
      </div>
      {isCreating && (
        <div className="mt-4">
          <FormControl
            isInvalid={errors.paths.includes("person")}
            variant={"floating"}
            className="mb-2"
          >
            <Input
              focusBorderColor="rose.400"
              placeholder=" "
              type="text"
              value={form.person}
              onChange={inputHandler}
              name="person"
              _invalid={{ borderColor: "inherit" }}
            />
            <FormLabel>شخص</FormLabel>
            <FormErrorMessage>
              {errors.paths.includes("person") ? errors.messages.person : ""}
            </FormErrorMessage>
          </FormControl>
          <div className="flex items-start justify-around gap-2">
            <div>
              <FormControl className="flex items-center h-10">
                <FormLabel
                  htmlFor="credit-type"
                  mb="0"
                  ml={"2"}
                  className="dark:text-white"
                >
                  {form.type === creditTypeEnum.DUES ? "طلب" : "بدهی"}
                </FormLabel>
                <Switch
                  id="credit-type"
                  onChange={typeHandler}
                  colorScheme={"rose"}
                  isChecked={form.type === creditTypeEnum.DEBT ? true : false}
                />
              </FormControl>
            </div>
            <div>
              <FormControl className="flex items-center h-10">
                <FormLabel
                  htmlFor="paid"
                  mb="0"
                  ml={"2"}
                  className="dark:text-white"
                >
                  {form.paid ? "پرداخت شده" : "پرداخت نشده"}
                </FormLabel>
                <Switch
                  id="paid"
                  onChange={paidHandler}
                  colorScheme={"rose"}
                  isChecked={form.paid ? true : false}
                />
              </FormControl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateOrEditCredit;
