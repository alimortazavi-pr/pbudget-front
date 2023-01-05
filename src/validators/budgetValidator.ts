import * as yup from "yup";

export const createAndEditBudget = yup.object().shape({
  price: yup.number().required("لطفا مبلغ را وارد کنید"),
  type: yup.string().required("لطفا نوع دریافتی-پرداختی را وارد کنید"),
  date: yup.string().required("لطفا تاریخ را وارد کنید"),
  category: yup.string().required("لطفا دسته را وارد کنید"),
});
