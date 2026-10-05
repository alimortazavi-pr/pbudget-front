"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@heroui/react";
import {
  ArrowDown,
  ArrowUp,
  Lock1,
  Moon,
  MoneyRecive,
  MoneySend,
  Profile,
  SearchNormal1,
  Sun1,
} from "iconsax-reactjs";

import * as adminApi from "@/common/api/admin-insights";
import { PATHS } from "@/common/constants";
import { formatPriceForUser } from "@/common/utils/format-currency";
import { parseQuickEntry } from "@/common/utils/quick-entry";
import { AppModal } from "@/components/common/ui/AppModal";
import {
  ACCOUNT_NAV_ITEMS,
  BANK_IMPORT_NAV_ITEM,
  PLANNING_NAV_GROUPS,
  PRIMARY_NAV_ITEMS,
} from "@/components/common/layout/shell-nav";
import { ADMIN_NAV_GROUPS } from "@/components/common/layout/admin-nav";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useOptionalSubscriptionAccess } from "@/components/providers/SubscriptionAccessProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAppSelector } from "@/stores/hooks";
import { categoriesSelector } from "@/stores/category";
import { userSelector } from "@/stores/profile";

type IconType = ComponentType<{ size?: number; variant?: "Bold" | "Linear" | "Bulk"; className?: string }>;

type Command = {
  id: string;
  label: string;
  group: string;
  icon: IconType;
  keywords?: string;
  locked?: boolean;
  /** Secondary text shown at the end of the row (e.g. a mobile number). */
  hint?: string;
  run: () => void;
};

/** Persian/Arabic letter variants and digits normalised so "كارت" finds "کارت". */
function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[‌‏ً-ٟ]/g, "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .trim();
}

function score(command: Command, query: string) {
  if (!query) return 1;
  const label = normalize(command.label);
  const haystack = `${label} ${normalize(command.keywords ?? "")}`;
  if (label.startsWith(query)) return 3;
  if (haystack.includes(query)) return 2;
  // Every word of the query appears somewhere ("بدهی طلب" → "طلب و بدهی").
  return query.split(/\s+/).every((part) => haystack.includes(part)) ? 1 : 0;
}

const OPEN_EVENT = "pdesk:command-palette";

/** Open the palette from anywhere (e.g. a header button). */
export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/**
 * Ctrl/⌘+K (or "/") jumps to any page or action by typing — the fastest way
 * around an app with this many sections, on desktop and mobile alike.
 */
