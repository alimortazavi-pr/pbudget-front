import { Skeleton } from "@chakra-ui/react";

//Redux
import {
  budgetsSelector,
  totalCostPriceSelector,
  totalIncomePriceSelector,
} from "@/store/budget/selectors";
import { useAppSelector } from "@/store/hooks";
import { userSelector } from "@/store/profile/selectors";

//Tools
import convertToPersian from "num-to-persian";
import priceGenerator from "price-generator";
import HtmlAndExcelExport from "./HtmlAndExcelExport";

export default function InformationBudget() {
  //Redux
  const budgets = useAppSelector(budgetsSelector);
  const totalIncomePrice = useAppSelector(totalIncomePriceSelector);
  const totalCostPrice = useAppSelector(totalCostPriceSelector);
  const user = useAppSelector(userSelector);

  return (
    <div>
      <div className="w-full rounded-lg py-2 px-2 bg-transparent border border-gray-800 dark:border-white mb-2">
        <div className="text-xl font-bold text-gray-800 dark:text-white md:mb-3">
          <span>موجودی</span>
          {user.budget && user.budget < 0 ? (
            <span className="text-red-500 mr-1 text-sm self-center">
              (کمبود وجه)
            </span>
          ) : null}
        </div>
        <div className="flex items-end justify-start text-xl font-bold ltr-important">
          <span className="text-xs mr-1 text-gray-800 dark:text-white">تومان</span>
          <Skeleton
            minH="20px"
            minW={"100px"}
            isLoaded={user.budget != null ? true : false}
          >
            <span className="text-gray-800 dark:text-white">
              {convertToPersian(priceGenerator(user.budget || 0))}
            </span>
          </Skeleton>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center gap-2 mb-2">
        <div className="flex-1 w-full rounded-lg py-2 px-2 border border-teal-500">
          <div className="text-lg font-semibold text-teal-500 md:mb-3">
            <span>مجموع دریافتی ها</span>
          </div>
          <div className="flex items-end justify-end font-bold">
            <Skeleton
              minH="20px"
              minW={"100px"}
              isLoaded={totalIncomePrice != null ? true : false}
              className="flex items-end justify-end text-lg font-bold"
            >
              <span className="text-gray-800 dark:text-white">
                {convertToPersian(priceGenerator(totalIncomePrice || 0))}
              </span>
            </Skeleton>
            <span className="text-xs mr-1 text-teal-500">تومان</span>
          </div>
        </div>
        <div className="flex-1 w-full rounded-lg border border-rose-500 py-2 px-2">
          <div className="text-lg font-semibold text-rose-500 md:mb-3">
            <span>مجموع پرداختی ها</span>
          </div>
          <div className="flex items-end justify-end font-bold">
            <Skeleton
              minH="20px"
              minW={"100px"}
              isLoaded={totalCostPrice != null ? true : false}
              className="flex items-end justify-end text-lg font-bold"
            >
              <span className="text-gray-800 dark:text-white">
                {convertToPersian(priceGenerator(totalCostPrice || 0))}
              </span>
            </Skeleton>
            <span className="text-xs mr-1 text-rose-500">تومان</span>
          </div>
        </div>
      </div>
      <div className="w-full flex items-center justify-between border border-cyan-500 rounded-lg py-1 px-2 mb-2">
        <div className="text-base font-bold text-cyan-500">
          <span>تعداد تراکنش ها</span>
        </div>
        <div>
          <Skeleton
            minH="20px"
            minW={"100px"}
            isLoaded={totalCostPrice != null ? true : false}
          >
            <div className="text-lg font-semibold text-left">
              <span className="text-gray-800 dark:text-white">
                {convertToPersian(budgets?.length || 0)}
              </span>
            </div>
          </Skeleton>
        </div>
      </div>
      <hr className="my-4" />
      <HtmlAndExcelExport />
    </div>
  );
}
