import type { AppProps } from "next/app";
import { useEffect } from "react";
import Router from "next/router";

//Redux
import { Provider } from "react-redux";
import store from "@/store";

//Progress bar
import NProgress from "nprogress";

//Assets
import "@/assets/css/globals.css";
import "@/assets/css/nprogress.css";
import "@/assets/css/preflight.css";
import "@/assets/fonts/yekan-bakh/yekan-font.css";
import "react-toastify/dist/ReactToastify.css";

//Components
import HomeLayout from "@/components/HomeLayout";

//Tools

function MyApp({ Component, pageProps, router }: AppProps) {
  //Effects
  useEffect(() => {
    Router.events.on("routeChangeStart", () => NProgress.start());
    Router.events.on("routeChangeComplete", () => NProgress.done());
    Router.events.on("routeChangeError", () => NProgress.done());
  }, []);

  return (
    <Provider store={store}>
      <HomeLayout>
        <Component {...pageProps} />
      </HomeLayout>
    </Provider>
  );
}

export default MyApp;
