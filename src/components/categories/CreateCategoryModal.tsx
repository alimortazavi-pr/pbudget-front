import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { ChangeEvent, useState } from "react";

//Types
import {
  ICreateAndEditCategoryForm,
  IValidationErrorsCreateAndEditCategoryForm,
} from "@/ts/interfaces/category.interface";
import { createCategoryModalProps } from "@/ts/types/category.type";

//Redux
import { useAppDispatch } from "@/store/hooks";
import { createCategory } from "@/store/category/actions";

//Tools
import { toast } from "react-toastify";

//Validators
import { createAndEditCategory } from "@/validators/categoryValidator";

export default function CreateCategoryModal({
  isOpen,
  onOpen,
  onClose,
}: createCategoryModalProps) {
  //Redux
  const dispatch = useAppDispatch();

  //Next
  const router = useRouter();

  //States
  const [form, setForm] = useState<ICreateAndEditCategoryForm>({
    title: "",
  });
  const [errors, setErrors] =
    useState<IValidationErrorsCreateAndEditCategoryForm>({
      paths: [],
      messages: {
        title: "",
      },
    });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //Functions
  function inputHandler(e: ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function submit() {
    setErrors({
      paths: [],
      messages: {
        title: "",
      },
    });
    setIsLoading(true);
    createAndEditCategory
      .validate(form, { abortEarly: false })
      .then(async () => {
        try {
          await dispatch(createCategory(form));
          toast.success("دسته بندی باموفقیت ایجاد شد", {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
          onClose();
          router.replace(router.pathname);
        } catch (err: any) {
          toast.error(err.message, {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        let errorsArray: IValidationErrorsCreateAndEditCategoryForm = {
          paths: [],
          messages: {
            title: "",
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
        <ModalHeader>ایجاد دسته بندی</ModalHeader>
        <ModalBody>
          <FormControl
            isInvalid={errors.paths.includes("title")}
            variant={"floating"}
            className="mb-2"
          >
            <Input
              focusBorderColor="red.400"
              placeholder=" "
              type="text"
              value={form.title}
              onChange={inputHandler}
              name="title"
            />
            <FormLabel>عنوان</FormLabel>
            <FormErrorMessage>
              {errors.paths.includes("title") ? errors.messages.title : ""}
            </FormErrorMessage>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="gray" ml={3} onClick={onClose}>
            بستن
          </Button>
          <Button isLoading={isLoading} onClick={submit} colorScheme="red">
            ایجاد
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
