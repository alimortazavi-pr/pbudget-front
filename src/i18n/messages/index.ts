import type { Language } from "../types";
import { messages as faMessages } from "./fa";
import { messages as enMessages } from "./en";
import { messages as arMessages } from "./ar";

export const allMessages: Record<Language, Record<string, string>> = {
  fa: faMessages,
  en: enMessages,
  ar: arMessages,
};
