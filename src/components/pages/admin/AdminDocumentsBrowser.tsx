"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input } from "@heroui/react";
import { Add, CloseCircle, Code1, Trash } from "iconsax-reactjs";

import * as insightsApi from "@/common/api/admin-insights";
import type { AdminDocumentsResponse } from "@/common/interfaces/admin";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { AdminPanel, ConfirmDialog, EmptyState, PaginationBar, Pill, SearchField, SkeletonRows } from "./ui/AdminUi";
import { JsonDocumentDialog } from "./ui/JsonDocumentDialog";

type Doc = Record<string, unknown> & { _id: string };

/** Short, readable one-line summary of a raw document. */
function summarize(doc: Doc) {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(doc)) {
    if (key === "_id" || key === "__v" || value === null || value === undefined) continue;
    if (typeof value === "object") continue;
    parts.push(`${key}: ${String(value).slice(0, 40)}`);
    if (parts.length >= 5) break;
  }
  return parts.join(" · ");
}

export function AdminDocumentsBrowser({ collection, onClose }: { collection: string; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [appliedFilter, setAppliedFilter] = useState("");
  const [data, setData] = useState<AdminDocumentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ open: boolean; doc: Doc | null }>({ open: false, doc: null });
  const [deleting, setDeleting] = useState<Doc | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await insightsApi.fetchDocuments(collection, { page, limit: 25, search, filter: appliedFilter }));
    } catch (error) {
      showErrorToast(error, "دریافت اسناد ناموفق بود");
    } finally {
      setLoading(false);
    }
  }, [appliedFilter, collection, page, search]);

  useEffect(() => {
    setPage(1);
    setSearch("");
    setFilter("");
    setAppliedFilter("");
  }, [collection]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(value: Record<string, unknown>) {
    setBusy(true);
    try {
      if (editing.doc) await insightsApi.updateDocument(collection, editing.doc._id, value);
      else await insightsApi.createDocument(collection, value);
      showToast("سند ذخیره شد", "success");
      setEditing({ open: false, doc: null });
      await load();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await insightsApi.deleteDocument(collection, deleting._id);
      showToast("سند حذف شد", "success");
      setDeleting(null);
      await load();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  const readOnly = Boolean(data?.readOnly);
  const items = (data?.items ?? []) as Doc[];

  return (
    <AdminPanel
      title={
        <span className="flex items-center gap-2">
          اسناد <span className="font-mono" dir="ltr">{collection}</span>
          {readOnly ? <Pill tone="neutral">فقط‌خواندنی</Pill> : null}
        </span>
      }
      description="ویرایش مستقیم دیتابیس — همه تغییرات در لاگ عملیات ادمین ثبت می‌شود. برای تراکنش‌ها از پرونده کاربر استفاده کنید تا موجودی‌ها درست بمانند."
      actions={
        <div className="flex gap-2">
          {!readOnly ? (
            <Button size="sm" onPress={() => setEditing({ open: true, doc: null })}>
              <Add size={16} />
              سند جدید
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" isIconOnly aria-label="بستن" onPress={onClose}>
            <CloseCircle size={18} />
          </Button>
        </div>
      }
      bodyClassName="p-4 sm:p-5 space-y-3"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <SearchField value={search} placeholder="جستجو در فیلدهای متنی یا شناسه…" onChange={(value) => { setSearch(value); setPage(1); }} />
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedFilter(filter.trim());
            setPage(1);
          }}
        >
          <Input
            aria-label="فیلتر JSON"
            variant="secondary"
            dir="ltr"
            className="flex-1 font-mono text-xs"
            placeholder='{"user": {"$oid": "..."}, "deleted": false}'
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
          <Button type="submit" size="sm" variant="secondary">اعمال</Button>
        </form>
      </div>

      {loading && !data ? (
        <SkeletonRows rows={8} height="h-12" />
      ) : items.length === 0 ? (
        <EmptyState title="سندی پیدا نشد" />
      ) : (
        <div className={loading ? "opacity-60" : ""}>
          <ul className="divide-y divide-border/50 rounded-xl border border-border/60">
            {items.map((doc) => (
              <li key={doc._id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1" dir="ltr">
                  <p className="truncate font-mono text-xs font-semibold">{doc._id}</p>
                  <p className="truncate font-mono text-[11px] text-muted">{summarize(doc)}</p>
                </div>
                <Button size="sm" variant="ghost" isIconOnly aria-label="مشاهده/ویرایش" onPress={() => setEditing({ open: true, doc })}>
                  <Code1 size={16} />
                </Button>
                {!readOnly ? (
                  <Button size="sm" variant="ghost" isIconOnly aria-label="حذف" onPress={() => setDeleting(doc)}>
                    <Trash size={16} className="text-danger" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
          <PaginationBar pagination={data?.pagination} onPage={setPage} />
        </div>
      )}

      <JsonDocumentDialog
        open={editing.open}
        onOpenChange={(open) => setEditing((current) => ({ ...current, open }))}
        title={editing.doc ? (readOnly ? "مشاهده سند" : "ویرایش سند") : "سند جدید"}
        document={editing.doc}
        readOnly={readOnly}
        isPending={busy}
        onSave={(value) => void save(value)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="حذف دائمی سند"
        description="سند برای همیشه از دیتابیس حذف می‌شود. یک نسخه از آن در لاگ عملیات ادمین نگه داشته می‌شود."
        confirmLabel="حذف"
        isPending={busy}
        onConfirm={() => void remove()}
      />
    </AdminPanel>
  );
}
