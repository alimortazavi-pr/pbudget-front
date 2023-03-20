import {
  Button,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useState } from "react";

//Types
import { singleCategoryProps } from "@/ts/types/category.type";

//Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { softDeleteCategory } from "@/store/category/actions";
import { darkModeSelector } from "@/store/layout/selectors";

//Tools
import { Edit, Trash } from "iconsax-react";
import { toast } from "react-toastify";

export default function SingleCategory({
  category,
  setCategoryEdit,
  onOpen,
}: singleCategoryProps) {
  //Redux
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector(darkModeSelector);

  //Next
  const router = useRouter();

  //Sates
  const [isLoading, setIsLoading] = useState<boolean>();

  //Functions
  function openCategoryEdit() {
    setCategoryEdit(category);
    onOpen();
  }

  async function deleteCategoryFunc() {
    setIsLoading(true);
    try {
      await dispatch(softDeleteCategory(category));
      setIsLoading(false);
    } catch (err: any) {
      toast.success(err.message, {
        position: toast.POSITION.TOP_CENTER,
      });
      setIsLoading(false);
    }
  }

  return (
    <li className="w-full rounded border border-rose-400 px-2 py-4 flex items-center justify-between">
      <div className="text-lg font-bold leading-none text-gray-800 dark:text-gray-200 truncate">
        {category.title}
      </div>
      <div className="flex items-center gap-2">
        <span className="cursor-pointer">
          <Edit
            size="18"
            className="text-cyan-500 dark:text-cyan-400"
            variant="Bulk"
            onClick={openCategoryEdit}
          />
        </span>
        <span className="cursor-pointer">
          <Popover>
            {({ isOpen, onClose }) => (
              <>
                <PopoverTrigger>
                  <Trash
                    size="18"
                    className="text-rose-500 dark:text-rose-400"
                    variant="Bulk"
                  />
                </PopoverTrigger>
                <PopoverContent
                  bg={isDarkMode ? "#1f2937" : "#f9fafb"}
                  borderColor={isDarkMode ? "#e5e7eb" : "#e5e7eb"}
                  zIndex={"999"}
                >
                  <PopoverArrow bg={isDarkMode ? "#1f2937" : "#f9fafb"} />
                  <PopoverCloseButton />
                  <PopoverHeader>
                    <span className="text-gray-800 dark:text-gray-200">
                      آیا مطمئن هستید؟
                    </span>
                  </PopoverHeader>
                  <PopoverBody>
                    <span className="text-gray-800 dark:text-gray-200">
                      با حذف دسته بندی تمام تراکنش های مربوط به آن هم{" "}
                      <span className="text-red-500 font-semibold">حذف</span>{" "}
                      می‌شود
                    </span>
                  </PopoverBody>
                  <PopoverFooter>
                    <div className="flex items-center gap-2">
                      <Button onClick={onClose}>لغو</Button>
                      <Button
                        colorScheme={"rose"}
                        onClick={deleteCategoryFunc}
                        isLoading={isLoading}
                        variant={isDarkMode ? "outline" : "solid"}
                      >
                        حذف
                      </Button>
                    </div>
                  </PopoverFooter>
                </PopoverContent>
              </>
            )}
          </Popover>
        </span>
      </div>
    </li>
  );
}
