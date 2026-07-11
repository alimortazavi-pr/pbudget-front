import { allMessages } from "@/i18n/messages";

/** English product name — exports, metadata, bot API labels */
export const APP_NAME_EN = "Paradise Desk";

export const APP_NAME_KEY = "brand.appName";
export const APP_SHORT_NAME_KEY = "brand.appShortName";
export const APP_TAGLINE_KEY = "brand.tagline";
export const APP_DESCRIPTION_KEY = "brand.description";

/** Persian defaults for SSR/metadata (fa catalog) */
export const APP_NAME_FA = allMessages.fa[APP_NAME_KEY];
export const APP_SHORT_NAME_FA = allMessages.fa[APP_SHORT_NAME_KEY];
export const APP_TAGLINE_FA = allMessages.fa[APP_TAGLINE_KEY];
export const APP_DESCRIPTION_FA = allMessages.fa[APP_DESCRIPTION_KEY];

export const APP_SHORT_NAME_EN = "P Desk";

export const DEVELOPER_SITE_URL = "https://alimor.ir";
export const DEVELOPER_SITE_LABEL = "alimor.ir";
export const CONTACT_EMAIL = "alimortazavi.pr@gmail.com";

/** Official app icon — single PNG used everywhere */
export const LOGO_MARK_SRC = "/assets/logo-mark.png";
export const LOGO_MARK_DARK_SRC = LOGO_MARK_SRC;
export const LOGO_MARK_LIGHT_SRC = LOGO_MARK_SRC;
export const LOGO_OG_IMAGE_SRC = "/assets/og-landing.png";
/** Minimum clear space around mark (px) — do not crowd with UI */
export const LOGO_MIN_CLEAR_SPACE = 2;
