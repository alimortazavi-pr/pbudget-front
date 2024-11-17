import { ReactNode, use, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

//Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  didTryAutoLoginSelector,
  isAuthSelector,
  tokenSelector,
} from "@/store/auth/selectors";
import { autoLogin } from "@/store/auth/actions";
import { getCategories } from "@/store/category/actions";
import { darkModeSelector } from "@/store/layout/selectors";

//Components
import TabBar from "./layouts/TabBar";

//Tools
import { ToastContainer } from "react-toastify";
import Cookies from "js-cookie";
import { setDarkMode } from "@/store/layout/actions";

//Chakra UI
import { ChakraProvider } from "@chakra-ui/react";
import { RtlProvider } from "@/components/layouts/RtlProvider";
import chakraDarkTheme from "@/assets/styles/chakra-ui/chakraDarkTheme";
import chakraLightTheme from "@/assets/styles/chakra-ui/chakraLightTheme";

//Transition
import { motion } from "framer-motion";

export default function HomeLayout({ children }: { children: ReactNode }) {
  //Redux
  const dispatch = useAppDispatch();
  const didTryAutoLogin = useAppSelector(didTryAutoLoginSelector);
  const token = useAppSelector(tokenSelector);
  const isAuth = useAppSelector(isAuthSelector);
  const darkMode = useAppSelector(darkModeSelector);

  //Next
  const router = useRouter();

  //Effect
  useEffect(() => {
    checkDarkModeFunc();
  }, []);

  useEffect(() => {
    autoLoginFunc();
  }, [dispatch, didTryAutoLogin]);

  useEffect(() => {
    if (isAuth) {
      getCategoriesFunc();
    }
  }, [isAuth, token]);

  //Functions
  async function autoLoginFunc() {
    if (router.pathname !== "/get-started") {
      const userAuthorization = Cookies.get("userAuthorization");
      if (userAuthorization && !didTryAutoLogin) {
        const transformedData = JSON.parse(userAuthorization);
        if (!transformedData.users) {
          Cookies.remove("userAuthorization");
          router.push("/get-started");
          return;
        }
        try {
          await dispatch(
            autoLogin(transformedData.token, transformedData.users)
          );
        } catch (err: any) {
          router.push("/get-started");
        }
      } else if (!userAuthorization) {
        router.push("/get-started");
      }
    }
  }

  async function getCategoriesFunc() {
    await dispatch(getCategories());
  }

  function checkDarkModeFunc() {
    const darkModeCheck = Cookies.get("dark-mode");
    if (darkModeCheck === undefined) {
      Cookies.set("dark-mode", "false", { expires: 90 });
      dispatch(setDarkMode(false));
    } else {
      if (darkModeCheck == "true") {
        document.querySelector("html")?.classList.add("dark");
        dispatch(setDarkMode(true));
      } else {
        dispatch(setDarkMode(false));
      }
    }
  }

  return (
    <ChakraProvider theme={darkMode ? chakraDarkTheme : chakraLightTheme}>
      <RtlProvider>
        <motion.div
          key={router.route}
          initial="initial"
          animate="animate"
          variants={{
            initial: {
              opacity: 0.5,
            },
            animate: {
              opacity: 1,
            },
          }}
        >
          <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            <Head>
              <title>Paradise Budget</title>
            </Head>
            <div
              className={`bg-gray-100 dark:bg-gray-900 ${
                router.pathname !== "/get-started" ? "pt-16 pb-80" : ""
              }`}
            >
              {children}
            </div>
            {router.pathname !== "/get-started" ? <TabBar /> : null}
          </div>
        </motion.div>
        <ToastContainer rtl theme={darkMode ? "dark" : "light"} />
      </RtlProvider>
    </ChakraProvider>
  );
}
