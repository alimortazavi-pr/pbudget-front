import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import localFont from "next/font/local";

import "@/assets/css/globals.css";

import {
  APP_DESCRIPTION_FA,
  APP_NAME_EN,
  APP_NAME_FA,
  APP_SHORT_NAME_FA,
  LOGO_OG_IMAGE_SRC,
} from "@/common/constants/brand";
import { ThemeScript } from "@/components/common/ThemeScript";
import { ClientProvider } from "@/components/providers/ClientProvider";

const yekanBakh = localFont({
  src: [
    { path: "../../public/fonts/yekan-bakh/3 yekan bakh/yekan bakh en 03 light.woff2", weight: "300" },
    { path: "../../public/fonts/yekan-bakh/4 yekan bakh/yekan bakh en 04 regular.woff2", weight: "400" },
    { path: "../../public/fonts/yekan-bakh/5 yekan bakh/yekan bakh en 05 medium.woff2", weight: "500" },
    { path: "../../public/fonts/yekan-bakh/6 yekan bakh/yekan bakh en 06 bold.woff2", weight: "600" },
    { path: "../../public/fonts/yekan-bakh/7 yekan bakh/yekan bakh en 07 heavy.woff2", weight: "700" },
    { path: "../../public/fonts/yekan-bakh/8 yekan bakh/yekan bakh en 08 fat.woff2", weight: "800" },
  ],
  variable: "--font-yekan-bakh",
  display: "swap",
  preload: false,
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:7711",
  ),
  applicationName: APP_NAME_EN,
  title: {
    default: `${APP_NAME_FA} | ${APP_NAME_EN}`,
    template: `%s | ${APP_NAME_FA}`,
  },
  description: APP_DESCRIPTION_FA,
  openGraph: {
    images: [{ url: LOGO_OG_IMAGE_SRC, width: 1200, height: 630, alt: APP_NAME_FA }],
  },
  twitter: {
    card: "summary_large_image",
    images: [LOGO_OG_IMAGE_SRC],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      {
        url: "/assets/icons/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/assets/icons/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/assets/icons/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        url: "/assets/icons/android-icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    apple: [
      { url: "/assets/icons/apple-icon-57x57.png", sizes: "57x57" },
      { url: "/assets/icons/apple-icon-60x60.png", sizes: "60x60" },
      { url: "/assets/icons/apple-icon-72x72.png", sizes: "72x72" },
      { url: "/assets/icons/apple-icon-76x76.png", sizes: "76x76" },
      { url: "/assets/icons/apple-icon-114x114.png", sizes: "114x114" },
      { url: "/assets/icons/apple-icon-120x120.png", sizes: "120x120" },
      { url: "/assets/icons/apple-icon-144x144.png", sizes: "144x144" },
      { url: "/assets/icons/apple-icon-152x152.png", sizes: "152x152" },
      { url: "/assets/icons/apple-icon-180x180.png", sizes: "180x180" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_SHORT_NAME_FA,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#fb7185",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${yekanBakh.variable} ${poppins.variable} light overflow-x-clip`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
