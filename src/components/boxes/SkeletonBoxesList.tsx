import { Skeleton } from "@chakra-ui/react";

//Redux
import { boxesSelector } from "@/store/box/selectors";
import { useAppSelector } from "@/store/hooks";

//Tools
import { Edit, Trash } from "iconsax-react";

export default function SkeletonBoxesList() {
  //Redux
  const boxes = useAppSelector(boxesSelector);

  return boxes == null ? (
    <div className="flex flex-col gap-x-2 gap-y-5">
      <div className="w-full rounded border border-gray-400 px-2 py-4 flex items-center justify-between">
        <div className="text-lg font-bold leading-none">
          <Skeleton h={"20px"} w={"80px"} />
        </div>
        <div className="flex items-center gap-2">
          <span className="cursor-not-allowed">
            <Edit
              size="18"
              className="text-gray-500 dark:text-gray-400"
              variant="Bulk"
            />
          </span>
          <span className="cursor-not-allowed">
            <Trash
              size="18"
              className="text-gray-500 dark:text-gray-400"
              variant="Bulk"
            />
          </span>
        </div>
      </div>
      <div className="w-full rounded border border-gray-400 px-2 py-4 flex items-center justify-between">
        <div className="text-lg font-bold leading-none">
          <Skeleton h={"20px"} w={"80px"} />
        </div>
        <div className="flex items-center gap-2">
          <span className="cursor-not-allowed">
            <Edit
              size="18"
              className="text-gray-500 dark:text-gray-400"
              variant="Bulk"
            />
          </span>
          <span className="cursor-not-allowed">
            <Trash
              size="18"
              className="text-gray-500 dark:text-gray-400"
              variant="Bulk"
            />
          </span>
        </div>
      </div>
      <div className="w-full rounded border border-gray-400 px-2 py-4 flex items-center justify-between">
        <div className="text-lg font-bold leading-none">
          <Skeleton h={"20px"} w={"80px"} />
        </div>
        <div className="flex items-center gap-2">
          <span className="cursor-not-allowed">
            <Edit
              size="18"
              className="text-gray-500 dark:text-gray-400"
              variant="Bulk"
            />
          </span>
          <span className="cursor-not-allowed">
            <Trash
              size="18"
              className="text-gray-500 dark:text-gray-400"
              variant="Bulk"
            />
          </span>
        </div>
      </div>
    </div>
  ) : null;
}
