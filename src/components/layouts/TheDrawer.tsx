import { Tooltip, useDisclosure } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { MouseEvent, useRef } from "react";

//Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { darkModeSelector } from "@/store/layout/selectors";
import { setDarkMode } from "@/store/layout/actions";
import { logOut, logOutAction } from "@/store/auth/actions";

//Components
import ChangeUserBudgetModal from "../profile/ChangeUserBudgetModal";

//Tools
import {
  Call,
  CloseSquare,
  Copyright,
  Layer,
  LogoutCurve,
  Moneys,
  Moon,
  MoreSquare,
  Sun1,
  UserEdit,
} from "iconsax-react";
import Cookies from "js-cookie";

export default function TheDrawerButton() {
  //Redux
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector(darkModeSelector);

  //Next
  const router = useRouter();

  //ChakraUI
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpenBudget,
    onOpen: onOpenBudget,
    onClose: onCloseBudget,
  } = useDisclosure();

  //Refs
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  //Functions
  function darkModeToggle() {
    const htmlElement = document.querySelector("html");
    if (isDarkMode) {
      Cookies.set("dark-mode", "false", { expires: 90 });
      htmlElement?.classList.remove("dark");
    } else {
      Cookies.set("dark-mode", "true", { expires: 90 });
      htmlElement?.classList.add("dark");
    }

    dispatch(setDarkMode(!isDarkMode));
  }

  async function logoutHandler() {
    const hasOthersUser: any = await dispatch(logOutAction());
    !hasOthersUser
      ? router.replace(router.asPath)
      : router.push("/get-started");

    onClose();
  }

  function closeHandler(e: MouseEvent<HTMLDivElement>) {
    if (!optionsMenuRef.current?.contains(e.target as HTMLDivElement)) {
      onClose();
    }
  }

  return (
    <>
      <li
        onClick={onOpen}
        className="h-5 w-5 flex items-center justify-center order-4"
      >
        <span className="cursor-pointer">
          <Tooltip
            hasArrow
            label={"بیشتر"}
            placement="top"
            rounded={"md"}
            p={"1.5"}
          >
            <MoreSquare size="20" className={`text-white duration-300`} />
          </Tooltip>
        </span>
      </li>
      {isOpen ? (
        <div
          className={`fixed bottom-0 right-0 w-screen h-screen bg-black dark:bg-gray-200 bg-opacity-25 dark:bg-opacity-20 backdrop-blur-sm cursor-pointer`}
          onClick={closeHandler}
        >
          <div className="absolute bottom-0 right-0 flex justify-center w-screen">
            <div
              className="w-full max-w-md bg-white dark:bg-gray-800 rounded-t-xl flex justify-center items-center flex-wrap gap-3 p-3 pb-0 cursor-default"
              ref={optionsMenuRef}
            >
              <div
                onClick={onClose}
                className="flex flex-col gap-1 items-center justify-center bg-gray-100 dark:bg-gray-700 w-14 h-14 rounded-xl duration-200 hover:opacity-75 cursor-pointer"
              >
                <div>
                  <CloseSquare
                    size="20"
                    className="text-gray-800 dark:text-gray-200"
                  />
                </div>
                <div className="text-gray-800 dark:text-gray-200 font-medium text-sm">
                  <span>بستن</span>
                </div>
              </div>
              <Link
                href={"/profile"}
                className="flex flex-col gap-1 items-center justify-center bg-gray-100 dark:bg-gray-700 w-14 h-14 rounded-xl duration-200 hover:opacity-75"
              >
                <div>
                  <UserEdit
                    size="20"
                    className="text-gray-800 dark:text-gray-200"
                  />
                </div>
                <div className="text-gray-800 dark:text-gray-200 font-medium text-sm">
                  <span>پروفایل</span>
                </div>
              </Link>
              <div
                onClick={onOpenBudget}
                className="flex flex-col gap-1 items-center justify-center bg-gray-100 dark:bg-gray-700 w-14 h-14 rounded-xl duration-200 hover:opacity-75 cursor-pointer"
              >
                <div>
                  <Moneys
                    size="20"
                    className="text-gray-800 dark:text-gray-200"
                  />
                </div>
                <div className="text-gray-800 dark:text-gray-200 font-medium text-sm">
                  <span>موجودی</span>
                </div>
              </div>
              <div
                onClick={darkModeToggle}
                className="flex flex-col gap-1 items-center justify-center bg-gray-100 dark:bg-gray-700 w-14 h-14 rounded-xl duration-200 hover:opacity-75 cursor-pointer"
              >
                <div>
                  {isDarkMode ? (
                    <Sun1
                      size="20"
                      className="text-gray-800 dark:text-gray-200"
                    />
                  ) : (
                    <Moon
                      size="20"
                      className="text-gray-800 dark:text-gray-200"
                    />
                  )}
                </div>
                <div className="text-gray-800 dark:text-gray-200 font-medium text-sm">
                  <span>تغییر تم</span>
                </div>
              </div>
              <a
                href={"tel:+989999961218"}
                className="flex flex-col gap-1 items-center justify-center bg-gray-100 dark:bg-gray-700 w-14 h-14 rounded-xl duration-200 hover:opacity-75"
              >
                <div>
                  <Call
                    size="20"
                    className="text-gray-800 dark:text-gray-200"
                  />
                </div>
                <div className="text-gray-800 dark:text-gray-200 font-medium text-sm">
                  <span>تماس باما</span>
                </div>
              </a>
              <div
                onClick={logoutHandler}
                className="flex flex-col gap-1 items-center justify-center bg-gray-100 dark:bg-gray-700 w-14 h-14 rounded-xl duration-200 hover:opacity-75 cursor-pointer"
              >
                <div>
                  <LogoutCurve
                    size="20"
                    className="text-rose-500 dark:text-rose-400"
                  />
                </div>
                <div className="text-rose-500 dark:text-rose-400 font-medium text-sm">
                  <span>خروج</span>
                </div>
              </div>
              <div className="w-full flex items-start justify-center gap-1 mt-2 mb-1">
                <a
                  href="https://alimor.ir"
                  className="text-gray-600 dark:text-gray-400 text-xs"
                  target="blank"
                >
                  ALIMOR.IR | ALI MORTAZAVI
                </a>
                <Copyright
                  size={"10"}
                  className="text-gray-600 dark:text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <ChangeUserBudgetModal
        isOpen={isOpenBudget}
        onClose={onCloseBudget}
        onOpen={onOpenBudget}
      />
    </>
  );
}
