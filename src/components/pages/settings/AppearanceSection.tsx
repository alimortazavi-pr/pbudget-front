"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Chip,
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  ProgressBar,
  Switch,
} from "@heroui/react";
import { Eye, Moon, Refresh, Sun1 } from "iconsax-reactjs";

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

/** One colour control: a swatch button that opens area + hue slider + hex field. */
function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <ColorPicker
        value={value}
        onChange={(color) => {
          const hex = normalizeHex(color.toString("hex"));
          if (hex) onChange(hex);
        }}
      >
        <ColorPicker.Trigger className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-surface-secondary px-3 py-2.5 text-start">
          <ColorSwatch size="lg" shape="circle" />
          <span className="font-mono text-sm uppercase" dir="ltr">
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

export function AppearanceSection() {
  const { t } = useTranslation();
  const { theme: mode, toggleTheme } = useTheme();
  const [amountsHidden, toggleAmounts] = useAmountsHidden();
  const [custom, setCustom] = useState<CustomTheme>(DEFAULT_THEME);

  useEffect(() => {
    setCustom(readStoredTheme());
  }, []);

  function update(patch: Partial<CustomTheme>) {
    const next = { ...custom, ...patch };
    setCustom(next);
    applyCustomTheme(next);
  }

  const activePreset = THEME_PRESETS.find(
    (preset) => preset.accent === custom.accent && preset.secondary === custom.secondary,
  );

  return (
    <div className="glass space-y-6 rounded-2xl p-5" data-tour="settings-theme">
      <div>
        <h2 className="text-lg font-bold">{t("common.themeStudio.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("common.themeStudio.description")}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-surface-secondary px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          {mode === "dark" ? <Moon size={20} /> : <Sun1 size={20} />}
          {mode === "dark" ? t("common.darkMode") : t("common.lightMode")}
        </span>
        <Button size="sm" variant="secondary" onPress={toggleTheme}>
          {mode === "dark" ? t("common.lightMode") : t("common.darkMode")}
        </Button>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">{t("common.themeStudio.presets")}</h3>
        <ColorSwatchPicker
          aria-label={t("common.themeStudio.presets")}
          value={activePreset?.accent ?? ""}
          onChange={(color) => {
            const hex = normalizeHex(color.toString("hex"));
            const preset = THEME_PRESETS.find((item) => item.accent === hex);
            if (preset) update({ accent: preset.accent, secondary: preset.secondary });
          }}
          size="lg"
        >
          {THEME_PRESETS.map((preset) => (
            <ColorSwatchPicker.Item key={preset.id} color={preset.accent} aria-label={t(`common.themeStudio.preset.${preset.id}`)}>
              <ColorSwatchPicker.Swatch />
              <ColorSwatchPicker.Indicator />
            </ColorSwatchPicker.Item>
          ))}
        </ColorSwatchPicker>
        {activePreset ? <p className="text-xs text-muted">{t(`common.themeStudio.preset.${activePreset.id}`)}</p> : null}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <ColorControl label={t("common.themeStudio.accent")} value={custom.accent} onChange={(accent) => update({ accent })} />
        <ColorControl label={t("common.themeStudio.secondary")} value={custom.secondary} onChange={(secondary) => update({ secondary })} />
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{t("common.themeStudio.radius")}</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RADIUS_ORDER.map((radius) => (
            <Button
              key={radius}
              size="sm"
              variant={custom.radius === radius ? "primary" : "secondary"}
              onPress={() => update({ radius })}
              style={{ borderRadius: THEME_RADII[radius].field }}
            >
              {t(`common.themeStudio.radiusOption.${radius}`)}
            </Button>
          ))}
        </div>
      </section>

      <div className="flex items-start justify-between gap-4 rounded-xl border border-border/50 bg-surface-secondary px-4 py-3">
        <div>
          <p className="text-sm font-medium">{t("common.themeStudio.tinted")}</p>
          <p className="mt-0.5 text-xs text-muted">{t("common.themeStudio.tintedHint")}</p>
        </div>
        <Switch isSelected={custom.tinted} onChange={(tinted) => update({ tinted })} aria-label={t("common.themeStudio.tinted")}>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </div>

      <section className="space-y-3 rounded-2xl border border-border/50 bg-surface p-4">
        <h3 className="text-sm font-semibold">{t("common.themeStudio.preview")}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">{t("common.themeStudio.previewPrimary")}</Button>
          <Button size="sm" variant="secondary">
            {t("common.themeStudio.previewSecondary")}
          </Button>
          <Chip color="accent">{t("common.themeStudio.previewChip")}</Chip>
        </div>
        <ProgressBar aria-label={t("common.themeStudio.preview")} value={64}>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </section>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" isDisabled={isDefaultTheme(custom)} onPress={() => update(DEFAULT_THEME)}>
          <Refresh size={16} />
          {t("common.themeStudio.reset")}
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-xl border border-border/50 bg-surface-secondary px-4 py-3">
        <div className="flex items-start gap-2">
          <Eye size={20} className="mt-0.5 shrink-0 text-muted" />
          <div>
            <p className="text-sm font-medium">{t("common.themeStudio.hideAmounts")}</p>
            <p className="mt-0.5 text-xs text-muted">{t("common.themeStudio.hideAmountsHint")}</p>
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
