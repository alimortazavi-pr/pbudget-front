import { ReactNode, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

//Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { didTryAutoLoginSelector, isAuthSelector } from "@/store/auth/selectors";
import { autoLogin } from "@/store/auth/actions";

//Components
import TabBar from "./layouts/TabBar";

//Tools
import Cookies from "js-cookie";

export default function HomeLayout({ children }: { children: ReactNode }) {
  //Redux
  const dispatch = useAppDispatch();
  const didTryAutoLogin = useAppSelector(didTryAutoLoginSelector);
  const isAuth = useAppSelector(isAuthSelector);

  //Next
  const router = useRouter();

  //Effect
  useEffect(() => {
    const userAuthorization = Cookies.get("userAuthorization");
    if (userAuthorization && !didTryAutoLogin) {
      const transformedData = JSON.parse(userAuthorization);
      try {
        dispatch(autoLogin(transformedData.token));
      } catch (err: any) {
        router.push("/get-started");
        console.log(err);
      }
    } else if (!userAuthorization) {
      router.push("/get-started");
    }
  }, [dispatch, didTryAutoLogin]);
  return (
    <div>
      <Head>
        <title>Paradise Budget</title>
      </Head>
      <div
        className={`${router.pathname !== "/get-started" ? "pt-16 pb-24" : ""}`}
      >
        {children}
      </div>
      {router.pathname !== "/get-started" ? <TabBar /> : null}
    </div>
  );
}
