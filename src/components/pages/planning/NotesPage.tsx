"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Checkbox, Input, Label, Modal, TextField } from "@heroui/react";
import { Add, Edit2, Note, Trash } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as noteCategoriesApi from "@/common/api/note-categories";
import * as userNotesApi from "@/common/api/user-notes";
import type {
  INoteCategory,
  INoteLine,
  IUserNote,
  NoteDuration,
} from "@/common/interfaces/note.interface";
import {
  formatJalaliDate,
  formatJalaliDateTime,
  formatJalaliMonthYear,
  formatJalaliYear,
} from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import {
  AppleNoteEditor,
  hasEditorContent,
  linesFromNote,
} from "@/components/pages/planning/AppleNoteEditor";
import { FilterDatePicker } from "@/components/pages/dashboard/FilterDatePicker";
import { useHydratedSearchParams } from "@/common/hooks/useHydratedSearchParams";
import { chipClass } from "@/components/pages/planning/planning-shared";
import { PeriodNavigator } from "@/components/pages/planning/PeriodNavigator";
import { usePeriodQuery } from "@/components/pages/planning/usePeriodQuery";

function getCategoryTitle(note: IUserNote) {
  if (!note.category || typeof note.category === "string") return "بدون دسته";
  return note.category.title;
}

function periodPayload(
  noteDuration: NoteDuration,
  year: string,
  month: string,
  day: string,
) {
  return {
    duration: noteDuration,
    year: noteDuration === "general" ? undefined : year,
    month:
      noteDuration === "daily" || noteDuration === "monthly" ? month : undefined,
    day: noteDuration === "daily" ? day : undefined,
  };
}

