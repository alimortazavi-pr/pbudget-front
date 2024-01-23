import Link from "next/link";
import { IconButton, Tooltip } from "@chakra-ui/react";

//Redux

//Components
import TheDrawer from "./TheDrawer";

//Tools
import { Add, Home } from "iconsax-react";
import { useToday } from "@/hooks/getTodayHook";

export default function TabBar() {
  //Other hooks
  const { duration, month, year } = useToday();

  return (
    <div className="px-4 w-screen h-14 fixed bottom-6 flex items-center justify-center z-10">
      <ul className="flex items-center gap-x-7 h-full bg-gray-500 bg-opacity-50 px-7 rounded-2xl">
        <li className={`h-5 w-5 flex items-center justify-center`}>
          <Link href={`/?year=${year}&month=${month}&duration=${duration}`}>
            <Tooltip
              hasArrow
              label={"داشبورد"}
              placement="top"
              rounded={"md"}
              p={"1.5"}
            >
              <Home size="20" className="text-white" />
            </Tooltip>
          </Link>
        </li>
        <li className={``}>
          <Link
            href={"/create-budget"}
            className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-red-500 to-pink-500 flex items-center justify-center"
          >
            <Tooltip
              hasArrow
              label={"ایجاد تراکنش"}
              placement="top"
              rounded={"md"}
              p={"1.5"}
            >
              <IconButton
                borderRadius="1rem"
                backgroundImage={
                  "linear-gradient(to top right, #a855f7 , #ec4899)"
                }
                colorScheme="pink"
                aria-label="Create task"
                icon={<Add size="20" className="text-white" />}
              />
            </Tooltip>
          </Link>
        </li>
        <TheDrawer />
      </ul>
    </div>
  );
}
