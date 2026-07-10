export type Language = "fa" | "en" | "ar";

export type TranslationParams = Record<string, string | number>;

export type MessageTree = {
  [key: string]: string | MessageTree;
};
