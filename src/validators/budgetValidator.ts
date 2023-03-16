import * as yup from "yup";

export const createAndEditBudget = yup.object().shape({
  price: yup.string().required("لطفا مبلغ را وارد کنید"),
  type: yup.string().required("لطفا نوع دریافتی-پرداختی را وارد کنید"),
  year: yup.string().required("لطفا تاریخ را وارد کنید"),
  month: yup.string().required("لطفا تاریخ را وارد کنید"),
  day: yup.string().required("لطفا تاریخ را وارد کنید"),
  category: yup.string().required("لطفا دسته را وارد کنید"),
});
