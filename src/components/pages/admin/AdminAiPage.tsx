"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input, ProgressBar, Switch, Tabs, TextArea } from "@heroui/react";
import { Activity, Flash, Magicpen, People, Refresh2, SearchNormal1, TickCircle, Timer1, Warning2 } from "iconsax-reactjs";

import * as aiApi from "@/common/api/ai";
import type { AiAdminPlans, AiAdminUser, AiModelCatalog, AiModelOption, AiSettings, AiStats, AiTestResult } from "@/common/interfaces/ai.interface";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { AppSelect } from "@/components/common/form/AppControls";
import { AiRichText } from "@/components/pages/ai/AiRichText";
import { AdminPageHeader, AdminPanel, EmptyState, Field, Pill, SkeletonRows, StatTile } from "./ui/AdminUi";
import { formatNumberFa } from "./ui/admin-format";

const SPEED_LABEL = { fast: "سریع", medium: "متوسط", slow: "کند" } as const;
const NONE = "__none__";
const TEMPERATURE_PRESETS = [
  { value: 0.3, label: "دقیق" },
  { value: 0.6, label: "متعادل" },
  { value: 1, label: "خلاق" },
];

function modelLabel(option: AiModelOption) {
  // Isolate the Latin name so the Persian part cannot reorder it in the RTL menu.
  const limits = option.freeRpd != null ? ` — ${formatNumberFa(option.freeRpd)} در روز رایگان` : "";
  return `\u2066${option.label}\u2069${limits}`;
}

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

// ---- overview ----------------------------------------------------------------

function DayBars({ days }: { days: AiStats["byDay"] }) {
  const max = Math.max(1, ...days.map((day) => day.ok + day.failed));
  if (days.length === 0) return <EmptyState title="هنوز درخواستی ثبت نشده" />;
  return (
    <div className="flex h-40 items-end justify-start gap-1.5" role="img" aria-label="درخواست‌های روزانه">
      {days.map((day) => {
        const total = day.ok + day.failed;
        return (
          <div key={day.day} className="group relative flex h-full min-w-0 max-w-14 flex-1 flex-col justify-end">
            <div className="flex w-full flex-col justify-end overflow-hidden rounded-t-md" style={{ height: `${(total / max) * 100}%` }}>
              {day.failed > 0 ? <div className="bg-danger/70" style={{ height: `${(day.failed / total) * 100}%` }} /> : null}
              <div className="flex-1 bg-accent" />
            </div>
            <span className="pointer-events-none absolute -top-9 start-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-[11px] text-background group-hover:block">
              {day.day.slice(5)} · {formatNumberFa(day.ok)} موفق · {formatNumberFa(day.failed)} ناموفق
            </span>
          </div>
        );
      })}
    </div>
  );
}

