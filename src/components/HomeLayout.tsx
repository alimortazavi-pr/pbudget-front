import { ReactNode, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

//Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { didTryAutoLoginSelector } from "@/store/auth/selectors";
import { autoLogin } from "@/store/auth/actions";
import { getCategories } from "@/store/category/actions";

//Components
import TabBar from "./layouts/TabBar";

//Tools
import Cookies from "js-cookie";

export default function HomeLayout({ children }: { children: ReactNode }) {
  //Redux
  const dispatch = useAppDispatch();
  const didTryAutoLogin = useAppSelector(didTryAutoLoginSelector);

  //Next
  const router = useRouter();

  //Effect
  useEffect(() => {
    autoLoginAndGetCategoriesFunc();
  }, [dispatch, didTryAutoLogin]);

  //Functions
  async function autoLoginAndGetCategoriesFunc() {
    const userAuthorization = Cookies.get("userAuthorization");
    if (userAuthorization && !didTryAutoLogin) {
      const transformedData = JSON.parse(userAuthorization);
      try {
        await dispatch(autoLogin(transformedData.token));
        await dispatch(getCategories());
      } catch (err: any) {
        router.push("/get-started");
      }
    } else if (!userAuthorization) {
      router.push("/get-started");
    }
  }

  return (
    <div>
      <Head>
        <title>Paradise Budget</title>
      </Head>
      <div
        className={`${router.pathname !== "/get-started" ? "pt-16 pb-80" : ""}`}
      >
        {children}
      </div>
      {router.pathname !== "/get-started" ? <TabBar /> : null}
    </div>
  );
}
