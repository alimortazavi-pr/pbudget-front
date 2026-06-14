"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Switch } from "@heroui/react";
import { Add, Trash } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as projectsApi from "@/common/api/projects";
import type { IProjectDetail, IProjectItem, ProjectStatus as ProjectStatusType } from "@/common/interfaces/project.interface";
import { formatJalaliDate, formatPrice, toEnglishDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { FormInput, FormSelect, FormTextArea } from "@/components/common/form/FormFields";
import { BudgetType, ProjectItemType, ProjectStatus } from "@/types/enums";

type ProjectDetailPageProps = {
  projectId: string;
};

type TabId = "overview" | "transactions" | "notebook";

const STATUS_OPTIONS = [
  { id: ProjectStatus.ACTIVE, label: "فعال" },
  { id: ProjectStatus.ON_HOLD, label: "متوقف" },
  { id: ProjectStatus.COMPLETED, label: "تمام‌شده" },
];

function itemTypeLabel(type: IProjectItem["type"]) {
  return type === ProjectItemType.TASK ? "تسک" : "یادداشت";
}

export function ProjectDetailPage({ projectId }: ProjectDetailPageProps) {
  const router = useRouter();
  const [data, setData] = useState<IProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");
  const [saving, setSaving] = useState(false);

  const [totalAmount, setTotalAmount] = useState("");
  const [status, setStatus] = useState<ProjectStatusType>(ProjectStatus.ACTIVE);
  const [description, setDescription] = useState("");

  const [itemType, setItemType] = useState<ProjectItemType>(ProjectItemType.NOTE);
  const [itemContent, setItemContent] = useState("");
  const [itemSaving, setItemSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await projectsApi.fetchProject(projectId);
      setData(detail);
      setTotalAmount(String(detail.project.totalAmount));
      setStatus(detail.project.status);
      setDescription(detail.project.description ?? "");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = data?.project.stats;
  const notes = useMemo(
    () => (data?.items ?? []).filter((item) => item.type === ProjectItemType.NOTE),
    [data?.items],
  );
  const tasks = useMemo(
    () => (data?.items ?? []).filter((item) => item.type === ProjectItemType.TASK),
    [data?.items],
  );

  async function saveOverview() {
    if (!data) return;
    setSaving(true);
    try {
      const updated = await projectsApi.updateProject(projectId, {
        totalAmount: toEnglishDigits(totalAmount),
        status,
        description: description.trim(),
      });
      setData((current) =>
        current ? { ...current, project: { ...current.project, ...updated } } : current,
      );
      showToast("ذخیره شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setSaving(false);
    }
  }

  async function addItem() {
    if (!itemContent.trim()) {
      showToast("متن را وارد کنید");
      return;
    }
    setItemSaving(true);
    try {
      const item = await projectsApi.createProjectItem(projectId, {
        type: itemType,
        content: itemContent.trim(),
      });
      setData((current) =>
        current ? { ...current, items: [item, ...current.items] } : current,
      );
      setItemContent("");
      showToast("اضافه شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setItemSaving(false);
    }
  }

  async function toggleTask(item: IProjectItem) {
    try {
      const updated = await projectsApi.updateProjectItem(projectId, item._id, {
        done: !item.done,
      });
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((row) =>
                row._id === item._id ? updated : row,
              ),
            }
          : current,
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  async function removeItem(item: IProjectItem) {
    try {
      await projectsApi.deleteProjectItem(projectId, item._id);
      setData((current) =>
        current
          ? { ...current, items: current.items.filter((row) => row._id !== item._id) }
          : current,
      );
      showToast("حذف شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  async function removeProject() {
    if (!confirm("پروژه حذف شود؟ تراکنش‌ها باقی می‌مانند.")) return;
    try {
      await projectsApi.deleteProject(projectId);
      showToast("پروژه حذف شد", "success");
      router.push(PATHS.PROJECTS);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  if (loading || !data) {
    return (
      <div className="glass rounded-2xl p-10 text-center text-muted">در حال بارگذاری…</div>
    );
  }

  const project = data.project;
  const received = stats?.receivedAmount ?? 0;
  const spent = stats?.spentAmount ?? 0;
  const remaining = stats?.remainingAmount ?? 0;
  const profit = stats?.profitAmount ?? 0;
  const progress =
    project.totalAmount > 0 ? Math.min((received / project.totalAmount) * 100, 100) : 0;

  return (
    <div className="space-y-5 pb-6">
      <section className="glass rounded-3xl p-5">
        <p className="text-sm text-muted">پروژه</p>
        <h1 className="mt-1 text-2xl font-bold">{project.category?.title}</h1>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-surface-secondary p-3">
            <p className="text-xs text-muted">کل قرارداد</p>
            <p className="mt-1 font-bold">{formatPrice(project.totalAmount)}</p>
          </div>
          <div className="rounded-xl bg-income-soft/50 p-3">
            <p className="text-xs text-muted">دریافت‌شده</p>
            <p className="mt-1 font-bold text-income">{formatPrice(received)}</p>
          </div>
          <div className="rounded-xl bg-expense-soft/50 p-3">
            <p className="text-xs text-muted">باقی‌مانده</p>
            <p className="mt-1 font-bold text-expense">{formatPrice(remaining)}</p>
          </div>
          <div className="rounded-xl bg-surface-secondary p-3">
            <p className="text-xs text-muted">سود خالص</p>
            <p className={`mt-1 font-bold ${profit >= 0 ? "text-income" : "text-expense"}`}>
              {formatPrice(profit)}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>پیشرفت دریافت</span>
            <span>{Math.round(progress)}٪ · هزینه {formatPrice(spent)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto">
        {(
          [
            { id: "overview" as const, label: "تنظیمات" },
            { id: "transactions" as const, label: "تراکنش‌ها" },
            { id: "notebook" as const, label: "دفترچه و تسک‌ها" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`shrink-0 cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === item.id
                ? "bg-accent text-accent-foreground"
                : "bg-surface-secondary text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="glass space-y-4 rounded-2xl p-4">
          <FormInput
            label="مبلغ کل قرارداد (تومان)"
            inputMode="numeric"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
          />
          <FormSelect
            label="وضعیت"
            selectedKey={status}
            onSelectionChange={(key) => setStatus(key as ProjectStatusType)}
            options={STATUS_OPTIONS}
          />
          <FormTextArea
            label="توضیحات پروژه"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex flex-col gap-2 border-t border-border/50 pt-4">
            <Button onPress={() => void saveOverview()} isPending={saving}>
              ذخیره تغییرات
            </Button>
            <Button variant="danger" onPress={() => void removeProject()}>
              <Trash size={18} />
              حذف پروژه
            </Button>
          </div>
        </div>
      )}

      {tab === "transactions" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              {data.budgets.length} تراکنش مرتبط · در لیست اصلی هم نمایش داده می‌شوند
            </p>
            <Link href={PATHS.CREATE_BUDGET}>
              <Button size="sm" variant="secondary">
                <Add size={16} />
                تراکنش جدید
              </Button>
            </Link>
          </div>
          {data.budgets.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-muted">
              هنوز تراکنشی با دسته این پروژه ثبت نشده
            </div>
          ) : (
            data.budgets.map((budget) => {
              const isIncome = budget.type === BudgetType.INCOME;
              return (
                <Link
                  key={budget._id}
                  href={PATHS.BUDGET(budget._id)}
                  className="block glass rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {isIncome ? "دریافت" : "پرداخت"}
                        {budget.description ? ` · ${budget.description}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {formatJalaliDate(budget.year, budget.month, budget.day)}
                      </p>
                    </div>
                    <p
                      className={`font-bold ${isIncome ? "text-income" : "text-expense"}`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatPrice(budget.price)}
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      {tab === "notebook" && (
        <div className="space-y-4">
          <div className="glass space-y-4 rounded-2xl p-4">
            <div className="flex gap-2">
              {(
                [
                  { id: ProjectItemType.NOTE, label: "یادداشت" },
                  { id: ProjectItemType.TASK, label: "تسک" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setItemType(item.id)}
                  className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-medium ${
                    itemType === item.id
                      ? "bg-accent text-accent-foreground"
                      : "bg-surface-secondary text-muted"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <FormTextArea
              label={itemType === ProjectItemType.TASK ? "تسک جدید" : "یادداشت جدید"}
              placeholder={
                itemType === ProjectItemType.TASK
                  ? "مثلاً ارسال پیش‌فاکتور تا پنج‌شنبه"
                  : "یادداشت جلسه یا نکات ارائه…"
              }
              value={itemContent}
              onChange={(e) => setItemContent(e.target.value)}
            />
            <Button onPress={() => void addItem()} isPending={itemSaving}>
              <Add size={18} />
              افزودن
            </Button>
          </div>

          {tasks.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-muted">تسک‌ها</h3>
              {tasks.map((item) => (
                <article key={item._id} className="glass flex items-start gap-3 rounded-2xl p-4">
                  <Switch
                    isSelected={item.done}
                    onChange={() => void toggleTask(item)}
                    size="sm"
                    aria-label="انجام شد"
                  >
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm leading-7 ${
                        item.done ? "text-muted line-through" : ""
                      }`}
                    >
                      {item.content}
                    </p>
                  </div>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    onPress={() => void removeItem(item)}
                  >
                    <Trash size={16} />
                  </Button>
                </article>
              ))}
            </section>
          )}

          {notes.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-muted">یادداشت‌ها</h3>
              {notes.map((item) => (
                <article key={item._id} className="glass rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm leading-7 whitespace-pre-wrap">{item.content}</p>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      onPress={() => void removeItem(item)}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted">{itemTypeLabel(item.type)}</p>
                </article>
              ))}
            </section>
          )}

          {notes.length === 0 && tasks.length === 0 && (
            <div className="glass rounded-2xl p-8 text-center text-muted">
              دفترچه خالی است — یادداشت جلسه یا تسک بعدی را اینجا بنویسید
            </div>
          )}
        </div>
      )}
    </div>
  );
}
