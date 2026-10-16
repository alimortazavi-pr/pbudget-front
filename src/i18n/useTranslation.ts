import { t } from "./translate";

const value = { t } as const;

/** The app is Persian only; this keeps the `const { t } = useTranslation()` call sites simple. */
export function useTranslation() {
  return value;
}
