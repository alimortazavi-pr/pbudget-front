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

export default function InformationBudget() {
  //Redux
  const budgets = useAppSelector(budgetsSelector);
  const totalIncomePrice = useAppSelector(totalIncomePriceSelector);
  const totalCostPrice = useAppSelector(totalCostPriceSelector);
  const user = useAppSelector(userSelector);

  return (
    <div>
      <div className="w-full overflow-y-auto rounded-lg py-2 px-2 bg-sky-900 mb-2">
        <div className="text-xl font-bold text-white md:mb-3">
          <span>موجودی</span>
          {user.budget < 0 ? (
            <span className="text-red-400 mr-1 text-sm self-center">
              (کمبود وجه)
            </span>
          ) : null}
        </div>
        <div className="flex items-end justify-start text-xl font-bold ltr-important">
          <span className="text-xs mr-1 text-white">تومان</span>
          <span className="text-white">
            {convertToPersian(priceGenerator(user.budget))}
          </span>
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center gap-2 mb-2">
        <div className="flex-1 w-full overflow-y-auto rounded-lg py-2 px-2 bg-teal-400">
          <div className="text-lg font-semibold text-white md:mb-3">
            <span>مجموع دریافتی ها</span>
          </div>
          <div className="flex items-end justify-end text-lg font-bold">
            <span className="text-gray-800">
              {convertToPersian(priceGenerator(totalIncomePrice))}
            </span>
            <span className="text-xs mr-1 text-white">تومان</span>
          </div>
        </div>
        <div className="flex-1 w-full overflow-y-auto rounded-lg bg-rose-400 py-2 px-2">
          <div className="text-lg font-semibold text-white md:mb-3">
            <span>مجموع پرداختی ها</span>
          </div>
          <div className="flex items-end justify-end text-lg font-bold">
            <span className="text-gray-800">
              {convertToPersian(priceGenerator(totalCostPrice))}
            </span>
            <span className="text-xs mr-1 text-white">تومان</span>
          </div>
        </div>
      </div>
      <div className="w-full flex items-center justify-between bg-cyan-400 rounded-lg py-1 px-2">
        <div className="text-base font-bold text-white">
          <span>تعداد تراکنش ها</span>
        </div>
        <div className="text-lg font-semibold text-left">
          <span className="text-gray-800">
            {convertToPersian(budgets.length)}
          </span>
        </div>
      </div>
    </div>
  );
}
