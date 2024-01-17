import { useRouter } from "next/router";
import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Spinner,
  useDisclosure,
} from "@chakra-ui/react";
import { Fragment, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";

//Icons
import { Add, ArrowDown2, ArrowRight } from "iconsax-react";

//Types
import { theNavigationProps } from "@/ts/types/layouts.type";

//Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { userSelector } from "@/store/profile/selectors";
import { darkModeSelector } from "@/store/layout/selectors";
import { usersSelector } from "@/store/auth/selectors";
import { changeAccountAction } from "@/store/auth/actions";

export default function TheNavigation({
  title,
  previousPage,
  isEnabledPreviousPage = true,
  isEnabledPreviousPageIcon,
}: theNavigationProps) {
  //States
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //Redux
  const dispatch = useAppDispatch();
  const profile = useAppSelector(userSelector);
  const isDarkMode = useAppSelector(darkModeSelector);
  const users = useAppSelector(usersSelector);

  //Next
  const router = useRouter();

  //ChakraUI hooks
  const { isOpen, onOpen, onClose } = useDisclosure();

  //Functions
  function goPreviousPage() {
    if (previousPage && isEnabledPreviousPage) {
      router.push(previousPage);
    } else if (isEnabledPreviousPage) {
      router.back();
    }
  }

  async function changeAccount(token: string) {
    setIsLoading(true);
    try {
      await dispatch(changeAccountAction(token));
      router.replace(router.asPath);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      toast.error(err.message, {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  }

  return (
    <nav className="px-4 w-screen h-14 fixed top-0 bg-white dark:bg-gray-700 dark:text-white bg-opacity-50 dark:bg-opacity-25 backdrop-blur flex items-center justify-between z-10">
      <div
        className="text-lg flex items-end cursor-pointer flex-1"
        onClick={goPreviousPage}
      >
        {isEnabledPreviousPageIcon ? (
          <ArrowRight size={"20"} className="ml-1" />
        ) : null}
        <span className="font-semibold leading-none">{title}</span>
      </div>
      <div className="flex-1 max-w-[50%] flex justify-end">
        <Popover
          isOpen={isOpen}
          onOpen={onOpen}
          onClose={onClose}
          placement="bottom"
        >
          <PopoverTrigger>
            <div className="flex items-center font-medium justify-end gap-1 cursor-pointer max-w-fit">
              <span className="truncate">
                {profile?.firstName} {profile?.lastName}
              </span>
              <div className="flex items-center justify-center">
                <ArrowDown2 className="w-4 h-4" variant="Bold" />
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent
            bg={isDarkMode ? "#1f2937" : "#f9fafb"}
            borderColor={isDarkMode ? "#e5e7eb" : "#e5e7eb"}
          >
            <PopoverArrow bg={isDarkMode ? "#1f2937" : "#f9fafb"} />
            <PopoverBody style={{ position: "relative" }}>
              <ul className="w-full h-fit">
                {isLoading && (
                  <div className="w-full h-full absolute bg-gray-500/10 backdrop-blur flex items-center justify-center top-0 left-0 rounded">
                    <Spinner color="rose.500" />
                  </div>
                )}

                {users?.map((user) => (
                  <li
                    onClick={() => changeAccount(user.token)}
                    key={user._id}
                    className={`p-2 rounded-lg hover:bg-gray-400/40 dark:hover:bg-gray-600/50 mb-1 cursor-pointer ${
                      user._id == profile?._id
                        ? "bg-gray-400/40 dark:bg-gray-600/50"
                        : ""
                    }`}
                  >
                    {user.firstName} {user.lastName}
                  </li>
                ))}

                <Link
                  href={"/get-started"}
                  className="p-2 rounded-lg hover:bg-gray-400/40 dark:hover:bg-gray-600/50 flex items-start cursor-pointer"
                >
                  افزودن اکانت <Add size="20" className="mr-1" />
                </Link>
              </ul>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  );
}
