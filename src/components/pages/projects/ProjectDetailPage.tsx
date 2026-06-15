"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button, Switch } from "@heroui/react";
import { Add, Edit2, Task, Trash, TaskSquare, Wallet } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as projectsApi from "@/common/api/projects";
import type { IProjectDetail, IProjectItem, ProjectStatus as ProjectStatusType } from "@/common/interfaces/project.interface";
import { formatJalaliDate, formatPrice, formatCount, toEnglishDigits } from "@/common/utils";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { AttachBudgetButton } from "@/components/common/budget/AttachBudgetModal";
import { FormInput, FormPriceInput, FormSelect, FormTextArea } from "@/components/common/form/FormFields";
import { CreatePaymentPlanModal } from "@/components/pages/planning/CreatePaymentPlanModal";
import { BudgetType, ProjectItemType, ProjectStatus } from "@/types/enums";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { categoriesSelector, setCategories } from "@/stores/category";

type ProjectDetailPageProps = {
  /** اختیاری؛ در static export شناسه از useParams خوانده می‌شود. */
  projectId?: string;
};

type TabId = "overview" | "transactions" | "installments" | "notebook";

const STATUS_OPTIONS = [
  { id: ProjectStatus.ACTIVE, label: "فعال" },
  { id: ProjectStatus.ON_HOLD, label: "متوقف" },
  { id: ProjectStatus.COMPLETED, label: "تمام‌شده" },
];

function itemTypeLabel(type: IProjectItem["type"]) {
  return type === ProjectItemType.TASK ? "تسک" : "یادداشت";
}

export function ProjectDetailPage({ projectId: projectIdProp }: ProjectDetailPageProps) {
  const routeParams = useParams<{ id: string }>();
  const projectId = projectIdProp ?? routeParams.id;
  const router = useRouter();
  const dispatch = useAppDispatch();
  const categories = useAppSelector(categoriesSelector);
  const [data, setData] = useState<IProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [status, setStatus] = useState<ProjectStatusType>(ProjectStatus.ACTIVE);
  const [description, setDescription] = useState("");

  const [itemType, setItemType] = useState<ProjectItemType>(ProjectItemType.NOTE);
  const [itemContent, setItemContent] = useState("");
  const [itemSaving, setItemSaving] = useState(false);
  const [createPlanOpen, setCreatePlanOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await projectsApi.fetchProject(projectId);
      setData(detail);
      setTitle(detail.project.category?.title ?? "");
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
    if (!title.trim()) {
      showToast("نام پروژه الزامی است");
      return;
    }

    setSaving(true);
    try {
      const updated = await projectsApi.updateProject(projectId, {
        title: title.trim(),
        totalAmount: toEnglishDigits(totalAmount),
        status,
        description: description.trim(),
      });
      setData((current) =>
        current ? { ...current, project: { ...current.project, ...updated } } : current,
      );

      const categoryId = updated.category?._id;
      if (categoryId && categories) {
        dispatch(
          setCategories(
            categories.map((cat) =>
              cat._id === categoryId ? { ...cat, title: title.trim() } : cat,
            ),
          ),
        );
      }

      showToast("ذخیره شد", "success");
    } catch (err) {
      showErrorToast(err);
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
    setDeleting(true);
    try {
      await projectsApi.deleteProject(projectId);
      showToast("پروژه حذف شد", "success");
      router.push(PATHS.PROJECTS);
    } catch (err) {
      showErrorToast(err);
    } finally {
      setDeleting(false);
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">پروژه</p>
            <h1 className="mt-1 text-2xl font-bold">{title || project.category?.title}</h1>
          </div>
          <Link href={`${PATHS.TASKS}?projectId=${projectId}&duration=daily`}>
            <Button size="sm" variant="secondary">
              <TaskSquare size={16} />
              برنامه روزانه پروژه
            </Button>
          </Link>
        </div>
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
            { id: "installments" as const, label: "وام و اقساط" },
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
            label="نام پروژه"
            placeholder="مثلاً طراحی سایت شرکت X"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <FormPriceInput
            label="مبلغ کل قرارداد (تومان)"
            value={totalAmount}
            onChange={setTotalAmount}
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

          <div className="border-t border-border/50 pt-4">
            <Button
              className="w-full"
              size="lg"
              onPress={() => void saveOverview()}
              isPending={saving}
            >
              ذخیره تغییرات
            </Button>
          </div>

          <section className="rounded-2xl border border-dashed border-danger/35 bg-danger/5 p-4">
            <p className="text-sm font-medium text-danger">منطقه خطر</p>
            <p className="mt-1 text-xs leading-6 text-muted">
              با حذف پروژه، تراکنش‌های مرتبط با دسته این پروژه باقی می‌مانند؛ فقط
              دفترچه و آمار پروژه حذف می‌شود.
            </p>
            <Button
              className="mt-3"
              variant="danger"
              onPress={() => void removeProject()}
              isPending={deleting}
            >
              <Trash size={18} />
              حذف پروژه
            </Button>
          </section>
        </div>
      )}

      {tab === "transactions" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              {formatCount(data.budgets.length)} تراکنش مرتبط · در لیست اصلی هم نمایش داده می‌شوند
            </p>
            <div className="flex flex-wrap gap-2">
              <AttachBudgetButton
                title="افزودن از تراکنش‌ها"
                description="یک تراکنش قبلی را به این پروژه وصل کنید."
                context={{ type: "project", contextId: projectId }}
                onAttach={async (budgetId) => {
                  await projectsApi.attachProjectBudget(projectId, budgetId);
                  await load();
                }}
              />
              <Link href={PATHS.CREATE_BUDGET}>
                <Button size="sm" variant="secondary">
                  <Add size={16} />
                  تراکنش جدید
                </Button>
              </Link>
            </div>
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

      {tab === "installments" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              {formatCount(data.paymentPlans?.length ?? 0)} برنامه پرداخت مرتبط با این پروژه
            </p>
            <Button size="sm" onPress={() => setCreatePlanOpen(true)}>
              <Add size={16} />
              وام / قسط جدید
            </Button>
          </div>

          {(data.paymentPlans ?? []).length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
              هنوز برنامه پرداختی به این پروژه وصل نشده.
            </p>
          ) : (
            (data.paymentPlans ?? []).map((plan) => (
              <Link
                key={plan._id}
                href={`${PATHS.INSTALLMENTS}/${plan._id}`}
                className="glass flex items-center justify-between gap-3 rounded-2xl p-4 transition hover:border-accent/40"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{plan.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatPrice(plan.amount)} · روز {plan.dueDayOfMonth}
                    {plan.person ? ` · ${plan.person}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet size={18} className="text-accent" />
                  <span
                    className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                      plan.active ? "bg-income-soft text-income" : "bg-surface-secondary text-muted"
                    }`}
                  >
                    {plan.active ? "فعال" : "غیرفعال"}
                  </span>
                </div>
              </Link>
            ))
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

      <CreatePaymentPlanModal
        open={createPlanOpen}
        onOpenChange={setCreatePlanOpen}
        defaultProjectId={projectId}
        onCreated={() => {
          void load();
          setTab("installments");
        }}
      />
    </div>
  );
}
