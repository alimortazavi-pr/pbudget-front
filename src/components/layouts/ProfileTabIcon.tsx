import Link from "next/link";
import { useRouter } from "next/router";

//Redux
import { useAppDispatch } from "@/store/hooks";
import { logOut } from "@/store/auth/actions";

//Tools
import { Logout, User, UserEdit } from "iconsax-react";
import { Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react";

export default function ProfileTabIcon() {
  //Redux
  const dispatch = useAppDispatch();

  //Next
  const router = useRouter();

  //Functions
  function logoutHandler() {
    dispatch(logOut());
    router.push("/get-started");
  }

  return (
    <li className="h-5 w-5 flex items-center justify-center">
      <Menu>
        <MenuButton>
          <User size="20" className="text-white" />
        </MenuButton>
        <MenuList>
          <MenuItem px={"1rem"} className="rounded-md">
            <Link
              href={"/profile"}
              className="text-gray-800 dark:text-white flex items-center gap-2"
            >
              <UserEdit size="18" />
              <span>پروفایل</span>
            </Link>
          </MenuItem>
          <MenuItem px={"1rem"} className="rounded-md">
            <span
              className="text-gray-800 dark:text-white flex items-center gap-2"
              onClick={logoutHandler}
            >
              <Logout size="18" />
              <span>خروج</span>
            </span>
          </MenuItem>
        </MenuList>
      </Menu>
    </li>
  );
}
