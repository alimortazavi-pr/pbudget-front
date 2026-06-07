import * as yup from "yup";

export const checkMobileExistValidator = yup.object().shape({
  mobile: yup
    .string()
    .min(11, "فرمت شماره موبایل نادرست است")
    .max(11, "فرمت شماره موبایل نادرست است"),
});

export const signUpSmsValidator = yup.object().shape({
  firstName: yup.string().required("لطفا نام خود را وارد کنید"),
  lastName: yup.string().required("لطفا نام خانوادگی خود را وارد کنید"),
  mobile: yup
    .string()
    .min(11, "فرمت شماره موبایل نادرست است")
    .max(11, "فرمت شماره موبایل نادرست است"),
  code: yup.string().min(6, "لطفا کدتایید را وارد کنید"),
  password: yup
    .string()
    .min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد")
    .notRequired(),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "رمز عبور و تکرار آن یکسان نیستند")
    .when("password", {
      is: (value: string) => !!value,
      then: (schema) => schema.required("لطفا تکرار رمز عبور را وارد کنید"),
      otherwise: (schema) => schema.notRequired(),
    }),
});

export const signUpPasswordValidator = yup.object().shape({
  firstName: yup.string().required("لطفا نام خود را وارد کنید"),
  lastName: yup.string().required("لطفا نام خانوادگی خود را وارد کنید"),
  mobile: yup
    .string()
    .min(11, "فرمت شماره موبایل نادرست است")
    .max(11, "فرمت شماره موبایل نادرست است"),
  password: yup
    .string()
    .min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد")
    .required("لطفا رمز عبور را وارد کنید"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "رمز عبور و تکرار آن یکسان نیستند")
    .required("لطفا تکرار رمز عبور را وارد کنید"),
});

export const verifyMobileValidator = yup.object().shape({
  code: yup.string().min(6, "لطفا کدتایید را وارد کنید"),
});

export const signInValidator = yup.object().shape({
  mobile: yup
    .string()
    .min(11, "فرمت شماره موبایل نادرست است")
    .max(11, "فرمت شماره موبایل نادرست است"),
  code: yup.string().min(6, "لطفا کدتایید را وارد کنید"),
});

export const signInPasswordValidator = yup.object().shape({
  mobile: yup
    .string()
    .min(11, "فرمت شماره موبایل نادرست است")
    .max(11, "فرمت شماره موبایل نادرست است"),
  password: yup
    .string()
    .min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد")
    .required("لطفا رمز عبور را وارد کنید"),
});

export const setPasswordValidator = yup.object().shape({
  password: yup
    .string()
    .min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد")
    .required("لطفا رمز عبور را وارد کنید"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "رمز عبور و تکرار آن یکسان نیستند")
    .required("لطفا تکرار رمز عبور را وارد کنید"),
});
