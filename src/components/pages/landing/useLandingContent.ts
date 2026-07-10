"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchLandingContent } from "@/common/api/site";
import type { ILandingContent } from "@/common/interfaces/landing.interface";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { localizeLandingContent } from "@/i18n/localize-landing-content";
import { DEFAULT_LANDING_CONTENT } from "@/components/pages/landing/landing-data";

export function useLandingContent(initialContent?: ILandingContent) {
  const { language, t } = useLanguage();
  const [rawContent, setRawContent] = useState<ILandingContent>(
    initialContent ?? DEFAULT_LANDING_CONTENT,
  );
  const [loading, setLoading] = useState(!initialContent);

  useEffect(() => {
    if (initialContent) return;
    void fetchLandingContent()
      .then(setRawContent)
      .catch(() => setRawContent(DEFAULT_LANDING_CONTENT))
      .finally(() => setLoading(false));
  }, [initialContent]);

  const content = useMemo(
    () => localizeLandingContent(rawContent, t, language),
    [rawContent, t, language],
  );

  return { content, loading };
}
