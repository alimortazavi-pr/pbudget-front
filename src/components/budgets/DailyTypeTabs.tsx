import { useRouter } from "next/router";

//Types
import { dailyTypeTabsProps } from "@/ts/types/budget.type";

//Tools
import moment from "jalali-moment";

export default function DailyTypeTabs({
  dailyType,
  setDailyType,
}: dailyTypeTabsProps) {
  //Next
  const router = useRouter();

  //Functions
  function setDailyHandler(type: boolean) {
    if (type) {
      const now = moment().locale("fa");
      router.replace({
        pathname: "/",
        query: {
          duration: "daily",
          year: now.year(),
          month: now.month() + 1,
          day: now.date(),
        },
      });
      setDailyType(true);
    } else {
      const now = moment().locale("fa");
      router.replace({
        pathname: "/",
        query: {
          duration: "monthly",
          year: now.year(),
          month: now.month() + 1,
        },
      });
      setDailyType(false);
    }
  }

  return (
    <div className="flex items-center gap-2 mb-7">
      <div
        className={`p-1 flex-1 text-center border border-rose-400 rounded-lg cursor-pointer ${
          dailyType ? "bg-rose-400 text-white dark:text-gray-800" : "bg-transparent dark:text-rose-400"
        }`}
        onClick={() => setDailyHandler(true)}
      >
        <span className="leading-none">روزانه</span>
      </div>
      <div
        className={`p-1 flex-1 text-center border border-rose-400 rounded-lg cursor-pointer ${
          !dailyType ? "bg-rose-400 text-white dark:text-gray-800" : "bg-transparent dark:text-rose-400"
        }`}
        onClick={() => setDailyHandler(false)}
      >
        <span className="leading-none">ماهانه</span>
      </div>
    </div>
  );
}
