import { redirect } from "next/navigation";

import { PATHS } from "@/common/constants";

export default function Page() {
  redirect(PATHS.VENTURES);
}
