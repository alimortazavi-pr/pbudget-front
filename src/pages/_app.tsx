import type { AppProps } from "next/app";
import { useEffect } from "react";
import Router from "next/router";

//Chakra UI
import { ChakraProvider } from "@chakra-ui/react";
import { RtlProvider } from "@/components/layouts/RtlProvider";
import extendChakraTheme from "@/assets/styles/CustomChakraTheme";

//Redux
import { Provider } from "react-redux";
import store from "@/store";

//Progress bar
import NProgress from "nprogress";

//Transition
import { motion } from "framer-motion";

//Assets
import "@/assets/css/globals.css";
import "@/assets/css/nprogress.css";
import "@/assets/css/preflight.css";
import "@/assets/fonts/yekan-bakh/yekan-font.css";
import "react-toastify/dist/ReactToastify.css";

//Components
import HomeLayout from "@/components/HomeLayout";

//Tools
import { ToastContainer } from "react-toastify";

function MyApp({ Component, pageProps, router }: AppProps) {
  useEffect(() => {
    Router.events.on("routeChangeStart", () => NProgress.start());
    Router.events.on("routeChangeComplete", () => NProgress.done());
    Router.events.on("routeChangeError", () => NProgress.done());
  }, []);
  return (
    <Provider store={store}>
      <ChakraProvider theme={extendChakraTheme}>
        <RtlProvider>
          <HomeLayout>
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
              <Component {...pageProps} />
            </motion.div>
            <ToastContainer rtl />
          </HomeLayout>
        </RtlProvider>
      </ChakraProvider>
    </Provider>
  );
}

export default MyApp;
