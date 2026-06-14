import type { Metadata, Viewport } from "next";

import "@/assets/css/globals.css";

import { ClientProvider } from "@/components/providers/ClientProvider";
import { ThemeScript } from "@/components/common/ThemeScript";

const APP_NAME = "Paradise Budget";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:7711",
  ),
  applicationName: APP_NAME,
  title: {
    default: "Paradise Budget | مدیریت بودجه",
    template: "%s | Paradise Budget",
  },
  description: "اپلیکیشن هوشمند مدیریت درآمد و هزینه",
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
    title: "P Budget",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#fb7185",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className="light overflow-x-clip"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
        <link rel="stylesheet" href="/fonts/yekan-bakh/yekan-font.css" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&display=swap"
        />
      </head>
      <body>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
