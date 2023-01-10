import * as yup from "yup";

export const checkEmailExistValidator = yup.object().shape({
  email: yup
    .string()
    .email("لطفا فرمت ایمیل خود را درست وارد کنید")
    .required("لطفا ایمیل خود را وارد کنید"),
});

export const signUpValidator = yup.object().shape({
  firstName: yup.string().required("لطفا نام خود را وارد کنید"),
  lastName: yup.string().required("لطفا نام خانوادگی خود را وارد کنید"),
  email: yup
    .string()
    .email("لطفا فرمت ایمیل خود را درست وارد کنید")
    .required("لطفا ایمیل خود را وارد کنید"),
  password: yup.string().min(6, "رمز عبور حداقل باید ۶ حرف باشد"),
});

export const signInValidator = yup.object().shape({
  email: yup
    .string()
    .email("لطفا فرمت ایمیل خود را درست وارد کنید")
    .required("لطفا ایمیل خود را وارد کنید"),
  password: yup.string().min(6, "رمز عبور حداقل باید ۶ حرف باشد"),
});

export const forgetPasswordValidator = yup.object().shape({
  email: yup
    .string()
    .email("لطفا فرمت ایمیل خود را درست وارد کنید")
    .required("لطفا ایمیل خود را وارد کنید"),
});

export const resetPasswordValidator = yup.object().shape({
  email: yup
    .string()
    .email("لطفا فرمت ایمیل خود را درست وارد کنید")
    .required("لطفا ایمیل خود را وارد کنید"),
  code: yup.string().required("لطفا کد را وارد کنید"),
  password: yup.string().min(6, "رمز عبور حداقل باید ۶ حرف باشد"),
  passwordConfirmation: yup
    .string()
    .oneOf([yup.ref("password"), null], "لطفا تایید رمزعبور را درست وارد کنید"),
});
