"use client";

import { useEffect, useState } from "react";
import { Button, Input, TextArea } from "@heroui/react";
import { Edit2, Trash } from "iconsax-reactjs";

import { fetchUsers } from "@/common/api/admin-insights";
import * as supportApi from "@/common/api/support";
import { SUPPORT_CATEGORIES, SUPPORT_PRIORITIES, type AdminTicketDetail, type SupportCannedReply, type SupportCategory, type SupportPriority } from "@/common/api/support";
import type { AdminUserRow } from "@/common/interfaces/admin/insights.interface";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { PendingFiles, AttachButton, useAttachmentUploads } from "@/components/pages/support/SupportChat";
import { EmptyState, Field, FormDialog, NativeSelect, SearchField, UserAvatar } from "../ui/AdminUi";
import { CATEGORY_LABEL, PRIORITY_LABEL } from "./support-labels";

type PickedUser = { _id: string; name: string; mobile: string };

/** Admin opens a conversation with any user; they are notified on the site, Telegram, Bale and push. */
export function StartConversationDialog({
  open,
  onOpenChange,
  initialUser,
  onStarted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUser?: PickedUser | null;
  onStarted: (ticket: AdminTicketDetail) => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AdminUserRow[]>([]);
  const [user, setUser] = useState<PickedUser | null>(initialUser ?? null);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<SupportCategory>("general");
  const [priority, setPriority] = useState<SupportPriority>("normal");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const uploads = useAttachmentUploads("admin");

  useEffect(() => {
    if (open) setUser(initialUser ?? null);
  }, [open, initialUser]);

  useEffect(() => {
    if (!open || user || search.length < 2) {
      setResults([]);
      return;
    }
    let alive = true;
    void fetchUsers({ search, limit: 8 })
      .then((data) => alive && setResults(data.items))
      .catch(() => alive && setResults([]));
    return () => {
      alive = false;
    };
  }, [search, open, user]);

  async function submit() {
    if (!user || text.trim().length < 2) return;
    setBusy(true);
    try {
      const ticket = await supportApi.adminStartTicket({
        userId: user._id,
        subject: subject.trim() || undefined,
        category,
        priority,
        text: text.trim(),
        attachmentIds: uploads.ids.length ? uploads.ids : undefined,
      });
      showToast("گفتگو شروع شد و به کاربر اطلاع داده شد", "success");
      setSubject("");
      setText("");
      setSearch("");
      uploads.clear();
      onOpenChange(false);
      onStarted(ticket);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="گفتگوی جدید با کاربر"
      description="پیام شما در بخش پشتیبانی کاربر نمایش داده می‌شود و در تلگرام، بله و اعلان مرورگر (اگر فعال باشد) به او خبر می‌دهیم."
      submitLabel="ارسال پیام"
      isPending={busy}
      submitDisabled={!user || text.trim().length < 2 || uploads.uploading}
      onSubmit={() => void submit()}
      wide
    >
      {user ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-surface-secondary/60 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar name={user.name} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-muted" dir="ltr">{user.mobile}</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onPress={() => setUser(null)}>
            تغییر
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <SearchField value={search} onChange={setSearch} placeholder="نام یا موبایل کاربر…" />
          {results.length ? (
            <ul className="max-h-56 overflow-y-auto rounded-2xl border border-border/60">
              {results.map((row) => {
                const name = `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim() || row.mobile;
                return (
                  <li key={row._id}>
                    <button
                      type="button"
                      onClick={() => setUser({ _id: row._id, name, mobile: row.mobile })}
                      className="flex w-full items-center gap-3 border-b border-border/40 px-3 py-2 text-start last:border-0 hover:bg-surface-secondary"
                    >
                      <UserAvatar name={name} size={30} />
                      <span className="min-w-0 flex-1 truncate text-sm">{name}</span>
                      <span className="text-xs text-muted" dir="ltr">{row.mobile}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : search.length >= 2 ? (
            <p className="text-xs text-muted">کاربری پیدا نشد.</p>
          ) : null}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="عنوان (اختیاری)">
          <Input variant="secondary" maxLength={120} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="مثلاً: دربارهٔ اشتراک شما" />
        </Field>
        <Field label="موضوع">
          <NativeSelect ariaLabel="موضوع" value={category} onChange={(value) => setCategory(value as SupportCategory)} options={SUPPORT_CATEGORIES.map((id) => ({ value: id, label: CATEGORY_LABEL[id] }))} />
        </Field>
        <Field label="اولویت">
          <NativeSelect ariaLabel="اولویت" value={priority} onChange={(value) => setPriority(value as SupportPriority)} options={SUPPORT_PRIORITIES.map((id) => ({ value: id, label: PRIORITY_LABEL[id] }))} />
        </Field>
      </div>
      <Field label="پیام">
        <TextArea variant="secondary" rows={5} maxLength={4000} value={text} onChange={(event) => setText(event.target.value)} placeholder="سلام! …" />
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <AttachButton uploads={uploads} />
        <PendingFiles uploads={uploads} />
      </div>
    </FormDialog>
  );
}

/** Saved answers: add, edit, delete. Variables: {{name}}, {{firstName}}, {{code}}. */
export function CannedRepliesDialog({
  open,
  onOpenChange,
  replies,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replies: SupportCannedReply[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<SupportCannedReply | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTitle(editing?.title ?? "");
    setText(editing?.text ?? "");
  }, [editing]);

  async function save() {
    if (title.trim().length < 2 || text.trim().length < 2) return;
    setBusy(true);
    try {
      await supportApi.saveCannedReply({ title: title.trim(), text: text.trim() }, editing?._id);
      showToast(editing ? "پاسخ آماده ویرایش شد" : "پاسخ آماده اضافه شد", "success");
      setEditing(null);
      setTitle("");
      setText("");
      onChanged();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      await supportApi.deleteCannedReply(id);
      if (editing?._id === id) setEditing(null);
      onChanged();
    } catch (error) {
      showErrorToast(error);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="پاسخ‌های آماده"
      description="متن‌های پرتکرار را یک بار بنویسید و در پاسخ با یک کلیک درج کنید. {{name}}، {{firstName}} و {{code}} با نام کاربر و کد گفتگو جایگزین می‌شوند."
      submitLabel={editing ? "ذخیرهٔ تغییرات" : "افزودن"}
      isPending={busy}
      submitDisabled={title.trim().length < 2 || text.trim().length < 2}
      onSubmit={() => void save()}
      wide
    >
      <div className="grid gap-3">
        <Field label="عنوان">
          <Input variant="secondary" maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="مثلاً: پیگیری پرداخت" />
        </Field>
        <Field label="متن">
          <TextArea variant="secondary" rows={4} maxLength={4000} value={text} onChange={(event) => setText(event.target.value)} placeholder="سلام {{firstName}} عزیز، …" />
        </Field>
        {editing ? (
          <Button size="sm" variant="ghost" className="justify-self-start" onPress={() => setEditing(null)}>
            انصراف از ویرایش
          </Button>
        ) : null}
      </div>
      <div className="border-t border-border/50 pt-3">
        {replies.length === 0 ? (
          <EmptyState title="هنوز پاسخ آماده‌ای ندارید" />
        ) : (
          <ul className="space-y-2">
            {replies.map((reply) => (
              <li key={reply._id} className="flex items-start justify-between gap-3 rounded-xl border border-border/50 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{reply.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted">{reply.text}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button isIconOnly size="sm" variant="ghost" aria-label="ویرایش" onPress={() => setEditing(reply)}>
                    <Edit2 size={16} />
                  </Button>
                  <Button isIconOnly size="sm" variant="ghost" aria-label="حذف" onPress={() => void remove(reply._id)}>
                    <Trash size={16} className="text-danger" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </FormDialog>
  );
}
