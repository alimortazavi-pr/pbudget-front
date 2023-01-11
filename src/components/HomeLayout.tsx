import { ReactNode, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

//Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { didTryAutoLoginSelector } from "@/store/auth/selectors";
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
  const darkMode = useAppSelector(darkModeSelector);

  //Next
  const router = useRouter();

  //Effect
  useEffect(() => {
    checkDarkModeFunc();
  }, []);

  useEffect(() => {
    autoLoginAndGetCategoriesFunc();
  }, [dispatch, didTryAutoLogin]);

  //Functions
  async function autoLoginAndGetCategoriesFunc() {
    if (router.pathname !== "/get-started") {
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
  }

  function checkDarkModeFunc() {
    const darkModeCheck = Cookies.get("dark-mode");
    if (darkModeCheck === undefined) {
      Cookies.set("dark-mode", "false");
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
        <ToastContainer rtl />
      </RtlProvider>
    </ChakraProvider>
  );
}
