import * as yup from "yup";

export const editProfileValidator = yup.object().shape({
  firstName: yup.string().required("لطفا نام خود را وارد کنید"),
  lastName: yup.string().required("لطفا نام خانوادگی خود را وارد کنید"),
  mobile: yup
    .string()
    .min(11, "فرمت شماره موبایل نادرست است")
    .max(11, "فرمت شماره موبایل نادرست است"),
});

export const changeUserBudgetValidator = yup.object().shape({
  price: yup.number().required("لطفا مبلغ مورد نظر خود را وارد کنید"),
});

export const requestToChangeNumberValidator = yup.object().shape({
  mobile: yup
    .string()
    .min(11, "فرمت شماره موبایل نادرست است")
    .max(11, "فرمت شماره موبایل نادرست است"),
});

export const changeNumberValidator = yup.object().shape({
  mobile: yup
    .string()
    .min(11, "فرمت شماره موبایل نادرست است")
    .max(11, "فرمت شماره موبایل نادرست است"),
  code: yup.string().min(6, "لطفا کدتایید را وارد کنید"),
});
