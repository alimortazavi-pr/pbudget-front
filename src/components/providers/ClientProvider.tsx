"use client";

import { FC, PropsWithChildren } from "react";
import { I18nProvider } from "react-aria";
import { SerwistProvider } from "@serwist/next/react";

import ReduxProvider from "./ReduxProvider";
import RootProvider from "./RootProvider";
import { ThemeProvider } from "./ThemeProvider";
import { ExperienceProvider } from "./ExperienceProvider";
import { AppShell } from "@/components/common/layout/AppShell";
import { PwaInstallPrompt } from "@/components/common/PwaInstallPrompt";

export const ClientProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <SerwistProvider swUrl="/sw.js">
      <ReduxProvider>
        <ThemeProvider>
          <ExperienceProvider>
            <I18nProvider locale="fa-IR">
              <RootProvider>
                <AppShell>{children}</AppShell>
                <PwaInstallPrompt />
              </RootProvider>
            </I18nProvider>
          </ExperienceProvider>
        </ThemeProvider>
      </ReduxProvider>
    </SerwistProvider>
  );
};
