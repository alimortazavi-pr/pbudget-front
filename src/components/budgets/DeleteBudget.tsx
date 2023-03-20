import {
  Button,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  useDisclosure,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useState } from "react";

//Types
import { deleteBudgetProps } from "@/ts/types/budget.type";

//Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { darkModeSelector } from "@/store/layout/selectors";
import { softDeleteBudget } from "@/store/budget/actions";

//Tools
import { toast } from "react-toastify";
import { Trash } from "iconsax-react";

export default function DeleteBudget({ budget }: deleteBudgetProps) {
  //Redux
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector(darkModeSelector);

  //Next
  const router = useRouter();

  //States
  const [isLoading, setIsLoading] = useState(false);

  //ChakraUI hooks
  const { isOpen, onOpen, onClose } = useDisclosure();

  //Functions
  async function deleteBudgetFunc() {
    setIsLoading(true);
    try {
      await dispatch(softDeleteBudget(budget));
      setIsLoading(false);
    } catch (err: any) {
      toast.success(err.message, {
        position: toast.POSITION.TOP_CENTER,
      });
      setIsLoading(false);
    }
  }

  return (
    <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose} placement="auto">
      <PopoverTrigger>
        <span className="cursor-pointer">
          <Trash size="18" className="text-rose-500" variant="Bulk" />
        </span>
      </PopoverTrigger>
      <PopoverContent
        bg={isDarkMode ? "#1f2937" : "#f9fafb"}
        borderColor={isDarkMode ? "#e5e7eb" : "#e5e7eb"}
      >
        <PopoverArrow bg={isDarkMode ? "#1f2937" : "#f9fafb"} />
        <PopoverHeader>
          <span className="text-gray-800 dark:text-gray-200">حذف تراکنش</span>
        </PopoverHeader>
        <PopoverBody>
          <span className="mt-3 text-gray-800 dark:text-gray-200">
            آیا مطمئن هستید؟
          </span>
          <div className="flex items-center justify-center gap-2 my-2">
            <Button
              colorScheme={"green"}
              isLoading={isLoading}
              onClick={deleteBudgetFunc}
              variant={isDarkMode ? "outline" : "solid"}
            >
              بله
            </Button>
            <Button
              variant={isDarkMode ? "outline" : "solid"}
              colorScheme={"red"}
              isLoading={isLoading}
              onClick={onClose}
            >
              خیر
            </Button>
          </div>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