export function NotesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { get } = useHydratedSearchParams();
  const {
    year,
    month,
    day,
    updateQuery,
    goToToday,
    shiftDay,
    shiftMonth,
    shiftYear,
  } = usePeriodQuery(PATHS.NOTES);

  const noteDuration = (get("duration", "monthly") as NoteDuration);
  const categoryFilter = get("categoryId", "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [noteDoc, setNoteDoc] = useState<IUserNote | null>(null);
  const [previewDocs, setPreviewDocs] = useState<IUserNote[]>([]);
  const [lines, setLines] = useState<INoteLine[]>(linesFromNote(null));
  const [categories, setCategories] = useState<INoteCategory[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryTitle, setCategoryTitle] = useState("");
  const [editCategory, setEditCategory] = useState<INoteCategory | null>(null);
  const [categorySaving, setCategorySaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef("");

  const editingCategoryId = categoryFilter || "none";
  const canEdit = Boolean(categoryFilter);

  const periodLabel = useMemo(() => {
    if (noteDuration === "general") return "یادداشت کلی";
    if (noteDuration === "daily") return formatJalaliDate(year, month, day);
    if (noteDuration === "yearly") return formatJalaliYear(year);
    return formatJalaliMonthYear(year, month);
  }, [noteDuration, year, month, day]);

  const showPeriodNav = noteDuration !== "general";

  const loadCategories = useCallback(async () => {
    try {
      const data = await noteCategoriesApi.fetchNoteCategories();
      setCategories(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری دسته‌ها");
    }
  }, []);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const period = periodPayload(noteDuration, year, month, day);

      if (!canEdit) {
        const docs = await userNotesApi.fetchUserNoteDocuments({
          ...period,
        });
        setPreviewDocs(docs);
        setNoteDoc(null);
        setLines(linesFromNote(null));
        lastSavedRef.current = "";
        return;
      }

      const note = await userNotesApi.fetchUserNoteDocument({
        ...period,
        categoryId: editingCategoryId === "none" ? null : editingCategoryId,
      });
      const nextLines = linesFromNote(note);
      setNoteDoc(note);
      setLines(nextLines);
      setPreviewDocs([]);
      lastSavedRef.current = JSON.stringify(nextLines);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, [noteDuration, year, month, day, canEdit, editingCategoryId]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const saveDocument = useCallback(
    async (nextLines: INoteLine[], silent = false) => {
      if (!canEdit) return;

      const serialized = JSON.stringify(nextLines);
      if (serialized === lastSavedRef.current) return;

      setSaving(true);
      try {
        const period = periodPayload(noteDuration, year, month, day);
        const note = await userNotesApi.upsertUserNoteDocument({
          ...period,
          categoryId: editingCategoryId === "none" ? null : editingCategoryId,
          items: nextLines,
        });
        setNoteDoc(note);
        lastSavedRef.current = serialized;
        if (!silent) {
          showToast(t("common.saved"), "success");
        }
      } catch (err) {
        showToast(err instanceof Error ? err.message : "خطا در ذخیره");
      } finally {
        setSaving(false);
      }
    },
    [canEdit, noteDuration, year, month, day, editingCategoryId],
  );

  function scheduleSave(nextLines: INoteLine[]) {
    if (!canEdit) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      void saveDocument(nextLines, true);
    }, 700);
  }

  function handleLinesChange(nextLines: INoteLine[]) {
    setLines(nextLines);
    scheduleSave(nextLines);
  }

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  function handlePeriodPrev() {
    if (noteDuration === "daily") shiftDay(-1);
    else if (noteDuration === "yearly") shiftYear(-1);
    else shiftMonth(-1);
  }

  function handlePeriodNext() {
    if (noteDuration === "daily") shiftDay(1);
    else if (noteDuration === "yearly") shiftYear(1);
    else shiftMonth(1);
  }

  function setCategoryFilter(value?: string) {
    const params = new URLSearchParams(window.location.search);
    if (!value) {
      params.delete("categoryId");
    } else {
      params.set("categoryId", value);
    }
    router.replace(`${PATHS.NOTES}?${params.toString()}`, { scroll: false });
  }

  function openCategoryModal(category?: INoteCategory) {
    setEditCategory(category ?? null);
    setCategoryTitle(category?.title ?? "");
    setCategoryModalOpen(true);
  }

  async function saveCategory(e?: FormEvent) {
    e?.preventDefault();
    if (!categoryTitle.trim()) return;

    setCategorySaving(true);
    try {
      if (editCategory) {
        const updated = await noteCategoriesApi.updateNoteCategory(
          editCategory._id,
          { title: categoryTitle.trim() },
        );
        setCategories((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item)),
        );
      } else {
        const created = await noteCategoriesApi.createNoteCategory({
          title: categoryTitle.trim(),
        });
        setCategories((prev) => [...prev, created]);
      }
      showToast(t("common.saved"), "success");
      setCategoryModalOpen(false);
      setCategoryTitle("");
      setEditCategory(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setCategorySaving(false);
    }
  }

  async function removeCategory(category: INoteCategory) {
    try {
      await noteCategoriesApi.deleteNoteCategory(category._id);
      setCategories((prev) => prev.filter((item) => item._id !== category._id));
      if (categoryFilter === category._id) {
        setCategoryFilter();
      }
      showToast(t("common.deleted"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  async function clearCurrentNote() {
    if (!canEdit) return;
    if (!hasEditorContent(lines) && !noteDoc) return;
    if (!confirm("یادداشت این دسته و بازه پاک شود؟")) return;

    setClearing(true);
    try {
      const period = periodPayload(noteDuration, year, month, day);
      await userNotesApi.clearUserNotes({
        ...period,
        categoryId: editingCategoryId === "none" ? null : editingCategoryId,
      });
      setNoteDoc(null);
      setLines(linesFromNote(null));
      lastSavedRef.current = "";
      showToast(t("auto.k48eda39ee6"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setClearing(false);
    }
  }

  const editingCategoryLabel =
    editingCategoryId === "none"
      ? "بدون دسته"
      : categories.find((item) => item._id === editingCategoryId)?.title ??
        "دسته انتخاب‌شده";

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-3xl bg-gradient-to-br from-teal-600 to-emerald-600 p-5 text-white shadow-lg">
        <p className="text-sm font-medium text-white/80">{t("auto.k71b5e14613")}</p>
        <h1 className="mt-1 text-2xl font-bold">{t("nav.notes")}</h1>
        <p className="mt-2 text-sm leading-7 text-white/80">
          متن آزاد و چک‌لیست در یک صفحه، با دسته‌بندی جدا از تراکنش.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-2">
        {[
          { id: "general" as const, label: "کلی" },
          { id: "yearly" as const, label: "سالانه" },
          { id: "monthly" as const, label: "ماهانه" },
          { id: "daily" as const, label: "روزانه" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            className={chipClass(noteDuration === item.id)}
            onClick={() => updateQuery({ duration: item.id })}
          >
            {item.label}
          </button>
        ))}
      </div>

      <PeriodNavigator
        label={periodLabel}
        showNav={showPeriodNav}
        onPrev={handlePeriodPrev}
        onNext={handlePeriodNext}
        onToday={showPeriodNav ? goToToday : undefined}
      />

      {noteDuration === "daily" && (
        <FilterDatePicker
          year={year}
          month={month}
          day={day}
          onChange={(value) => updateQuery(value)}
        />
      )}

      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Note size={18} className="text-accent" variant="Bold" />
            <h2 className="font-semibold">{t("auto.k5aa16e45c0")}</h2>
          </div>
          <Button size="sm" variant="secondary" onPress={() => openCategoryModal()}>
            <Add size={16} />
            دسته جدید
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={chipClass(!categoryFilter)}
            onClick={() => setCategoryFilter()}
          >
            همه
          </button>
          <button
            type="button"
            className={chipClass(categoryFilter === "none")}
            onClick={() => setCategoryFilter("none")}
          >
            بدون دسته
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              type="button"
              className={chipClass(categoryFilter === category._id)}
              onClick={() => setCategoryFilter(category._id)}
            >
              {category.title}
            </button>
          ))}
        </div>

        {categories.length > 0 && (
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category._id}
                className="flex items-center justify-between rounded-xl bg-surface-secondary px-3 py-2 text-sm"
              >
                <span>{category.title}</span>
                <div className="flex items-center gap-1">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    onPress={() => openCategoryModal(category)}
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    onPress={() => void removeCategory(category)}
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {loading ? (
        <p className="text-center text-sm text-muted">{t("common.loading")}</p>
      ) : !canEdit ? (
        <section className="space-y-4 rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm leading-7 text-muted">
            برای نوشتن یا ویرایش، یک دسته انتخاب کنید (مثلاً «بدون دسته» یا «طلب
            و بدهی»).
          </p>
          {previewDocs.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
              یادداشتی در این بازه نیست.
            </p>
          ) : (
            previewDocs.map((doc) => (
              <article
                key={doc._id}
                className="rounded-2xl border border-border bg-field-background p-4"
              >
                <h3 className="mb-3 text-sm font-semibold text-muted">
                  {getCategoryTitle(doc)}
                </h3>
                <ul className="space-y-2">
                  {doc.items.map((item) => (
                    <NotePreviewLine key={item.id} item={item} />
                  ))}
                </ul>
              </article>
            ))
          )}
        </section>
      ) : (
        <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">یادداشت {editingCategoryLabel}</h2>
              <p className="text-xs text-muted">
                {saving ? "در حال ذخیره…" : "ذخیره خودکار"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                isPending={saving}
                onPress={() => void saveDocument(lines)}
              >
                ذخیره
              </Button>
              <Button
                size="sm"
                variant="secondary"
                isPending={clearing}
                onPress={() => void clearCurrentNote()}
              >
                پاک کردن
              </Button>
            </div>
          </div>

          <AppleNoteEditor items={lines} onChange={handleLinesChange} />
        </section>
      )}

      <AppModal open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <AppModalDialog>
          <form onSubmit={(e) => void saveCategory(e)}>
            <AppModalHeader onClose={() => setCategoryModalOpen(false)}>
              <Modal.Heading>
                {editCategory ? "ویرایش دسته یادداشت" : "دسته یادداشت جدید"}
              </Modal.Heading>
            </AppModalHeader>
            <Modal.Body>
              <TextField name="categoryTitle" isRequired>
                <Label>{t("common.title")}</Label>
                <Input
                  placeholder={t("auto.k008aa82c4f")}
                  value={categoryTitle}
                  onChange={(e) => setCategoryTitle(e.target.value)}
                />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button
                type="button"
                variant="ghost"
                onPress={() => setCategoryModalOpen(false)}
              >
                انصراف
              </Button>
              <Button type="submit" isPending={categorySaving}>
                ذخیره
              </Button>
            </Modal.Footer>
          </form>
        </AppModalDialog>
      </AppModal>
    </div>
  );
}

function NotePreviewLine({ item }: { item: INoteLine }) {
  if (item.type === "checkbox") {
    return (
      <li className="flex items-start gap-2 rounded-xl bg-surface px-2 py-1.5">
        <Checkbox
          variant="secondary"
          isSelected={Boolean(item.done)}
          isReadOnly
          aria-label={item.text}
          className="shrink-0"
        >
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
        </Checkbox>
        <span
          className={`min-w-0 flex-1 pt-0.5 text-sm leading-7 ${
            item.done ? "text-muted line-through" : ""
          }`}
        >
          {item.text}
          {item.reminder?.year != null && (
            <span className="mt-1 block text-xs text-primary">
              ⏰{" "}
              {formatJalaliDateTime(
                item.reminder.year,
                item.reminder.month,
                item.reminder.day,
                item.reminder.hour,
                item.reminder.minute,
              )}
            </span>
          )}
        </span>
      </li>
    );
  }

  return (
    <li className="rounded-xl bg-surface px-3 py-1.5 text-sm leading-7">
      {item.text}
      {item.reminder?.year != null && (
        <span className="mt-1 block text-xs text-primary">
          ⏰{" "}
          {formatJalaliDateTime(
            item.reminder.year,
            item.reminder.month,
            item.reminder.day,
            item.reminder.hour,
            item.reminder.minute,
          )}
        </span>
      )}
    </li>
  );
}
