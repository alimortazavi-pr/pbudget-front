declare module "moment-jalali" {
  import type { Moment } from "moment";
  const moment: typeof import("moment") & {
    (): Moment;
  };
  export default moment;
}
