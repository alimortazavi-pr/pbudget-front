import { useEffect, useState } from "react";
import { useRouter } from "next/router";

//Types
import { IDate } from "@/ts/interfaces/layout.interface";

//Tools
import { ArrowLeft, ArrowRight } from "iconsax-react";
import convertToPersian from "num-to-persian";
import months from "@/assets/ts/months";
import oneToTwoNumber from "one-to-two-num";
import moment from "jalali-moment";

export default function ChangeDayTabs() {
  //Next
  const router = useRouter();

  //States
  const [date, setDate] = useState<IDate>({ year: "", month: "", day: "" });

  //Effects
  useEffect(() => {
    //Checking date
    if (router.query.duration === "monthly") {
      setDate({
        year: parseInt(router.query.year as string),
        month: parseInt(router.query.month as string),
        day: "",
      });
    } else if (router.query.duration === "daily") {
      setDate({
        year: parseInt(router.query.year as string),
        month: parseInt(router.query.month as string),
        day: parseInt(router.query.day as string),
      });
    }
  }, [router]);

  //Functions
  function previousDay() {
    const previousDayDateSplit = moment(
      new Date(
        moment(
          `${router.query.year}/${router.query.month}/${router.query.day}`,
          "jYYYY/jMM/jDD"
        ).format()
      ).getTime() -
        24 * 60 * 60 * 1000
    )
      .format("jYYYY/jMM/jDD")
      .split("/");

    router.replace({
      pathname: "/",
      query: {
        duration: "daily",
        year: previousDayDateSplit[0],
        month: previousDayDateSplit[1],
        day: previousDayDateSplit[2],
      },
    });
  }

  function nextDay() {
    const nextDayDateSplit = moment(
      new Date(
        moment(
          `${router.query.year}/${router.query.month}/${router.query.day}`,
          "jYYYY/jMM/jDD"
        ).format()
      ).getTime() +
        24 * 60 * 60 * 1000
    )
      .format("jYYYY/jMM/jDD")
      .split("/");

    router.replace({
      pathname: "/",
      query: {
        duration: "daily",
        year: nextDayDateSplit[0],
        month: nextDayDateSplit[1],
        day: nextDayDateSplit[2],
      },
    });
  }

  return (
    <div className="flex items-center justify-between">
      <div
        className="flex items-center gap-1 text-gray-800 dark:text-white font-medium cursor-pointer"
        onClick={previousDay}
      >
        <ArrowRight size={"18"} />
        <span>روز قبل</span>
      </div>
      <div className="flex items-center gap-2 text-gray-800 dark:text-white font-medium">
        <span>{convertToPersian(oneToTwoNumber(date.day || 0) || 0)}</span>
        <span>{months[date.month]}</span>
        <span>{convertToPersian(date.year || 0)}</span>
      </div>
      <div
        className="flex items-center gap-1 text-gray-800 dark:text-white font-medium cursor-pointer"
        onClick={nextDay}
      >
        <span>روز بعد</span>
        <ArrowLeft size={"18"} />
      </div>
    </div>
  );
}
