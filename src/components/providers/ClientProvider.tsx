"use client";

import { FC, PropsWithChildren } from "react";
import { I18nProvider } from "react-aria";
import { SerwistProvider } from "@serwist/next/react";

import ReduxProvider from "./ReduxProvider";
import RootProvider from "./RootProvider";
import { ThemeProvider } from "./ThemeProvider";
import { MobileOverlayProvider } from "./MobileOverlayProvider";
import { VoiceAssistantPreferenceProvider } from "./VoiceAssistantPreferenceProvider";
import { TourProvider } from "./TourProvider";
import { VersionProvider } from "./VersionProvider";
import { AppShell } from "@/components/common/layout/AppShell";
import { PwaInstallPrompt } from "@/components/common/PwaInstallPrompt";
import { LanguageProvider } from "./LanguageProvider";
import { AppModeProvider } from "./AppModeProvider";

export const ClientProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <SerwistProvider swUrl="/sw.js">
      <ReduxProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AppModeProvider>
              <VoiceAssistantPreferenceProvider>
                <MobileOverlayProvider>
                  <VersionProvider>
                    <TourProvider>
                      <I18nProvider locale="fa-IR">
                        <RootProvider>
                          <AppShell>{children}</AppShell>
                          <PwaInstallPrompt />
                        </RootProvider>
                      </I18nProvider>
                    </TourProvider>
                  </VersionProvider>
                </MobileOverlayProvider>
              </VoiceAssistantPreferenceProvider>
            </AppModeProvider>
          </LanguageProvider>
        </ThemeProvider>
      </ReduxProvider>
    </SerwistProvider>
  );
};
