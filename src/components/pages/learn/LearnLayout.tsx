import Link from "next/link";
import type { ReactNode } from "react";

import { PATHS } from "@/common/constants";
import { APP_NAME_FA } from "@/common/constants/brand";
import { AppLogo } from "@/components/common/brand/AppLogo";
import { SiteFooterCredits } from "@/components/common/brand/SiteFooterCredits";
import { LEARN_ARTICLES } from "@/content/learn";

/** Light public chrome for the /learn guides (no app shell, fully server-rendered). */
export function LearnLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lx min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="lx-container flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label={APP_NAME_FA}>
            <AppLogo size={32} showText={false} />
            <span className="text-base font-extrabold">{APP_NAME_FA}</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm" aria-label="main">
            <Link href="/learn" className="lx-nav-link">آموزش‌ها</Link>
            <Link href="/pricing" className="lx-nav-link">قیمت‌ها</Link>
            <Link href={PATHS.GET_STARTED} className="lx-btn lx-btn-primary lx-btn-sm">شروع رایگان</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-20 border-t border-border/60 bg-surface/60">
        <div className="lx-container grid gap-8 py-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="font-extrabold">{APP_NAME_FA} — Paradise Desk</p>
            <p className="lx-muted mt-2 text-sm leading-7">مدیریت مالی شخصی، بودجه، اقساط، چک و برنامه روزانه با تقویم شمسی، ثبت از تلگرام و ورود از صورتحساب بانک.</p>
          </div>
          <div>
            <p className="text-sm font-bold">راهنماها</p>
            <ul className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {LEARN_ARTICLES.map((article) => (
                <li key={article.slug}>
                  <Link href={`/learn/${article.slug}`} className="lx-muted hover:text-foreground">{article.title.split("؛")[0]}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-border/60">
          <div className="lx-container flex flex-col items-center justify-between gap-3 py-5 text-xs sm:flex-row">
            <Link href="/" className="lx-muted hover:text-foreground">pdesk.ir</Link>
            <SiteFooterCredits />
          </div>
        </div>
      </footer>
    </div>
  );
}