function OverviewTab({ stats, loading }: { stats: AiStats | null; loading: boolean }) {
  if (loading && !stats) return <SkeletonRows rows={6} />;
  if (!stats) return <EmptyState title="آمار در دسترس نیست" />;
  const { totals } = stats;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={`درخواست‌ها (${formatNumberFa(stats.rangeDays)} روز)`} value={totals.requests} icon={<Activity size={20} />} />
        <StatTile
          label="نرخ موفقیت"
          value={`${formatNumberFa(percent(totals.ok, totals.requests))}٪`}
          hint={`${formatNumberFa(totals.failed)} ناموفق`}
          tone={totals.failed > totals.ok * 0.2 ? "warning" : "success"}
          icon={<TickCircle size={20} />}
        />
        <StatTile label="میانگین تأخیر" value={`${formatNumberFa(Math.round(totals.avgLatencyMs / 100) / 10)} ث`} tone="info" icon={<Timer1 size={20} />} />
        <StatTile label="کاربران فعال" value={totals.activeUsers} tone="accent" icon={<People size={20} />} />
      </div>

      <AdminPanel title="درخواست‌ها در روز" description="سبز/رنگ اصلی = موفق، قرمز = ناموفق (شامل خطای سهمیه و fallback)">
        <DayBars days={stats.byDay} />
      </AdminPanel>

      <AdminPanel title="مصرف هر مدل" description="ستون «۲۴ ساعت اخیر» با سقف رایگان روزانهٔ Google مقایسه می‌شود (سهمیهٔ رایگان به‌ازای هر مدل جداست).">
        {stats.byModel.length === 0 ? (
          <EmptyState title="هنوز از هیچ مدلی استفاده نشده" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-start text-xs text-muted">
                  <th className="px-2 py-2 text-start font-medium">مدل</th>
                  <th className="px-2 py-2 text-start font-medium">درخواست</th>
                  <th className="px-2 py-2 text-start font-medium">موفق</th>
                  <th className="px-2 py-2 text-start font-medium">fallback</th>
                  <th className="px-2 py-2 text-start font-medium">خطای ۴۲۹</th>
                  <th className="px-2 py-2 text-start font-medium">تأخیر</th>
                  <th className="px-2 py-2 text-start font-medium">توکن</th>
                  <th className="w-44 px-2 py-2 text-start font-medium">۲۴ ساعت اخیر / سقف روزانه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {stats.byModel.map((row) => (
                  <tr key={row.model}>
                    <td className="px-2 py-3 font-semibold" dir="ltr">
                      {row.label}
                    </td>
                    <td className="px-2 py-3 tabular-nums">{formatNumberFa(row.calls)}</td>
                    <td className="px-2 py-3 tabular-nums">{formatNumberFa(percent(row.ok, row.calls))}٪</td>
                    <td className="px-2 py-3 tabular-nums">{formatNumberFa(row.fallbackCalls)}</td>
                    <td className="px-2 py-3 tabular-nums">{row.rateLimited ? <Pill tone="warning">{formatNumberFa(row.rateLimited)}</Pill> : "—"}</td>
                    <td className="px-2 py-3 tabular-nums">{formatNumberFa(Math.round(row.avgLatencyMs / 100) / 10)} ث</td>
                    <td className="px-2 py-3 tabular-nums">{formatNumberFa(row.promptTokens + row.outputTokens)}</td>
                    <td className="px-2 py-3">
                      {row.freeRpd ? (
                        <ProgressBar
                          aria-label={`${row.label} ۲۴ ساعت اخیر`}
                          value={Math.min(100, (row.last24h / row.freeRpd) * 100)}
                          color={row.last24h / row.freeRpd > 0.85 ? "danger" : row.last24h / row.freeRpd > 0.6 ? "warning" : "accent"}
                        >
                          <div className="mb-1 text-xs tabular-nums text-muted">
                            {formatNumberFa(row.last24h)} / {formatNumberFa(row.freeRpd)}
                          </div>
                          <ProgressBar.Track>
                            <ProgressBar.Fill />
                          </ProgressBar.Track>
                        </ProgressBar>
                      ) : (
                        <span className="text-xs text-muted">{formatNumberFa(row.last24h)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      <AdminPanel title="پرمصرف‌ترین کاربران">
        {stats.topUsers.length === 0 ? (
          <EmptyState title="هنوز کاربری از AI استفاده نکرده" />
        ) : (
          <ul className="divide-y divide-border/50">
            {stats.topUsers.map((user, index) => (
              <li key={`${user.mobile}-${index}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-muted" dir="ltr">
                  {user.mobile}
                </span>
                <Pill tone="accent">{formatNumberFa(user.requests)} درخواست</Pill>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}

// ---- settings ----------------------------------------------------------------

function ModelInfo({ option }: { option?: AiModelOption }) {
  if (!option) return null;
  return (
    <div className="mt-2 rounded-xl bg-surface-secondary px-3 py-2 text-xs leading-6 text-muted">
      {option.speed ? <Pill tone={option.speed === "fast" ? "success" : option.speed === "slow" ? "warning" : "neutral"}>{SPEED_LABEL[option.speed]}</Pill> : null}{" "}
      {option.freeRpd != null ? (
        <span>
          سقف رایگان: {formatNumberFa(option.freeRpm ?? 0)} درخواست/دقیقه · {formatNumberFa(option.freeRpd)} درخواست/روز · {formatNumberFa(option.freeTpm ?? 0)} توکن/دقیقه
        </span>
      ) : null}
      {option.note ? <p>{option.note}</p> : null}
      {option.available === false ? <p className="font-semibold text-danger">این مدل در لیست زندهٔ Google نیست.</p> : null}
    </div>
  );
}

function SettingsTab({ catalog, initial, onSaved }: { catalog: AiModelCatalog | null; initial: AiSettings; onSaved: (settings: AiSettings) => void }) {
  const [form, setForm] = useState<AiSettings>(initial);
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(initial), [initial]);

  const options = useMemo(() => {
    const recommended = (catalog?.recommended ?? []).map((item) => ({ value: item.id, label: modelLabel(item) }));
    const others = (catalog?.others ?? []).map((item) => ({ value: item.id, label: `${item.label} (${item.id})` }));
    // Keep the saved choices selectable even if they dropped out of both lists.
    const known = new Set([...recommended, ...others].map((item) => item.value));
    const extra = [form.chatModel, form.insightsModel, ...form.fallbackModels]
      .filter((id) => id && !known.has(id))
      .map((id) => ({ value: id, label: id }));
    return [...recommended, ...others, ...extra];
  }, [catalog, form.chatModel, form.insightsModel, form.fallbackModels]);
  const byId = useMemo(() => new Map([...(catalog?.recommended ?? []), ...(catalog?.others ?? [])].map((item) => [item.id, item])), [catalog]);

  function setFallback(index: number, value: string) {
    const next = [...form.fallbackModels];
    if (value === NONE) next.splice(index, 1);
    else next[index] = value;
    setForm({ ...form, fallbackModels: next.filter(Boolean) });
  }

  async function save() {
    setSaving(true);
    try {
      const saved = await aiApi.updateAdminAiSettings(form);
      onSaved(saved);
      showToast("تنظیمات هوش مصنوعی ذخیره شد", "success");
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  const fallbackSlots = [0, 1, 2, 3];
  return (
    <div className="space-y-5">
      <AdminPanel
        title="وضعیت کلی"
        actions={
          <Switch isSelected={form.enabled} onChange={(enabled) => setForm({ ...form, enabled })} aria-label="فعال بودن هوش مصنوعی">
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
        }
        description="با غیرفعال‌کردن، همهٔ کاربران پیام «در دسترس نیست» می‌بینند و هیچ درخواستی به Google نمی‌رود."
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Pill tone={catalog?.keyConfigured ? "success" : "danger"}>{catalog?.keyConfigured ? "کلید Gemini روی سرور تنظیم است" : "کلید Gemini تنظیم نشده (GEMINI_API_KEY)"}</Pill>
          <Pill tone={catalog?.liveListLoaded ? "success" : "warning"}>{catalog?.liveListLoaded ? "لیست زندهٔ مدل‌ها بارگذاری شد" : "لیست زنده در دسترس نیست؛ فهرست پیشنهادی نمایش داده می‌شود"}</Pill>
        </div>
      </AdminPanel>

      <AdminPanel title="مدل‌ها" description="مدل اصلی هر کاربرد و زنجیرهٔ پشتیبان؛ اگر مدل اصلی سقف رایگان را پر کند یا خطا بدهد، به ترتیب مدل بعدی امتحان می‌شود و از سهمیهٔ کاربر چیزی کم نمی‌شود.">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Field label="مدل گفتگو (دستیار)">
              <AppSelect ariaLabel="مدل گفتگو" value={form.chatModel} onChange={(chatModel) => setForm({ ...form, chatModel })} options={options} />
            </Field>
            <ModelInfo option={byId.get(form.chatModel)} />
          </div>
          <div>
            <Field label="مدل تحلیل هوشمند">
              <AppSelect ariaLabel="مدل تحلیل" value={form.insightsModel} onChange={(insightsModel) => setForm({ ...form, insightsModel })} options={options} />
            </Field>
            <ModelInfo option={byId.get(form.insightsModel)} />
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {fallbackSlots.map((index) => {
            const value = form.fallbackModels[index];
            const disabled = index > form.fallbackModels.length;
            return (
              <Field key={index} label={`پشتیبان ${formatNumberFa(index + 1)}`}>
                <AppSelect
                  ariaLabel={`پشتیبان ${index + 1}`}
                  value={value ?? NONE}
                  isDisabled={disabled}
                  onChange={(next) => setFallback(index, next)}
                  options={[{ value: NONE, label: "— بدون پشتیبان —" }, ...options]}
                />
              </Field>
            );
          })}
        </div>
      </AdminPanel>

      <AdminPanel title="کیفیت و محدودیت‌ها">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="سبک پاسخ‌دهی" hint={`کمتر = دقیق‌تر و یکنواخت‌تر؛ برای تحلیل مالی «دقیق» یا «متعادل» مناسب است. مقدار فعلی: ${formatNumberFa(form.temperature)}`}>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="سبک پاسخ‌دهی">
              {TEMPERATURE_PRESETS.map((preset) => (
                <Button key={preset.value} size="sm" variant={Math.abs(form.temperature - preset.value) < 0.05 ? "primary" : "secondary"} onPress={() => setForm({ ...form, temperature: preset.value })}>
                  {preset.label}
                </Button>
              ))}
            </div>
          </Field>
          <Field label="حداکثر توکن خروجی" hint="سقف طول هر پاسخ؛ ۲۰۴۸ برای بیشتر پاسخ‌ها کافی است.">
            <Input
              variant="secondary"
              type="number"
              min={256}
              max={8192}
              value={String(form.maxOutputTokens)}
              onChange={(event) => setForm({ ...form, maxOutputTokens: Number(event.target.value) || 2048 })}
            />
          </Field>
          <Field label="سهمیهٔ روزانهٔ پیش‌فرض هر کاربر" hint="فقط وقتی پلن کاربر سقف AI نداشته باشد استفاده می‌شود. سقف هر پلن و هر کاربر از تب «سهمیه و دسترسی» تنظیم می‌شود.">
            <Input
              variant="secondary"
              type="number"
              min={1}
              max={1000}
              value={String(form.defaultDailyLimit)}
              onChange={(event) => setForm({ ...form, defaultDailyLimit: Number(event.target.value) || 30 })}
            />
          </Field>
          <Field label="تعداد پیام‌های قبلی در گفتگو" hint="هرچه بیشتر، دستیار زمینهٔ بیشتری دارد ولی توکن بیشتری مصرف می‌شود.">
            <Input
              variant="secondary"
              type="number"
              min={0}
              max={30}
              value={String(form.chatHistoryLimit)}
              onChange={(event) => setForm({ ...form, chatHistoryLimit: Math.min(30, Math.max(0, Number(event.target.value) || 0)) })}
            />
          </Field>
          <Field label="مدت نگه‌داری نتیجهٔ تحلیل (ساعت)" hint="تحلیل تکراری با داده‌های یکسان از کش داده می‌شود و از سهمیه کم نمی‌کند. ۰ = بدون کش.">
            <Input
              variant="secondary"
              type="number"
              min={0}
              max={72}
              value={String(form.insightsCacheHours)}
              onChange={(event) => setForm({ ...form, insightsCacheHours: Math.min(72, Math.max(0, Number(event.target.value) || 0)) })}
            />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="دستور تکمیلی برای دستیار (اختیاری)" hint="به پرامپت سیستم دستیار و تحلیل اضافه می‌شود؛ مثلاً لحن یا قوانین ویژه. قوانین ایمنی پایه همیشه فعال می‌مانند.">
            <TextArea
              variant="secondary"
              rows={3}
              className="w-full"
              maxLength={2000}
              value={form.systemPromptExtra}
              onChange={(event) => setForm({ ...form, systemPromptExtra: event.target.value })}
            />
          </Field>
        </div>
      </AdminPanel>

      <div className="flex justify-end">
        <Button isPending={saving} onPress={() => void save()}>
          <Flash size={18} variant="Bold" />
          ذخیرهٔ تنظیمات
        </Button>
      </div>
    </div>
  );
}

// ---- quota -------------------------------------------------------------------

function PlanQuotaRow({ plan, onSaved }: { plan: AiAdminPlans["plans"][number]; onSaved: () => void }) {
  const [enabled, setEnabled] = useState(plan.enabled);
  const [limit, setLimit] = useState(String(plan.limit ?? ""));
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setEnabled(plan.enabled);
    setLimit(String(plan.limit ?? ""));
  }, [plan]);
  const parsed = Number(limit);
  const valid = Number.isInteger(parsed) && parsed >= 1 && parsed <= 2000;
  const dirty = enabled !== plan.enabled || parsed !== (plan.limit ?? NaN);

  async function save() {
    setSaving(true);
    try {
      await aiApi.updateAdminAiPlan(plan.id, { enabled, limit: parsed });
      showToast(`سهمیهٔ پلن «${plan.name}» ذخیره شد`, "success");
      onSaved();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="grid items-center gap-3 py-3 sm:grid-cols-[1fr_auto_9rem_auto]">
      <div className="min-w-0">
        <p className="font-semibold">{plan.name}</p>
        <p className="text-xs text-muted">
          {plan.price > 0 ? `${formatNumberFa(plan.price)} ${plan.priceUnit}` : "رایگان"}
          {plan.active ? "" : " · غیرفعال"}
        </p>
      </div>
      <Switch isSelected={enabled} onChange={setEnabled} aria-label={`دسترسی AI برای ${plan.name}`}>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Content>{enabled ? "فعال" : "غیرفعال"}</Switch.Content>
      </Switch>
      <Input
        variant="secondary"
        type="number"
        min={1}
        max={2000}
        aria-label={`سقف روزانهٔ ${plan.name}`}
        value={limit}
        disabled={!enabled}
        onChange={(event) => setLimit(event.target.value)}
      />
      <Button size="sm" isDisabled={!dirty || (enabled && !valid)} isPending={saving} onPress={() => void save()}>
        ذخیره
      </Button>
    </li>
  );
}

function UserQuotaCard({ user, onSaved }: { user: AiAdminUser; onSaved: (user: AiAdminUser) => void }) {
  const [override, setOverride] = useState(user.override === null ? "" : String(user.override));
  const [blocked, setBlocked] = useState(user.blocked);
  const [saving, setSaving] = useState(false);
  const parsed = override.trim() === "" ? null : Number(override);
  const valid = parsed === null || (Number.isInteger(parsed) && parsed >= 0 && parsed <= 2000);
  const dirty = parsed !== user.override || blocked !== user.blocked;

  async function save() {
    setSaving(true);
    try {
      const saved = await aiApi.updateAdminAiUser(user.userId, { dailyLimit: parsed, blocked });
      onSaved(saved);
      showToast("محدودیت کاربر ذخیره شد", "success");
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="space-y-3 rounded-2xl border border-border/60 bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{user.name || "—"}</p>
          <p className="text-xs text-muted" dir="ltr">
            {user.mobile}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Pill tone={user.hasAccess ? "success" : "neutral"}>{user.hasAccess ? "پلن دارای AI" : "پلن بدون AI"}</Pill>
          <Pill tone="info">
            امروز {formatNumberFa(user.usedToday)} از {formatNumberFa(user.effectiveLimit)}
          </Pill>
        </div>
      </div>
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Field label="سقف روزانهٔ اختصاصی" hint={`خالی = طبق پلن (${formatNumberFa(user.planLimit)} در روز). ۰ = بدون دسترسی.`}>
          <Input variant="secondary" type="number" min={0} max={2000} value={override} onChange={(event) => setOverride(event.target.value)} placeholder={String(user.planLimit)} />
        </Field>
        <Switch isSelected={blocked} onChange={setBlocked} aria-label="مسدودسازی AI">
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Content>مسدود</Switch.Content>
        </Switch>
        <Button size="sm" isDisabled={!dirty || !valid} isPending={saving} onPress={() => void save()}>
          ذخیره
        </Button>
      </div>
    </li>
  );
}

function QuotaTab({ defaultLimit }: { defaultLimit: number }) {
  const [plans, setPlans] = useState<AiAdminPlans | null>(null);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AiAdminUser[] | null>(null);
  const [searching, setSearching] = useState(false);

  const loadPlans = useCallback(async () => {
    try {
      setPlans(await aiApi.fetchAdminAiPlans());
    } catch (error) {
      showErrorToast(error);
    }
  }, []);
  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  async function search() {
    setSearching(true);
    try {
      setUsers(await aiApi.searchAdminAiUsers(query.trim()));
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-5">
      <AdminPanel
        title="سهمیهٔ روزانهٔ هر پلن"
        description={`تعداد درخواست AI که هر کاربر در روز (بر اساس تقویم تهران) می‌تواند بزند. پلنی که غیرفعال باشد، صفحهٔ AI را به کاربرانش نشان نمی‌دهد. پیش‌فرض عمومی: ${formatNumberFa(defaultLimit)} در روز.`}
      >
        {!plans ? (
          <SkeletonRows rows={4} />
        ) : (
          <ul className="divide-y divide-border/50">
            {plans.plans.map((plan) => (
              <PlanQuotaRow key={plan.id} plan={plan} onSaved={() => void loadPlans()} />
            ))}
          </ul>
        )}
      </AdminPanel>

      <AdminPanel title="محدودیت هر کاربر" description="برای یک کاربر خاص سقف روزانهٔ جداگانه بگذارید یا دسترسی‌اش را ببندید. اولویت: مسدود ← سقف اختصاصی ← سقف پلن.">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void search();
          }}
        >
          <Input variant="secondary" className="flex-1" aria-label="جست‌وجوی کاربر" placeholder="شماره موبایل یا نام کاربر…" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button type="submit" isPending={searching}>
            <SearchNormal1 size={16} />
            جست‌وجو
          </Button>
        </form>
        <div className="mt-4">
          {users === null ? (
            <p className="text-sm text-muted">برای دیدن مصرف و تنظیم محدودیت، کاربر را جست‌وجو کنید.</p>
          ) : users.length === 0 ? (
            <EmptyState title="کاربری پیدا نشد" />
          ) : (
            <ul className="space-y-3">
              {users.map((user) => (
                <UserQuotaCard key={user.userId} user={user} onSaved={(saved) => setUsers((list) => (list ?? []).map((item) => (item.userId === saved.userId ? saved : item)))} />
              ))}
            </ul>
          )}
        </div>
      </AdminPanel>
    </div>
  );
}

// ---- test lab -----------------------------------------------------------------

function TestTab({ catalog, defaultModel }: { catalog: AiModelCatalog | null; defaultModel: string }) {
  const [model, setModel] = useState(defaultModel);
  const [prompt, setPrompt] = useState("درآمد ماهانه‌ام ۵۰ میلیون و هزینه‌ام ۴۵ میلیون تومان است. سه توصیهٔ کوتاه برای پس‌انداز بده.");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AiTestResult | null>(null);
  useEffect(() => setModel(defaultModel), [defaultModel]);

  const options = [...(catalog?.recommended ?? []), ...(catalog?.others ?? [])].map((item) => ({ value: item.id, label: item.label }));
  if (model && !options.some((item) => item.value === model)) options.push({ value: model, label: model });

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      setResult(await aiApi.testAdminAiModel(model, prompt));
    } catch (error) {
      showErrorToast(error);
    } finally {
      setRunning(false);
    }
  }

  return (
    <AdminPanel title="آزمایشگاه مدل" description="هر مدل را مستقیم امتحان کنید (سرعت، کیفیت فارسی، خطا). از سهمیهٔ هیچ کاربری کم نمی‌شود، ولی از سقف رایگان Google همان مدل مصرف می‌کند.">
      <div className="space-y-4">
        <Field label="مدل">
          <AppSelect ariaLabel="مدل آزمایش" value={model} onChange={setModel} options={options} />
        </Field>
        <Field label="پرامپت">
          <TextArea variant="secondary" rows={4} className="w-full" maxLength={2000} value={prompt} onChange={(event) => setPrompt(event.target.value)} />
        </Field>
        <Button isPending={running} isDisabled={!prompt.trim() || !model} onPress={() => void run()}>
          <Magicpen size={18} variant="Bold" />
          اجرا
        </Button>
        {result ? (
          result.ok ? (
            <div className="space-y-2 rounded-2xl border border-success/40 bg-success/8 p-4">
              <div className="flex flex-wrap gap-2 text-xs">
                <Pill tone="success">موفق</Pill>
                <Pill>{formatNumberFa(Math.round(result.latencyMs / 100) / 10)} ثانیه</Pill>
                <Pill>{formatNumberFa(result.promptTokens)} توکن ورودی</Pill>
                <Pill>{formatNumberFa(result.outputTokens)} توکن خروجی</Pill>
              </div>
              <AiRichText text={result.text} className="text-sm" />
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-2xl border border-danger/40 bg-danger/8 p-4 text-sm">
              <Warning2 size={20} className="mt-0.5 shrink-0 text-danger" variant="Bold" />
              <div>
                <p className="font-semibold">خطا {result.status ? `(${result.status})` : ""}</p>
                <p className="mt-1 text-muted">{result.error}</p>
              </div>
            </div>
          )
        ) : null}
      </div>
    </AdminPanel>
  );
}

// ---- page ---------------------------------------------------------------------

export function AdminAiPage() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState<AiStats | null>(null);
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [catalog, setCatalog] = useState<AiModelCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("14");

  const load = useCallback(async () => {
    setLoading(true);
    const [statsResult, settingsResult, catalogResult] = await Promise.allSettled([
      aiApi.fetchAdminAiStats(Number(days)),
      aiApi.fetchAdminAiSettings(),
      aiApi.fetchAdminAiModels(),
    ]);
    if (statsResult.status === "fulfilled") setStats(statsResult.value);
    if (settingsResult.status === "fulfilled") setSettings(settingsResult.value);
    if (catalogResult.status === "fulfilled") setCatalog(catalogResult.value);
    if ([statsResult, settingsResult, catalogResult].some((item) => item.status === "rejected")) {
      showErrorToast((statsResult.status === "rejected" ? statsResult : settingsResult.status === "rejected" ? settingsResult : (catalogResult as PromiseRejectedResult)).reason);
    }
    setLoading(false);
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="هوش مصنوعی"
        description="مدیریت مدل‌های Gemini/Gemma، محدودیت‌ها، مصرف و آزمایش مدل‌ها. سهمیهٔ روزانه را برای هر پلن و هر کاربر از تب «سهمیه و دسترسی» تنظیم کنید."
        icon={<Magicpen size={22} variant="Bold" />}
        actions={
          <>
            <AppSelect
              ariaLabel="بازهٔ آمار"
              className="w-36"
              value={days}
              onChange={setDays}
              options={[
                { value: "7", label: "۷ روز اخیر" },
                { value: "14", label: "۱۴ روز اخیر" },
                { value: "30", label: "۳۰ روز اخیر" },
              ]}
            />
            <Button variant="secondary" size="sm" onPress={() => void load()} isPending={loading}>
              <Refresh2 size={16} />
              بروزرسانی
            </Button>
          </>
        }
      />

      <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(String(key))}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="هوش مصنوعی">
            <Tabs.Tab id="overview">
              نمای کلی
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="quota">
              سهمیه و دسترسی
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="settings">
              مدل‌ها و تنظیمات
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="lab">
              آزمایشگاه
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id="overview" className="pt-4">
          <OverviewTab stats={stats} loading={loading} />
        </Tabs.Panel>
        <Tabs.Panel id="quota" className="pt-4">
          <QuotaTab defaultLimit={settings?.defaultDailyLimit ?? 30} />
        </Tabs.Panel>
        <Tabs.Panel id="settings" className="pt-4">
          {settings ? <SettingsTab catalog={catalog} initial={settings} onSaved={setSettings} /> : <SkeletonRows rows={6} />}
        </Tabs.Panel>
        <Tabs.Panel id="lab" className="pt-4">
          <TestTab catalog={catalog} defaultModel={settings?.chatModel ?? "gemini-3.5-flash-lite"} />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