export function CommandPalette() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  // Optional: the admin layout has no subscription provider.
  const access = useOptionalSubscriptionAccess();
  const loading = access?.loading ?? true;
  const isFeatureEnabled = access?.isFeatureEnabled;
  const user = useAppSelector(userSelector);
  const categories = useAppSelector(categoriesSelector);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, [contenteditable=true]");
      if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setOpen(true);
      }
    }
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      if (/^https?:/.test(href)) window.open(href, "_blank", "noopener,noreferrer");
      else router.push(href);
    },
    [router],
  );

  const commands = useMemo<Command[]>(() => {
    const actions = t("common.commandActions");
    const pages = t("common.commandPages");
    const locked = (featureKey?: string) =>
      Boolean(featureKey && !loading && isFeatureEnabled && isFeatureEnabled(featureKey) === false);
    const list: Command[] = [
      {
        id: "new-expense",
        label: t("common.commandNewExpense"),
        group: actions,
        icon: MoneySend,
        keywords: "هزینه خرج پرداخت expense cost",
        run: () => go(`${PATHS.CREATE_BUDGET}?type=1`),
      },
      {
        id: "new-income",
        label: t("common.commandNewIncome"),
        group: actions,
        icon: MoneyRecive,
        keywords: "درآمد دریافت واریز income",
        run: () => go(`${PATHS.CREATE_BUDGET}?type=0`),
      },
      {
        id: "bank-import",
        label: t(BANK_IMPORT_NAV_ITEM.label),
        group: actions,
        icon: BANK_IMPORT_NAV_ITEM.icon as IconType,
        keywords: "اکسل صورتحساب excel import",
        locked: locked(BANK_IMPORT_NAV_ITEM.featureKey),
        run: () => go(BANK_IMPORT_NAV_ITEM.href),
      },
      {
        id: "theme",
        label: theme === "dark" ? t("common.lightMode") : t("common.darkMode"),
        group: actions,
        icon: theme === "dark" ? Sun1 : Moon,
        keywords: "تم theme dark light شب روز",
        run: () => {
          toggleTheme();
          setOpen(false);
        },
      },
    ];
    const seen = new Set<string>();
    const addPage = (item: { href: string; label: string; icon: unknown; featureKey?: string }) => {
      if (seen.has(item.href)) return;
      seen.add(item.href);
      list.push({
        id: item.href,
        label: t(item.label),
        group: pages,
        icon: item.icon as IconType,
        locked: locked(item.featureKey),
        run: () => go(item.href),
      });
    };
    PRIMARY_NAV_ITEMS.forEach((item) => addPage(item as never));
    PLANNING_NAV_GROUPS.forEach((group) => group.items.forEach((item) => addPage(item as never)));
    ACCOUNT_NAV_ITEMS.forEach((item) => addPage(item as never));
    if (user?.isAdmin) {
      // Admins get every admin page too (searchable as "ادمین …").
      const adminGroup = t("common.adminPanel");
      ADMIN_NAV_GROUPS.forEach((group) =>
        group.items.forEach((item) => {
          if (seen.has(item.href)) return;
          seen.add(item.href);
          list.push({
            id: item.href,
            label: t(item.label),
            group: adminGroup,
            icon: item.icon as IconType,
            keywords: `admin ادمین مدیریت ${t(group.title)}`,
            run: () => go(item.href),
          });
        }),
      );
    }
    return list;
  }, [go, isFeatureEnabled, loading, t, theme, toggleTheme, user?.isAdmin]);

  // Admins: typing a name or mobile also finds users (debounced, server-side).
  const [userHits, setUserHits] = useState<Command[]>([]);
  useEffect(() => {
    const q = query.trim();
    if (!open || !user?.isAdmin || q.length < 3) {
      setUserHits([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void adminApi
        .fetchUsers({ search: q, limit: 5 })
        .then((res) => {
          if (cancelled) return;
          setUserHits(
            res.items.map((row) => ({
              id: `user-${row._id}`,
              label: `${row.firstName} ${row.lastName}`.trim() || row.mobile,
              keywords: row.mobile,
              hint: row.mobile,
              group: t("common.commandUsers"),
              icon: Profile,
              run: () => go(PATHS.ADMIN_USER(row._id)),
            })),
          );
        })
        .catch(() => !cancelled && setUserHits([]));
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [go, open, query, t, user?.isAdmin]);

  // "۲۵۰ هزار خوراک ناهار" → pre-filled expense form (nothing is saved here).
  const quickEntry = useMemo<Command | null>(() => {
    const parsed = parseQuickEntry(query, (categories ?? []).filter((item) => !item.deleted));
    if (!parsed) return null;
    const amount = formatPriceForUser(parsed.amount, user?.preferences?.currency);
    const details = [parsed.categoryTitle, parsed.description].filter(Boolean).join(" · ");
    const params = new URLSearchParams({ type: parsed.type, price: String(parsed.amount) });
    if (parsed.categoryId) params.set("category", parsed.categoryId);
    if (parsed.description) params.set("description", parsed.description);
    return {
      id: "quick-entry",
      label: t(parsed.type === "0" ? "common.commandQuickIncome" : "common.commandQuickExpense", { amount }),
      group: t("common.commandQuickEntry"),
      icon: parsed.type === "0" ? MoneyRecive : MoneySend,
      hint: details || undefined,
      run: () => go(`${PATHS.CREATE_BUDGET}?${params.toString()}`),
    };
  }, [categories, go, query, t, user?.preferences?.currency]);

  const results = useMemo(() => {
    const q = normalize(query);
    return [
      ...(quickEntry ? [quickEntry] : []),
      ...commands
        .map((command) => ({ command, rank: score(command, q) }))
        .filter((row) => row.rank > 0)
        .sort((a, b) => b.rank - a.rank)
        .map((row) => row.command),
      ...userHits,
    ];
  }, [commands, query, quickEntry, userHits]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function onInputKey(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      results[active]?.run();
    }
  }

  let lastGroup = "";
  return (
    <AppModal open={open} onOpenChange={setOpen} placement="top" size="md">
      <Modal.Dialog className="pb-command overflow-hidden p-0 sm:max-w-xl" aria-label={t("common.commandTitle")}>
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <SearchNormal1 size={20} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKey}
            placeholder={t("common.commandPlaceholder")}
            aria-label={t("common.commandPlaceholder")}
            aria-controls="pb-command-list"
            aria-activedescendant={results[active] ? `pb-cmd-${results[active].id}` : undefined}
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
          />
          <kbd className="hidden rounded-md border border-border/70 px-1.5 py-0.5 text-[10px] text-muted sm:inline">Esc</kbd>
        </div>
        <ul
          id="pb-command-list"
          ref={listRef}
          role="listbox"
          className="max-h-[min(60dvh,420px)] overflow-y-auto overscroll-contain p-2"
        >
          {results.length === 0 ? (
            <li className="px-3 py-10 text-center text-sm text-muted">
              {t("common.commandEmpty")}
              <span className="mt-1.5 block text-xs opacity-80">{t("common.commandQuickHint")}</span>
            </li>
          ) : (
            results.map((command, index) => {
              const header = command.group !== lastGroup ? command.group : null;
              lastGroup = command.group;
              const Icon = command.icon;
              const selected = index === active;
              return (
                <li key={command.id} role="presentation">
                  {header ? (
                    <p className="px-3 pb-1 pt-3 text-[11px] font-semibold tracking-wide text-muted first:pt-1">{header}</p>
                  ) : null}
                  <button
                    id={`pb-cmd-${command.id}`}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    data-index={index}
                    onMouseMove={() => setActive(index)}
                    onClick={() => command.run()}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm transition-colors ${
                      selected ? "bg-accent/12 text-accent" : "text-foreground"
                    }`}
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                        selected ? "bg-accent/15" : "bg-surface-secondary"
                      }`}
                    >
                      <Icon size={17} variant={selected ? "Bold" : "Linear"} />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{command.label}</span>
                    {command.hint ? <span className="max-w-[45%] truncate text-xs text-muted" dir="auto">{command.hint}</span> : null}
                    {command.locked ? <Lock1 size={15} className="text-muted" /> : null}
                    {selected ? <span className="text-[11px] text-muted">↵</span> : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <div className="hidden items-center gap-4 border-t border-border/60 px-4 py-2 text-[11px] text-muted sm:flex">
          <span className="flex items-center gap-1">
            <ArrowUp size={12} />
            <ArrowDown size={12} />
            {t("common.commandNavigate")}
          </span>
          <span>↵ {t("common.commandOpen")}</span>
          <span className="ms-auto" dir="ltr">Ctrl / ⌘ + K</span>
        </div>
      </Modal.Dialog>
    </AppModal>
  );
}
