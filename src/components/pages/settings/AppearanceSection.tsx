"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Chip,
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ProgressBar,
  Switch,
} from "@heroui/react";
import { Eye, Moon, Refresh, Sun1, TickCircle } from "iconsax-reactjs";

import * as profileApi from "@/common/api/profile";
import {
  applyCustomTheme,
  DEFAULT_THEME,
  isDefaultTheme,
  normalizeHex,
  readStoredTheme,
  THEME_PRESETS,
  THEME_RADII,
  type CustomTheme,
  type ThemeRadius,
} from "@/common/theme/custom-theme";
import { useAmountsHidden } from "@/components/providers/AmountPrivacyProvider";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useTheme } from "@/components/providers/ThemeProvider";

const RADIUS_ORDER: ThemeRadius[] = ["sharp", "soft", "default", "round"];

function SectionTitle({ children, hint }: { children: string; hint?: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-bold">{children}</h3>
      {hint ? <p className="mt-0.5 text-xs leading-5 text-muted">{hint}</p> : null}
    </div>
  );
}

/** A colour row: swatch + hex on the trigger, area/hue/hex editor in the popover. */
function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-xs font-medium text-muted">{label}</p>
      <ColorPicker
        value={value}
        onChange={(color) => {
          const hex = normalizeHex(color.toString("hex"));
          if (hex) onChange(hex);
        }}
      >
        <ColorPicker.Trigger className="flex h-12 w-full items-center gap-3 rounded-xl border border-border/60 bg-surface-secondary px-3 text-start transition-colors hover:border-accent/50">
          <ColorSwatch size="md" shape="circle" />
          <span className="font-mono text-sm uppercase tracking-wide" dir="ltr">
            {value}
          </span>
        </ColorPicker.Trigger>
        <ColorPicker.Popover>
          <div className="flex w-64 flex-col gap-3 p-3">
            <ColorArea aria-label={label} colorSpace="hsb" xChannel="saturation" yChannel="brightness" className="h-40 w-full">
              <ColorArea.Thumb />
            </ColorArea>
            <ColorSlider aria-label={label} colorSpace="hsb" channel="hue">
              <ColorSlider.Track>
                <ColorSlider.Thumb />
              </ColorSlider.Track>
            </ColorSlider>
            <ColorField aria-label={label}>
              <ColorField.Group variant="secondary">
                <ColorField.Prefix>#</ColorField.Prefix>
                <ColorField.Input dir="ltr" />
              </ColorField.Group>
            </ColorField>
          </div>
        </ColorPicker.Popover>
      </ColorPicker>
    </div>
  );
}

/** Live preview that simply uses the real tokens, so it always matches the app. */
function ThemePreview({ title, primary, secondary, chip }: { title: string; primary: string; secondary: string; chip: string }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-border/60"
      style={{ background: "var(--surface)" }}
      aria-label={title}
      role="img"
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 text-white"
        style={{
          background:
            "linear-gradient(135deg, var(--accent), color-mix(in oklch, var(--accent) 45%, var(--brand-violet)) 55%, var(--brand-violet))",
        }}
      >
        <span className="text-sm font-bold">{title}</span>
        <Chip size="sm" variant="secondary">
          {chip}
        </Chip>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">{primary}</Button>
          <Button size="sm" variant="secondary">
            {secondary}
          </Button>
        </div>
        <ProgressBar aria-label={title} value={64}>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </div>
    </div>
  );
}

