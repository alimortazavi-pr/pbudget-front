export type TranslationParams = Record<string, string | number>;

export type MessageTree = {
  [key: string]: string | MessageTree;
};
