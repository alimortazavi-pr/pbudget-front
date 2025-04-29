import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { ChangeEvent, useEffect, useState } from "react";

//Types
import {
  ICreateAndEditBoxForm,
  IValidationErrorsCreateAndEditBoxForm,
} from "@/ts/interfaces/box.interface";
import { editBoxModalProps } from "@/ts/types/box.type";

//Redux
import { useAppDispatch } from "@/store/hooks";
import { editBox } from "@/store/box/actions";

//Components
import ChangeBoxBudgetSection from "./ChangeBoxBudgetSection";

//Tools
import { toast } from "react-toastify";

//Validators
import { createAndEditBox } from "@/validators/boxValidator";

export default function EditBoxModal({
  isOpen,
  onOpen,
  onClose,
  box,
  setBoxEdit,
}: editBoxModalProps) {
  //Redux
  const dispatch = useAppDispatch();

  //States
  const [form, setForm] = useState<ICreateAndEditBoxForm>({
    title: "",
  });
  const [errors, setErrors] = useState<IValidationErrorsCreateAndEditBoxForm>({
    paths: [],
    messages: {
      title: "",
    },
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (box?.title) {
      setForm({ title: box.title });
    } else {
      onClose();
    }
  }, [box]);

  //Functions
  function inputHandler(e: ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function onCloseHandler() {
    setBoxEdit(null);
    onClose();
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
          await dispatch(editBox(form, box));
          toast.success("باکس باموفقیت ویرایش شد", {
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
    <Modal isOpen={isOpen} onClose={onCloseHandler}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <span className="text-gray-800 dark:text-white">
            {box?.title} باکس
          </span>
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
              disabled={!box || !box._id}
              _invalid={{ borderColor: "inherit" }}
            />
            <FormLabel>عنوان</FormLabel>
            <FormErrorMessage>
              {errors.paths.includes("title") ? errors.messages.title : ""}
            </FormErrorMessage>
          </FormControl>
          <Button
            isLoading={isLoading}
            onClick={submit}
            colorScheme="rose"
            className="w-full"
          >
            ویرایش
          </Button>
          <hr className="my-5" />
          <ChangeBoxBudgetSection box={box} onClose={onClose} />
        </ModalBody>

        <ModalFooter>
          <Button
            isLoading={isLoading}
            onClick={onClose}
            colorScheme="gray"
            className="w-full"
          >
            بستن
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
