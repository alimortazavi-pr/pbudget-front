import Link from "next/link";
import { IconButton, Tooltip } from "@chakra-ui/react";
import { useState } from "react";

//Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { darkModeSelector } from "@/store/layout/selectors";
import { setDarkMode } from "@/store/layout/actions";

//Components
import ProfileTabIcon from "./ProfileTabIcon";

//Tools
import { Add, Home, Layer, Moon, SidebarLeft, Sun1 } from "iconsax-react";
import Cookies from "js-cookie";

export default function TabBar() {
  //Redux
  const dispatch = useAppDispatch();
  const darkMode = useAppSelector(darkModeSelector);

  //States
  const [isMoreOptions, setIsMoreOptions] = useState<boolean>(false);

  //Functions
  function darkModeToggle() {
    const htmlElement = document.querySelector("html");
    if (darkMode) {
      Cookies.set("dark-mode", "false");
      htmlElement?.classList.remove("dark");
    } else {
      Cookies.set("dark-mode", "true");
      htmlElement?.classList.add("dark");
    }

    dispatch(setDarkMode(!darkMode));
  }

  return (
    <div className="px-4 w-screen h-14 fixed bottom-6 flex items-center justify-center z-10">
      <ul className="flex items-center gap-x-7 h-full bg-gray-500 bg-opacity-50 backdrop-blur-xl px-7 rounded-2xl">
        <li className={`${isMoreOptions ? "order-1" : "order-2"}`}>
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
        <li
          className={`h-5 w-5 flex items-center justify-center ${
            isMoreOptions ? "order-2" : "order-1"
          }`}
        >
          <Link href={"/"}>
            <Tooltip
              hasArrow
              label={"خانه"}
              placement="top"
              rounded={"md"}
              p={"1.5"}
            >
              <Home size="20" className="text-white" />
            </Tooltip>
          </Link>
        </li>
        {isMoreOptions ? (
          <ul className={`flex items-center gap-x-7 h-full order-3`}>
            <ProfileTabIcon />
            <li className="h-5 w-5 flex items-center justify-center">
              <Link href={"/profile/categories"}>
                <Tooltip
                  hasArrow
                  label="دسته بندی ها"
                  placement="top"
                  rounded={"md"}
                  p={"1.5"}
                >
                  <Layer size="20" className="text-white" />
                </Tooltip>
              </Link>
            </li>
            <li className="h-5 w-5 flex items-center justify-center">
              <Tooltip
                hasArrow
                label="تغییر تم"
                placement="top"
                rounded={"md"}
                p={"1.5"}
              >
                <span className="cursor-pointer" onClick={darkModeToggle}>
                  {darkMode ? (
                    <Sun1 size="20" className="text-white" />
                  ) : (
                    <Moon size="20" className="text-white" />
                  )}
                </span>
              </Tooltip>
            </li>
          </ul>
        ) : null}
        <li className="h-5 w-5 flex items-center justify-center order-4">
          <span
            className="cursor-pointer"
            onClick={() => setIsMoreOptions(!isMoreOptions)}
          >
            <Tooltip
              hasArrow
              label={isMoreOptions ? "بستن" : "بیشتر"}
              placement="top"
              rounded={"md"}
              p={"1.5"}
            >
              <SidebarLeft
                size="20"
                className={`text-white duration-300 ${
                  isMoreOptions ? "rotate-180" : "rotate-0"
                }`}
              />
            </Tooltip>
          </span>
        </li>
      </ul>
    </div>
  );
}
