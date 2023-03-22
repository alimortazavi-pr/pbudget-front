import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";

//Types
import { indexBudgetsProps } from "@/ts/types/budget.type";
import { IBudget } from "@/ts/interfaces/budget.interface";

//Redux
import { setBudgets } from "@/store/budget/actions";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { budgetsSelector } from "@/store/budget/selectors";

//Components
import TheNavigation from "@/components/layouts/TheNavigation";
import DailyTypeTabs from "@/components/budgets/DailyTypeTabs";
import ChangeDayTabs from "@/components/budgets/ChangeDayTabs";
import InformationBudget from "@/components/budgets/InformationBudget";
import SingleBudget from "@/components/budgets/SingleBudget";
import ChangeMonthTabs from "@/components/budgets/ChangeMonthTabs";
import FilterSection from "@/components/layouts/FilterSection";

//Tools
import api from "@/api";
import moment from "jalali-moment";
import SkeletonBudgetsList from "@/components/budgets/SkeletonBudgetsList";

export default function Index({
  budgets,
  totalIncomePrice,
  totalCostPrice,
}: indexBudgetsProps) {
  //Redux
  const dispatch = useAppDispatch();
  const budgetsGlobal = useAppSelector(budgetsSelector);

  //Next
  const router = useRouter();

  //States
  const [dailyType, setDailyType] = useState<boolean>(false);

  //Effects
  useEffect(() => {
    const now = moment().locale("fa");

    //Checking duration
    if (
      router.query.duration !== "monthly" &&
      router.query.duration !== "daily"
    ) {
      router.replace({
        pathname: "/",
        query: {
          ...router.query,
          duration: "monthly",
          year: now.year(),
          month: now.month() + 1,
        },
      });
    } else if (router.query.duration === "monthly") {
      if (
        router.query.duration === "monthly" &&
        (!router.query.year || !router.query.month)
      ) {
        setDailyType(false);
        const now = moment().locale("fa");
        router.replace({
          pathname: "/",
          query: {
            ...router.query,
            year: now.year(),
            month: now.month() + 1,
          },
        });
      } else {
        setDailyType(false);
      }
    } else {
      if (
        !router.query.year ||
        !router.query.month ||
        !router.query.day ||
        parseInt(router.query.year as string) <= 0
      ) {
        setDailyType(true);
        const now = moment().locale("fa");
        router.replace({
          pathname: "/",
          query: {
            ...router.query,
            year: now.year(),
            month: now.month() + 1,
            day: now.date(),
          },
        });
      } else {
        setDailyType(true);
      }
    }
  }, [router]);

  useEffect(() => {
    setBudgetsFunc();
  }, [budgets]);

  //Functions
  async function setBudgetsFunc() {
    await dispatch(setBudgets({ budgets, totalCostPrice, totalIncomePrice }));
  }

  return (
    <div className="flex flex-col items-center md:mt-5">
      <TheNavigation title="داشبورد" isEnabledPreviousPage={false} />
      <div className="px-2 md:px-0 w-full max-w-md">
        <FilterSection />
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl md:rounded-md mb-2">
          <DailyTypeTabs dailyType={dailyType} setDailyType={setDailyType} />
          {dailyType ? <ChangeDayTabs /> : <ChangeMonthTabs />}
          <hr className="my-4" />
          <InformationBudget />
        </div>
        <ul>
          {budgetsGlobal?.map((budget) => (
            <SingleBudget key={budget._id} budget={budget} />
          ))}
          <SkeletonBudgetsList />
        </ul>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  query,
}) => {
  let budgets: IBudget[] = [];
  let totalIncomePrice = 0;
  let totalCostPrice = 0;
  try {
    if (
      req.cookies.userAuthorization &&
      query.duration &&
      query.year &&
      query.month
    ) {
      const transformedData = JSON.parse(req.cookies.userAuthorization);
      const response = await api.get(
        `/budgets?duration=${query.duration}&year=${query.year}&month=${
          query.month
        }${query.duration === "daily" ? "&day=" + query.day : ""}${
          query.category && query.category != "همه دسته بندی ها"
            ? "&category=" + query.category
            : ""
        }${query.date ? "&date=" + query.date : ""}`,
        {
          headers: {
            Authorization: `Bearer ${transformedData.token}`,
          },
        }
      );
      budgets = response.data.budgets;
      totalIncomePrice = response.data.totalIncomePrice;
      totalCostPrice = response.data.totalCostPrice;
    }
  } catch (error: any) {
    console.log(error.response?.data);
  }

  return {
    props: {
      budgets: budgets,
      totalIncomePrice,
      totalCostPrice,
    },
  };
};
