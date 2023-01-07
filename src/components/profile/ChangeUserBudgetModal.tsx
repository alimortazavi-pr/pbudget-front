import {
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { ChangeEvent, useEffect, useState } from "react";

//Types
import {
  IChangeUserBudgetForm,
  IValidationErrorsChangeUserBudgetForm,
} from "@/ts/interfaces/profile.interface";
import { changeUserBudgetModalProps } from "@/ts/types/profile.type";

//Redux
import { useAppDispatch } from "@/store/hooks";
import { changeUserBudget } from "@/store/profile/actions";

//Tools
import { toast } from "react-toastify";
import convertToPersian from "num-to-persian";
import priceGenerator from "price-generator";

//Validators
import { changeUserBudgetValidator } from "@/validators/profileValidator";

export default function ChangeUserBudgetModal({
  isOpen,
  onOpen,
  onClose,
}: changeUserBudgetModalProps) {
  //Redux
  const dispatch = useAppDispatch();

  //Next
  const router = useRouter();

  //States
  const [form, setForm] = useState<IChangeUserBudgetForm>({
    price: "",
  });
  const [pricePreview, setPricePreview] = useState<string>("0");
  const [errors, setErrors] = useState<IValidationErrorsChangeUserBudgetForm>({
    paths: [],
    messages: {
      price: "",
    },
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //Effects
  useEffect(() => {
    setPricePreview(
      convertToPersian(
        priceGenerator(form.price?.toString().split(",").join("") || "0")
      )
    );
  }, [form.price]);

  //Functions
  function inputHandler(e: ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function submit(type: "increase" | "decrease") {
    setErrors({
      paths: [],
      messages: {
        price: "",
      },
    });
    setIsLoading(true);
    changeUserBudgetValidator
      .validate(form, { abortEarly: false })
      .then(async () => {
        try {
          await dispatch(
            changeUserBudget(
              type === "increase"
                ? parseInt(form.price as string)
                : -parseInt(form.price as string)
            )
          );
          toast.success("موجودی شما باموفقیت تغییر کرد", {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
          onClose();
        } catch (err: any) {
          toast.error(err.message, {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        let errorsArray: IValidationErrorsChangeUserBudgetForm = {
          paths: [],
          messages: {
            price: "",
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
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>تغییر موجودی</ModalHeader>
        <ModalBody>
          <FormControl
            isInvalid={errors.paths.includes("price")}
            variant={"floating"}
            className="mb-3"
          >
            <Input
              focusBorderColor="red.400"
              placeholder=" "
              type="number"
              value={form.price}
              onChange={inputHandler}
              name="price"
            />
            <FormLabel>مبلغ</FormLabel>
            <FormErrorMessage>
              {errors.paths.includes("price") ? errors.messages.price : ""}
            </FormErrorMessage>
            <FormHelperText mt={"1"}>
              <span>{pricePreview ? pricePreview : "۰"}</span>
              <span className="mr-1">تومان</span>
            </FormHelperText>
          </FormControl>
          <div className="mb-4 flex items-center gap-2">
            <Button
              className="flex-1"
              isLoading={isLoading}
              onClick={() => submit("decrease")}
              colorScheme="red"
            >
              از حسابم کم کن
            </Button>
            <Button
              className="flex-1"
              isLoading={isLoading}
              onClick={() => submit("increase")}
              colorScheme="green"
            >
              به حسابم اضافه کن
            </Button>
          </div>
        </ModalBody>

        {/* <ModalFooter>
          <Button colorScheme="gray" ml={3} onClick={onClose}>
            بستن
          </Button>
        </ModalFooter> */}
      </ModalContent>
    </Modal>
  );
}
