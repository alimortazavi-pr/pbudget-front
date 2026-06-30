import type { MetadataRoute } from "next";

import {
  APP_DESCRIPTION_FA,
  APP_NAME_FA,
  APP_SHORT_NAME_FA,
} from "@/common/constants/brand";
import { PATHS } from "@/common/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: APP_NAME_FA,
    short_name: APP_SHORT_NAME_FA,
    description: APP_DESCRIPTION_FA,
    lang: "fa",
    dir: "rtl",
    start_url: PATHS.HOME,
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#fb7185",
    background_color: "#1f2937",
    categories: ["finance", "productivity"],
    shortcuts: [
      {
        name: "داشبورد",
        short_name: "داشبورد",
        url: "/app",
        icons: [{ src: "/assets/icons/icon-96x96.png", sizes: "96x96" }],
      },
      {
        name: "ثبت تراکنش",
        short_name: "تراکنش",
        url: "/create-budget",
        icons: [{ src: "/assets/icons/icon-96x96.png", sizes: "96x96" }],
      },
      {
        name: "برنامه روزانه",
        short_name: "تسک‌ها",
        url: "/tasks",
        icons: [{ src: "/assets/icons/icon-96x96.png", sizes: "96x96" }],
      },
    ],
    icons: [
      {
        src: "/assets/icons/icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        src: "/assets/icons/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/assets/icons/icon-128x128.png",
        sizes: "128x128",
        type: "image/png",
      },
      {
        src: "/assets/icons/icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        src: "/assets/icons/icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
      },
      {
        src: "/assets/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/icons/android-icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/assets/icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
      },
      {
        src: "/assets/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
