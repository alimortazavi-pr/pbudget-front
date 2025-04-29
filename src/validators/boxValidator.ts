import * as yup from "yup";

export const createAndEditBox = yup.object().shape({
  title: yup.string().required("لطفا عنوان باکس را وارد کنید"),
});
