export type LandingAccent = "rose" | "teal" | "violet";
export type LandingSpan = "sm" | "md" | "lg";

export interface ILandingContent {
  hero: {
    badge: string;
    title: string;
    tagline: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  };
  stats: { value: string; label: string }[];
  nav: { id: string; label: string }[];
  features: {
    id: string;
    title: string;
    description: string;
    tags: string[];
    accent: LandingAccent;
    span: LandingSpan;
  }[];
  business: {
    eyebrow: string;
    title: string;
    highlight: string;
    description: string;
    bullets: string[];
    features: { title: string; description: string }[];
  };
  whyUs: { title: string; description: string }[];
  howSteps: { step: string; title: string; description: string }[];
  faq: { q: string; a: string }[];
  contact: {
    title: string;
    description: string;
    email: string;
    telegram: string;
    phone: string;
  };
  about: {
    title: string;
    paragraphs: string[];
  };
  marquee: string[];
  settings: {
    downloadComingSoon: boolean;
    downloadLabel: string;
    showAppDownloadInNav: boolean;
  };
  seo: {
    title: string;
    description: string;
    ogImageUrl: string;
  };
  pricing: {
    eyebrow: string;
    title: string;
    description: string;
    plans: {
      id: string;
      name: string;
      price: string;
      period: string;
      description: string;
      features: string[];
      cta: string;
      highlighted: boolean;
    }[];
  };
}
