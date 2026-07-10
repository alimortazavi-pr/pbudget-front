import type { MessageTree } from "../../types";

export const downloadMessages: MessageTree = {
  copyLink: "Copy link",
  webLogin: "Web login",
  badge: "{{appName}} Android app",
  headline: "Financial desk & planning",
  headlineAccent: "Always in your pocket",
  description:
    "{{tagline}}. Android version coming soon — use the web or PWA for now.",
  descriptionReady:
    "{{tagline}}. Android version is ready — or use the web and PWA.",
  downloadApk: "Download APK",
  comingSoon: "Coming soon",
  versionInfo: "Version {{version}} · Android 7+",
  features: {
    finance: {
      title: "Financial management",
      desc: "Transactions, analysis, debts, installments & checks",
    },
    native: {
      title: "Fully native",
      desc: "No WebView — fast and smooth on Android",
    },
    secure: {
      title: "Secure & localized",
      desc: "Full RTL, calendar support, mobile login",
    },
  },
  mockRows: {
    "0": "Payment · Purchase",
    "1": "Income · Project",
    "2": "Monthly installment",
  },
  installTitle: "Install the app",
  steps: {
    "0": "Tap the download button",
    "1": "Enable install from unknown sources in settings",
    "2": "Sign in with your mobile number",
  },
  pageLinkLabel: "Page link:",
};
