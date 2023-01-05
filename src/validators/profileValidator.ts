import * as yup from "yup";

export const editProfileValidator = yup.object().shape({
  firstName: yup.string().required("لطفا نام خود را وارد کنید"),
  lastName: yup.string().required("لطفا نام خانوادگی خود را وارد کنید"),
  email: yup
    .string()
    .email("لطفا فرمت ایمیل خود را درست وارد کنید")
    .required("لطفا ایمیل خود را وارد کنید"),
  password: yup
    .string()
    .nullable(true)
    .transform((o, c) => (o === "" ? null : c))
    .min(6, "رمز عبور حداقل باید ۶ حرف باشد"),
});

export const changeUserBudgetValidator = yup.object().shape({
  price: yup.number().required("لطفا مبلغ مورد نظر خود را وارد کنید"),
});
