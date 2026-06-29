"use client";

import { useEffect, useState } from "react";

import { fetchLandingContent } from "@/common/api/site";
import type { ILandingContent } from "@/common/interfaces/landing.interface";
import { DEFAULT_LANDING_CONTENT } from "@/components/pages/landing/landing-data";

export function useLandingContent(initialContent?: ILandingContent) {
  const [content, setContent] = useState<ILandingContent>(
    initialContent ?? DEFAULT_LANDING_CONTENT,
  );
  const [loading, setLoading] = useState(!initialContent);

  useEffect(() => {
    if (initialContent) return;
    void fetchLandingContent()
      .then(setContent)
      .catch(() => setContent(DEFAULT_LANDING_CONTENT))
      .finally(() => setLoading(false));
  }, [initialContent]);

  return { content, loading };
}