export function AppearanceSection() {
  const { t } = useTranslation();
  const { theme: mode, toggleTheme } = useTheme();
  const [amountsHidden, toggleAmounts] = useAmountsHidden();
  const [custom, setCustom] = useState<CustomTheme>(DEFAULT_THEME);

  useEffect(() => {
    setCustom(readStoredTheme());
  }, []);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  function update(patch: Partial<CustomTheme>) {
    const next = { ...custom, ...patch };
    setCustom(next);
    applyCustomTheme(next);
    // Dragging the colour area fires constantly: save to the account once it settles.
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void profileApi.updateUserTheme(isDefaultTheme(next) ? null : next).catch(() => undefined);
    }, 900);
  }

  const activePreset = THEME_PRESETS.find((preset) => preset.accent === custom.accent && preset.secondary === custom.secondary);

  return (
    <div className="space-y-4" data-tour="settings-theme">
      <div className="glass space-y-6 rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold">{t("common.themeStudio.title")}</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted">{t("common.themeStudio.description")}</p>
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-secondary p-1" role="group" aria-label={t("common.appearance")}>
            <Button size="sm" variant={mode === "light" ? "primary" : "ghost"} onPress={() => mode !== "light" && toggleTheme()}>
              <Sun1 size={16} />
              {t("common.lightMode")}
            </Button>
            <Button size="sm" variant={mode === "dark" ? "primary" : "ghost"} onPress={() => mode !== "dark" && toggleTheme()}>
              <Moon size={16} />
              {t("common.darkMode")}
            </Button>
          </div>
        </div>

        <ThemePreview
          title={t("common.themeStudio.preview")}
          primary={t("common.themeStudio.previewPrimary")}
          secondary={t("common.themeStudio.previewSecondary")}
          chip={t("common.themeStudio.previewChip")}
        />

        <section>
          <SectionTitle>{t("common.themeStudio.presets")}</SectionTitle>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" role="radiogroup" aria-label={t("common.themeStudio.presets")}>
            {THEME_PRESETS.map((preset) => {
              const active = activePreset?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => update({ accent: preset.accent, secondary: preset.secondary })}
                  className={`group relative flex flex-col items-center gap-2 rounded-xl border p-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    active ? "border-accent bg-accent/10" : "border-border/60 bg-surface-secondary hover:border-accent/50"
                  }`}
                >
                  <span
                    className="relative block size-10 rounded-full shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${preset.accent} 0 55%, ${preset.secondary} 55% 100%)` }}
                  >
                    {active ? <TickCircle size={18} variant="Bold" className="absolute -end-1 -top-1 rounded-full bg-surface text-accent" /> : null}
                  </span>
                  <span className="text-[11px] font-medium leading-4">{t(`common.themeStudio.preset.${preset.id}`)}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <SectionTitle>{t("common.themeStudio.customColors")}</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <ColorControl label={t("common.themeStudio.accent")} value={custom.accent} onChange={(accent) => update({ accent })} />
            <ColorControl label={t("common.themeStudio.secondary")} value={custom.secondary} onChange={(secondary) => update({ secondary })} />
          </div>
        </section>

        <section>
          <SectionTitle>{t("common.themeStudio.radius")}</SectionTitle>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={t("common.themeStudio.radius")}>
            {RADIUS_ORDER.map((radius) => (
              <Button
                key={radius}
                size="sm"
                variant={custom.radius === radius ? "primary" : "secondary"}
                onPress={() => update({ radius })}
                className="w-full"
                style={{ borderRadius: THEME_RADII[radius].field }}
              >
                {t(`common.themeStudio.radiusOption.${radius}`)}
              </Button>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-surface-secondary px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">{t("common.themeStudio.tinted")}</p>
            <p className="mt-0.5 text-xs leading-5 text-muted">{t("common.themeStudio.tintedHint")}</p>
          </div>
          <Switch isSelected={custom.tinted} onChange={(tinted) => update({ tinted })} aria-label={t("common.themeStudio.tinted")}>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
        </div>

        <div className="flex justify-end border-t border-border/50 pt-4">
          <Button variant="ghost" size="sm" isDisabled={isDefaultTheme(custom)} onPress={() => update(DEFAULT_THEME)}>
            <Refresh size={16} />
            {t("common.themeStudio.reset")}
          </Button>
        </div>
      </div>

      <div className="glass flex items-center justify-between gap-4 rounded-2xl p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
            <Eye size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold">{t("common.themeStudio.hideAmounts")}</h2>
            <p className="mt-0.5 text-xs leading-5 text-muted">{t("common.themeStudio.hideAmountsHint")}</p>
          </div>
        </div>
        <Switch isSelected={amountsHidden} onChange={toggleAmounts} aria-label={t("common.themeStudio.hideAmounts")}>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </div>
    </div>
  );
}
