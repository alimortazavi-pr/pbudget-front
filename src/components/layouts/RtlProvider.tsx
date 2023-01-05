import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import rtl from "stylis-plugin-rtl";
import { ReactNode } from "react";
import { useRouter } from "next/router";

// NB: A unique `key` is important for it to work!
const options = {
  rtl: { key: "css-ar", stylisPlugins: [rtl] },
  ltr: { key: "css-en" },
};

type Props = {
  children: ReactNode;
};
export function RtlProvider({ children }:Props) {
  const { locale } = useRouter();
  const dir = locale == "ar" ? "rtl" : "ltr";
  const cache = createCache(options[dir]);
  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
