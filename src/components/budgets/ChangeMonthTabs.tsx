import { useRouter } from "next/router";

//Tools
import { ArrowLeft, ArrowRight } from "iconsax-react";
import months from "@/assets/ts/months";

export default function ChangeMonthTabs() {
  //Next
  const router = useRouter();

  //Functions
  function previousMonth() {
    if (parseInt(router.query.month as string) <= 1) {
      router.replace({
        pathname: "/",
        query: {
          ...router.query,
          year: parseInt(router.query.year as string) - 1,
          month: 12,
        },
      });
    } else {
      router.replace({
        pathname: "/",
        query: {
          ...router.query,
          month: parseInt(router.query.month as string) - 1,
        },
      });
    }
  }

  function nextMonth() {
    if (parseInt(router.query.month as string) >= 12) {
      router.replace({
        pathname: "/",
        query: {
          ...router.query,
          year: parseInt(router.query.year as string) + 1,
          month: 1,
        },
      });
    } else {
      router.replace({
        pathname: "/",
        query: {
          ...router.query,
          month: parseInt(router.query.month as string) + 1,
        },
      });
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div
        className={`flex items-center gap-1 text-gray-800 dark:text-white font-medium cursor-pointer`}
        onClick={previousMonth}
      >
        <ArrowRight size={"18"} />
        <span>ماه قبل</span>
      </div>
      <div className="flex items-center gap-2 text-gray-800 dark:text-white font-medium">
        <span>{months[parseInt(router.query.month as string)]}</span>
      </div>
      <div
        className={`flex items-center gap-1 
        text-gray-800 dark:text-white
        font-medium cursor-pointer`}
        onClick={nextMonth}
      >
        <span>ماه بعد</span>
        <ArrowLeft size={"18"} />
      </div>
    </div>
  );
}
