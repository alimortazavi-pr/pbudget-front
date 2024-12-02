import { Fragment, useState } from "react";
import Link from "next/link";

//Types
import { singleBudgetProps } from "@/ts/types/budget.type";
import { budgetTypeEnum } from "@/ts/enums/budget.enum";

//Redux
import { useAppDispatch } from "@/store/hooks";

//Components
import DeleteBudget from "./DeleteBudget";

//Tools
import { ArrowCircleDown, Edit, MoneyAdd, MoneyRemove } from "iconsax-react";
import convertToPersian from "num-to-persian";
import priceGenerator from "price-generator";
import moment from "jalali-moment";
import oneToTwoNumber from "one-to-two-num";
import { creditTypeEnum } from "@/ts/enums/credit.enum";

export default function SingleBudget({ budget }: singleBudgetProps) {
  //Redux
  const dispatch = useAppDispatch();

  //States
  const [isMoreOptions, setIsMoreOptions] = useState<boolean>(false);

  //Functions
  function toggleIsMoreOptions() {
    setIsMoreOptions(!isMoreOptions);
  }

  return (
    <li
      className={`w-full border ${
        budget.type === budgetTypeEnum.INCOME
          ? "border-teal-400"
          : "border-rose-400"
      } rounded-lg px-2 py-2 relative mb-2`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-1">
          <div>
            {budget.type === budgetTypeEnum.INCOME ? (
              <MoneyAdd
                variant="Bold"
                size="24"
                className="text-gray-800 dark:text-gray-200"
              />
            ) : (
              <MoneyRemove
                variant="Bold"
                size="24"
                className="text-gray-800 dark:text-gray-200"
              />
            )}
          </div>
          <div
            className={`${
              budget.type === budgetTypeEnum.INCOME
                ? "text-teal-400"
                : "text-rose-400"
            } font-bold text-lg truncate max-w-[250px]`}
          >
            <span className="leading-none">{budget.category.title}</span>
          </div>
        </div>
        <div className="flex items-center justify-end">
          <div className="text-lg font-bold text-left">
            {budget.credits && budget.credits.length > 0 && (
              <span
                className={`text-sm ${
                  budget.credits[0].type === creditTypeEnum.DUES
                    ? "text-teal-400"
                    : "text-rose-400"
                } leading-none`}
              >
                {budget.credits[0].type === creditTypeEnum.DUES
                  ? "طلب"
                  : "بدهی"}
                <span className="mx-1">-</span>
              </span>
            )}
            <span className="text-gray-800 dark:text-gray-200 leading-none">
              {convertToPersian(priceGenerator(budget.price || 0))}
            </span>
            <span
              className={`text-sm mr-1 ${
                budget.type === budgetTypeEnum.INCOME
                  ? "text-teal-400"
                  : "text-rose-400"
              } leading-none`}
            >
              تومان
            </span>
          </div>
          <div className="mr-1 cursor-pointer" onClick={toggleIsMoreOptions}>
            <ArrowCircleDown
              variant="Bulk"
              size="20"
              className={`${
                budget.type === budgetTypeEnum.INCOME
                  ? "text-teal-800 dark:text-teal-400"
                  : "text-rose-800 dark:text-rose-400"
              } duration-300 ${isMoreOptions ? "rotate-180" : "rotate-0"}`}
            />
          </div>
        </div>
      </div>
      <div
        className={`transition-opacity ease-out duration-1000 ${
          isMoreOptions ? "block" : "hidden"
        }`}
      >
        {budget.credits && budget.credits.length > 0 && (
          <p
            className={`${
              budget.credits[0].type === creditTypeEnum.DUES
                ? "text-teal-400"
                : budget.credits[0].paid
                ? "text-teal-400"
                : "text-rose-400"
            } leading-none font-medium text-center mt-3`}
          >
            {budget.credits[0].type === creditTypeEnum.DUES
              ? "طلب از"
              : "بدهی به"}{" "}
            {budget.credits[0].person}{" "}
            <span className="text-sm text-teal-400">
              {budget.credits[0].paid && "(پرداخت شده)"}
            </span>
          </p>
        )}
        <hr className="my-3" />
        {budget.description && (
          <Fragment>
            {" "}
            <p className="text-gray-800 dark:text-gray-100">
              {budget.description}
            </p>
            <hr className="my-3" />
          </Fragment>
        )}
        <div className="flex items-center justify-around">
          <div className="text-sm flex items-center dark:text-gray-200">
            <span className="font-medium">
              {convertToPersian(moment(budget.createdAt).format("HH:mm"))} -{" "}
              {convertToPersian(
                `${budget.year}/${oneToTwoNumber(
                  budget.month
                )}/${oneToTwoNumber(budget.day)}` || 0
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/${budget._id}`} className="cursor-pointer">
              <Edit size="18" className="text-cyan-500" variant="Bulk" />
            </Link>
            <DeleteBudget budget={budget} />
          </div>
        </div>
      </div>
    </li>
  );
}
