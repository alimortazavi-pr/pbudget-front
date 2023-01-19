import { Skeleton } from "@chakra-ui/react";

//Redux
import { budgetsSelector } from "@/store/budget/selectors";
import { useAppSelector } from "@/store/hooks";

//Tools
import { ArrowCircleDown, MoneyTime } from "iconsax-react";

export default function SkeletonBudgetsList() {
  //Redux
  const budgets = useAppSelector(budgetsSelector);

  return budgets == null ? (
    <div>
      <div className="mb-2 p-2 rounded-lg border border-gray-300 dark:border-gray-600">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-1">
            <MoneyTime
              variant="Bold"
              size="24"
              className="text-gray-800 dark:text-gray-200"
            />
            <Skeleton h={"20px"} w={"40px"} />
          </div>
          <div className="flex items-center justify-end">
            <div className="text-lg font-bold text-left flex">
              <Skeleton h={"20px"} w={"40px"} />
              <span className={`text-sm mr-1 text-gray-400`}>تومان</span>
            </div>
            <div className="mr-1 cursor-pointer">
              <ArrowCircleDown
                variant="Bulk"
                size="20"
                className={`text-gray-800 dark:text-gray-400`}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mb-2 p-2 rounded-lg border border-gray-300 dark:border-gray-600">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-1">
            <MoneyTime
              variant="Bold"
              size="24"
              className="text-gray-800 dark:text-gray-200"
            />
            <Skeleton h={"20px"} w={"40px"} />
          </div>
          <div className="flex items-center justify-end">
            <div className="text-lg font-bold text-left flex">
              <Skeleton h={"20px"} w={"40px"} />
              <span className={`text-sm mr-1 text-gray-400`}>تومان</span>
            </div>
            <div className="mr-1 cursor-pointer">
              <ArrowCircleDown
                variant="Bulk"
                size="20"
                className={`text-gray-800 dark:text-gray-400`}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mb-2 p-2 rounded-lg border border-gray-300 dark:border-gray-600">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-1">
            <MoneyTime
              variant="Bold"
              size="24"
              className="text-gray-800 dark:text-gray-200"
            />
            <Skeleton h={"20px"} w={"40px"} />
          </div>
          <div className="flex items-center justify-end">
            <div className="text-lg font-bold text-left flex">
              <Skeleton h={"20px"} w={"40px"} />
              <span className={`text-sm mr-1 text-gray-400`}>تومان</span>
            </div>
            <div className="mr-1 cursor-pointer">
              <ArrowCircleDown
                variant="Bulk"
                size="20"
                className={`text-gray-800 dark:text-gray-400`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;
}
