"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useState } from "react";
import { Button, Modal, Switch } from "@heroui/react";
import { Edit2, SearchNormal1, Trash } from "iconsax-reactjs";

import * as adminApi from "@/common/api/admin";
import type {
  AdminBudgetItem,
  AdminCategoryItem,
  AdminProjectItem,
} from "@/common/interfaces/admin";
import { formatPrice, toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";

type ContentTab = "budgets" | "categories" | "projects";

export function AdminContentPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<ContentTab>("budgets");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<AdminBudgetItem[]>([]);
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [projects, setProjects] = useState<AdminProjectItem[]>([]);
  const [editingBudget, setEditingBudget] = useState<AdminBudgetItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryItem | null>(null);
  const [editingProject, setEditingProject] = useState<AdminProjectItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "budgets") {
        const data = await adminApi.fetchAdminBudgets({
          page,
          search,
          includeDeleted,
        });
        setBudgets(data.items);
        setTotalPages(data.pagination.totalPages);
      } else if (tab === "categories") {
        const data = await adminApi.fetchAdminCategories({
          page,
          search,
          includeDeleted,
        });
        setCategories(data.items);
        setTotalPages(data.pagination.totalPages);
      } else {
        const data = await adminApi.fetchAdminProjects({
          page,
          search,
          includeDeleted,
        });
        setProjects(data.items);
        setTotalPages(data.pagination.totalPages);
      }
    } catch {
      showToast(t("admin.contentLoadFailed"), "danger");
    } finally {
      setLoading(false);
    }
  }, [tab, page, search, includeDeleted]);

  useEffect(() => {
    void load();
  }, [load]);

  const tabs: { id: ContentTab; label: string }[] = [
    { id: "budgets", label: t("auto.k4ad10a7f11") },
    { id: "categories", label: t("nav.categories") },
    { id: "projects", label: t("nav.projects") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-bold">{t("admin.contentManagement")}</h3>
          <p className="text-sm text-muted">
            {t("auto.k209ddef389")}
          </p>
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(searchInput.trim());
          }}
        >
          <div className="relative min-w-[220px]">
            <SearchNormal1
              size={18}
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("common.searchEllipsis")}
              className="w-full rounded-xl border border-border bg-surface px-10 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <Button type="submit" variant="secondary">
            {t("common.search")}
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              setPage(1);
            }}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              tab === item.id
                ? "bg-accent text-accent-foreground"
                : "bg-surface-secondary text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-muted">
        <Switch
          isSelected={includeDeleted}
          onChange={(selected) => {
            setIncludeDeleted(selected);
            setPage(1);
          }}
          size="sm"
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
        {t("auto.k5df4a8193a")}
      </label>

      {tab === "budgets" && (
        <ContentTable
          loading={loading}
          isEmpty={budgets.length === 0}
          emptyMessage={t("auto.k22a5c47aec")}
          headers={[t("auto.k883da9f030"), t("common.amount"), t("auto.kab0eb5e9a1"), t("common.date"), t("auto.k0f0dff2dfc")]}
        >
          {budgets.map((item) => (
            <tr key={item._id} className="border-t border-border/50">
              <td className="px-4 py-3">
                {item.user
                  ? `${item.user.firstName} ${item.user.lastName}`
                  : "—"}
              </td>
              <td className="px-4 py-3">{formatPrice(item.price)} {t("common.toman")}</td>
              <td className="px-4 py-3">
                {item.type === 0 ? t("common.income") : t("common.expense")}
              </td>
              <td className="px-4 py-3 text-xs text-muted">
                {toPersianDigits(`${item.year}/${item.month}/${item.day}`)}
              </td>
              <td className="px-4 py-3">
                <RowActions
                  onEdit={() => setEditingBudget(item)}
                  onToggleDelete={async () => {
                    await adminApi.updateAdminBudget(item._id, {
                      deleted: !item.deleted,
                    });
                    showToast(t("common.updated"), "success");
                    void load();
                  }}
                />
              </td>
            </tr>
          ))}
        </ContentTable>
      )}

      {tab === "categories" && (
        <ContentTable
          loading={loading}
          isEmpty={categories.length === 0}
          emptyMessage={t("common.noCategoryFound")}
          headers={[t("auto.k883da9f030"), t("common.title"), t("common.monthlyLimit"), t("auto.k0f0dff2dfc")]}
        >
          {categories.map((item) => (
            <tr key={item._id} className="border-t border-border/50">
              <td className="px-4 py-3">
                {item.user
                  ? `${item.user.firstName} ${item.user.lastName}`
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <span
                  className="inline-flex items-center gap-2"
                  style={{ color: item.color || undefined }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: item.color || "#ccc" }}
                  />
                  {item.title}
                </span>
              </td>
              <td className="px-4 py-3">
                {item.monthlyLimit
                  ? `${formatPrice(item.monthlyLimit)} ${t("common.toman")}`
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <RowActions
                  onEdit={() => setEditingCategory(item)}
                  onToggleDelete={async () => {
                    await adminApi.updateAdminCategory(item._id, {
                      deleted: !item.deleted,
                    });
                    showToast(t("common.updated"), "success");
                    void load();
                  }}
                />
              </td>
            </tr>
          ))}
        </ContentTable>
      )}

      {tab === "projects" && (
        <ContentTable
          loading={loading}
          isEmpty={projects.length === 0}
          emptyMessage={t("auto.k736afc81c1")}
          headers={[t("auto.k883da9f030"), t("common.description"), t("common.amount"), t("auto.k0f0dff2dfc")]}
        >
          {projects.map((item) => (
            <tr key={item._id} className="border-t border-border/50">
              <td className="px-4 py-3">
                {item.user
                  ? `${item.user.firstName} ${item.user.lastName}`
                  : "—"}
              </td>
              <td className="px-4 py-3 max-w-xs truncate">
                {item.description || "—"}
              </td>
              <td className="px-4 py-3">
                {formatPrice(item.totalAmount)} {t("common.toman")}
              </td>
              <td className="px-4 py-3">
                <RowActions
                  onEdit={() => setEditingProject(item)}
                  onToggleDelete={async () => {
                    await adminApi.updateAdminProject(item._id, {
                      deleted: !item.deleted,
                    });
                    showToast(t("common.updated"), "success");
                    void load();
                  }}
                />
              </td>
            </tr>
          ))}
        </ContentTable>
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      )}

      <BudgetEditModal
        item={editingBudget}
        onClose={() => setEditingBudget(null)}
        onSaved={() => {
          setEditingBudget(null);
          void load();
        }}
      />
      <CategoryEditModal
        item={editingCategory}
        onClose={() => setEditingCategory(null)}
        onSaved={() => {
          setEditingCategory(null);
          void load();
        }}
      />
      <ProjectEditModal
        item={editingProject}
        onClose={() => setEditingProject(null)}
        onSaved={() => {
          setEditingProject(null);
          void load();
        }}
      />
    </div>
  );
}

