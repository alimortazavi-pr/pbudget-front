import { useState } from "react";
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

//Types
import { singleBoxProps } from "@/ts/types/box.type";

//Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { softDeleteBox } from "@/store/box/actions";
import { darkModeSelector } from "@/store/layout/selectors";

//Tools
import { Edit, Trash } from "iconsax-react";
import { toast } from "react-toastify";
import convertToPersian from "num-to-persian";
import priceGenerator from "price-generator";

export default function SingleBox({ box, setBoxEdit, onOpen }: singleBoxProps) {
  //Redux
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector(darkModeSelector);

  //Sates
  const [isLoading, setIsLoading] = useState<boolean>();

  //Functions
  function openBoxEdit() {
    setBoxEdit(box);
    onOpen();
  }

  async function deleteBoxFunc() {
    setIsLoading(true);
    try {
      await dispatch(softDeleteBox(box));
      setIsLoading(false);
    } catch (err: any) {
      toast.success(err.message, {
        position: toast.POSITION.TOP_CENTER,
      });
      setIsLoading(false);
    }
  }

  return (
    <li className="w-full rounded border border-rose-400 px-2 py-4 flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-bold leading-none text-gray-800 dark:text-gray-200 truncate">
          {box.title}
        </div>
        <div className="flex items-center gap-2">
          <span className="cursor-pointer">
            <Edit
              size="18"
              className="text-cyan-500 dark:text-cyan-400"
              variant="Bulk"
              onClick={openBoxEdit}
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
                        با حذف باکس تمام تراکنش های مربوط به آن هم{" "}
                        <span className="text-red-500 font-semibold">حذف</span>{" "}
                        می‌شود و بودجه باکس به بودجه اصلی شما برگشت داده
                        می‌شود
                      </span>
                    </PopoverBody>
                    <PopoverFooter>
                      <div className="flex items-center gap-2">
                        <Button onClick={onClose}>لغو</Button>
                        <Button
                          colorScheme={"rose"}
                          onClick={deleteBoxFunc}
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
      </div>
      <div className="">
        <span className="text-gray-800 dark:text-gray-200 leading-none">
          {convertToPersian(priceGenerator(box.budget || 0))}
        </span>
        <span
          className={`text-sm mr-1 text-gray-800 dark:text-gray-200 leading-none`}
        >
          تومان
        </span>
      </div>
    </li>
  );
}
