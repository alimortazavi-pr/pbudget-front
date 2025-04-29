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
import { ChangeEvent, useState } from "react";

//Types
import {
  ICreateAndEditBoxForm,
  IValidationErrorsCreateAndEditBoxForm,
} from "@/ts/interfaces/box.interface";
import { createBoxModalProps } from "@/ts/types/box.type";

//Redux
import { useAppDispatch } from "@/store/hooks";
import { createBox } from "@/store/box/actions";

//Tools
import { toast } from "react-toastify";

//Validators
import { createAndEditBox } from "@/validators/boxValidator";

export default function CreateBoxModal({
  isOpen,
  onOpen,
  onClose,
}: createBoxModalProps) {
  //Redux
  const dispatch = useAppDispatch();

  //States
  const [form, setForm] = useState<ICreateAndEditBoxForm>({
    title: "",
  });
  const [errors, setErrors] =
    useState<IValidationErrorsCreateAndEditBoxForm>({
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
    createAndEditBox
      .validate(form, { abortEarly: false })
      .then(async () => {
        try {
          await dispatch(createBox(form));
          toast.success("باکس باموفقیت ایجاد شد", {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
          setForm({
            title: "",
          });
          onClose();
        } catch (err: any) {
          toast.error(err.message, {
            position: toast.POSITION.TOP_CENTER,
          });
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        let errorsArray: IValidationErrorsCreateAndEditBoxForm = {
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
        <ModalHeader>
          <span className="text-gray-800 dark:text-white">ایجاد باکس</span>
        </ModalHeader>
        <ModalBody>
          <FormControl
            isInvalid={errors.paths.includes("title")}
            variant={"floating"}
            className="mb-2"
          >
            <Input
              focusBorderColor="rose.400"
              placeholder=" "
              type="text"
              value={form.title}
              onChange={inputHandler}
              name="title"
              _invalid={{ borderColor: "inherit" }}
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
          <Button isLoading={isLoading} onClick={submit} colorScheme="rose">
            ایجاد
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