function ContentTable({
  loading,
  isEmpty,
  emptyMessage,
  headers,
  children,
}: {
  loading: boolean;
  isEmpty: boolean;
  emptyMessage: string;
  headers: string[];
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-secondary/70 text-muted">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-start font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-4 py-10 text-center text-muted"
                >
                  {t("common.loading")}
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-4 py-10 text-center text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RowActions({
  onEdit,
  onToggleDelete,
}: {
  onEdit: () => void;
  onToggleDelete: () => void;
}) {
  return (
    <div className="flex gap-1">
      <Button size="sm" variant="ghost" onPress={onEdit}>
        <Edit2 size={16} />
      </Button>
      <Button size="sm" variant="ghost" onPress={() => void onToggleDelete()}>
        <Trash size={16} />
      </Button>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="secondary"
        isDisabled={page <= 1}
        onPress={() => onPage(page - 1)}
      >
        {t("auto.k1a592f6b2d")}
      </Button>
      <span className="text-sm text-muted">
        {t("common.pageOf", { page, totalPages })}
      </span>
      <Button
        variant="secondary"
        isDisabled={page >= totalPages}
        onPress={() => onPage(page + 1)}
      >
        {t("auto.k54ee927e96")}
      </Button>
    </div>
  );
}

function BudgetEditModal({
  item,
  onClose,
  onSaved,
}: {
  item: AdminBudgetItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");
  const [type, setType] = useState(0);

  useEffect(() => {
    if (item) {
      setPrice(item.price);
      setDescription(item.description);
      setType(item.type);
    }
  }, [item]);

  const save = async () => {
    if (!item) return;
    try {
      await adminApi.updateAdminBudget(item._id, { price, description, type });
      showToast(t("admin.transactionSaved"), "success");
      onSaved();
    } catch {
      showToast(t("common.saveFailed"), "danger");
    }
  };

  return (
    <Modal isOpen={Boolean(item)} onOpenChange={onClose}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{t("nav.editTransaction")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-3">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
                placeholder={t("common.amount")}
              />
              <select
                value={type}
                onChange={(e) => setType(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
              >
                <option value={0}>{t("common.income")}</option>
                <option value={1}>{t("common.expense")}</option>
              </select>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
                placeholder={t("common.description")}
                rows={3}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={onClose}>
                {t("common.cancel")}
              </Button>
              <Button onPress={() => void save()}>{t("common.save")}</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function CategoryEditModal({
  item,
  onClose,
  onSaved,
}: {
  item: AdminCategoryItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState(0);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setColor(item.color);
      setMonthlyLimit(item.monthlyLimit);
    }
  }, [item]);

  const save = async () => {
    if (!item) return;
    try {
      await adminApi.updateAdminCategory(item._id, {
        title,
        color,
        monthlyLimit,
      });
      showToast(t("categories.categorySaved"), "success");
      onSaved();
    } catch {
      showToast(t("common.saveFailed"), "danger");
    }
  };

  return (
    <Modal isOpen={Boolean(item)} onOpenChange={onClose}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{t("categories.editCategory")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
                placeholder={t("common.title")}
              />
              <input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
                placeholder={t("common.color")}
              />
              <input
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
                placeholder={t("common.monthlyLimit")}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={onClose}>
                {t("common.cancel")}
              </Button>
              <Button onPress={() => void save()}>{t("common.save")}</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function ProjectEditModal({
  item,
  onClose,
  onSaved,
}: {
  item: AdminProjectItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (item) {
      setDescription(item.description);
      setTotalAmount(item.totalAmount);
    }
  }, [item]);

  const save = async () => {
    if (!item) return;
    try {
      await adminApi.updateAdminProject(item._id, {
        description,
        totalAmount,
      });
      showToast(t("projects.projectSaved"), "success");
      onSaved();
    } catch {
      showToast(t("common.saveFailed"), "danger");
    }
  };

  return (
    <Modal isOpen={Boolean(item)} onOpenChange={onClose}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{t("projects.editProject")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-3">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
                placeholder={t("common.description")}
                rows={3}
              />
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
                placeholder={t("common.totalAmount")}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={onClose}>
                {t("common.cancel")}
              </Button>
              <Button onPress={() => void save()}>{t("common.save")}</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
