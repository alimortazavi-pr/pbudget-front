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

//Types
import { singleCategoryProps } from "@/ts/types/category.type";

//Redux
import { useAppDispatch } from "@/store/hooks";
import { softDeleteCategory } from "@/store/category/actions";

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

  //Next
  const router = useRouter();

  //Functions
  function openCategoryEdit() {
    setCategoryEdit(category);
    onOpen();
  }

  async function deleteCategoryFunc() {
    try {
      await dispatch(softDeleteCategory(category));
      router.replace("/profile/categories");
    } catch (err: any) {
      toast.success(err.message, {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  }

  return (
    <li className="w-full rounded border border-rose-400 px-2 py-4 flex items-center justify-between">
      <div className="text-lg font-bold leading-none">
        <span>{category.title}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="cursor-pointer">
          <Edit
            size="18"
            className="text-cyan-500"
            variant="Bulk"
            onClick={openCategoryEdit}
          />
        </span>
        <span className="cursor-pointer">
          <Popover>
            {({ isOpen, onClose }) => (
              <>
                <PopoverTrigger>
                  <Trash size="18" className="text-rose-500" variant="Bulk" />
                </PopoverTrigger>
                <PopoverContent>
                  <PopoverArrow />
                  <PopoverCloseButton />
                  <PopoverHeader>آیا مطمئن هستید؟</PopoverHeader>
                  <PopoverBody>
                    <span>
                      با حذف دسته بندی تمام تراکنش های مربوط به آن هم{" "}
                      <span className="text-red-500 font-semibold">حذف</span>{" "}
                      می‌شود
                    </span>
                  </PopoverBody>
                  <PopoverFooter>
                    <div className="flex items-center gap-2">
                      <Button onClick={onClose}>لغو</Button>
                      <Button colorScheme={"red"} onClick={deleteCategoryFunc}>
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
