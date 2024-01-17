import { useRouter } from "next/router";

//Icons
import { ArrowRight } from "iconsax-react";

//Types
import { theNavigationProps } from "@/ts/types/layouts.type";

//Components
import ChangeAccountPopover from "./ChangeAccountPopover";

export default function TheNavigation({
  title,
  previousPage,
  isEnabledPreviousPage = true,
  isEnabledPreviousPageIcon,
}: theNavigationProps) {
  //Next
  const router = useRouter();

  //Functions
  function goPreviousPage() {
    if (previousPage && isEnabledPreviousPage) {
      router.push(previousPage);
    } else if (isEnabledPreviousPage) {
      router.back();
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
      <ChangeAccountPopover />
    </nav>
  );
}
