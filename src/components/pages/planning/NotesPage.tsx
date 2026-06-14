"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Checkbox, Input, Label, Modal, TextField } from "@heroui/react";
import { Add, Edit2, Note, Trash } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as noteCategoriesApi from "@/common/api/note-categories";
import * as userNotesApi from "@/common/api/user-notes";
import type {
  INoteCategory,
  IUserNote,
  NoteDuration,
} from "@/common/interfaces/note.interface";
import {
  formatJalaliDate,
  formatJalaliMonthYear,
  formatJalaliYear,
} from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { AppModal, AppModalHeader } from "@/components/common/ui/AppModal";
import { FilterDatePicker } from "@/components/pages/dashboard/FilterDatePicker";
import { chipClass } from "@/components/pages/planning/planning-shared";
import { PeriodNavigator } from "@/components/pages/planning/PeriodNavigator";
import { usePeriodQuery } from "@/components/pages/planning/usePeriodQuery";

function getCategoryTitle(note: IUserNote) {
  if (!note.category || typeof note.category === "string") return null;
  return note.category.title;
}

export function NotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const noteDuration =
    (searchParams.get("duration") as NoteDuration) || "monthly";
  const categoryFilter = searchParams.get("categoryId") ?? "";

  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<IUserNote[]>([]);
  const [categories, setCategories] = useState<INoteCategory[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [adding, setAdding] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryTitle, setCategoryTitle] = useState("");
  const [editCategory, setEditCategory] = useState<INoteCategory | null>(null);
  const [categorySaving, setCategorySaving] = useState(false);
  const [clearing, setClearing] = useState(false);

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
      const data = await userNotesApi.fetchUserNotes({
        duration: noteDuration,
        year: noteDuration === "general" ? undefined : year,
        month:
          noteDuration === "daily" || noteDuration === "monthly"
            ? month
            : undefined,
        day: noteDuration === "daily" ? day : undefined,
        categoryId: categoryFilter || undefined,
      });
      setNotes(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, [noteDuration, year, month, day, categoryFilter]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

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

  async function addNote(e?: FormEvent) {
    e?.preventDefault();
    const text = newNoteText.trim();
    if (!text) return;

    setAdding(true);
    try {
      const note = await userNotesApi.createUserNote({
        text,
        duration: noteDuration,
        year: noteDuration === "general" ? undefined : year,
        month:
          noteDuration === "daily" || noteDuration === "monthly"
            ? month
            : undefined,
        day: noteDuration === "daily" ? day : undefined,
        categoryId:
          categoryFilter === "none"
            ? null
            : categoryFilter || undefined,
      });
      setNotes((prev) => [note, ...prev]);
      setNewNoteText("");
      showToast("یادداشت اضافه شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setAdding(false);
    }
  }

  async function toggleNote(note: IUserNote) {
    try {
      const updated = await userNotesApi.toggleUserNote(note._id);
      setNotes((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item)),
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  async function removeNote(note: IUserNote) {
    try {
      await userNotesApi.deleteUserNote(note._id);
      setNotes((prev) => prev.filter((item) => item._id !== note._id));
      showToast("حذف شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
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
      showToast("ذخیره شد", "success");
      setCategoryModalOpen(false);
      setCategoryTitle("");
      setEditCategory(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setCategorySaving(false);
    }
  }

  function setCategoryFilter(value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete("categoryId");
    } else {
      params.set("categoryId", value);
    }
    router.replace(`${PATHS.NOTES}?${params.toString()}`, { scroll: false });
  }

  async function removeCategory(category: INoteCategory) {
    try {
      await noteCategoriesApi.deleteNoteCategory(category._id);
      setCategories((prev) => prev.filter((item) => item._id !== category._id));
      if (categoryFilter === category._id) {
        setCategoryFilter();
      }
      showToast("حذف شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  async function clearAllNotes() {
    if (!notes.length) return;
    if (!confirm("همه یادداشت‌های این بازه پاک شوند؟")) return;

    setClearing(true);
    try {
      await userNotesApi.clearUserNotes({
        duration: noteDuration,
        year: noteDuration === "general" ? undefined : year,
        month:
          noteDuration === "daily" || noteDuration === "monthly"
            ? month
            : undefined,
        day: noteDuration === "daily" ? day : undefined,
        categoryId:
          categoryFilter === "none"
            ? null
            : categoryFilter || undefined,
      });
      setNotes([]);
      showToast("یادداشت‌ها پاک شدند", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setClearing(false);
    }
  }

  const pendingNotes = notes.filter((note) => !note.done);
  const doneNotes = notes.filter((note) => note.done);

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-3xl bg-gradient-to-br from-teal-600 to-emerald-600 p-5 text-white shadow-lg">
        <p className="text-sm font-medium text-white/80">یادداشت مالی</p>
        <h1 className="mt-1 text-2xl font-bold">یادداشت‌ها</h1>
        <p className="mt-2 text-sm leading-7 text-white/80">
          طلب و بدهی، نسیه‌ها و یادآوری‌ها — با چک‌باکس و دسته‌بندی جدا از تراکنش.
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
            <h2 className="font-semibold">دسته‌بندی یادداشت</h2>
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

      <form className="flex gap-2" onSubmit={(e) => void addNote(e)}>
        <TextField className="flex-1" name="newNote">
          <Label className="sr-only">یادداشت جدید</Label>
          <Input
            placeholder="مثلاً: ۱۰ ت از علی میخوام"
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
          />
        </TextField>
        <Button type="submit" isPending={adding}>
          افزودن
        </Button>
      </form>

      {loading ? (
        <p className="text-center text-sm text-muted">در حال بارگذاری…</p>
      ) : notes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
          یادداشتی نیست. از بات تلگرام هم می‌توانید با{" "}
          <span dir="ltr" className="font-mono text-xs">
            /note متن
          </span>{" "}
          ثبت کنید.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              isPending={clearing}
              onPress={() => void clearAllNotes()}
            >
              پاک کردن همه
            </Button>
          </div>
          {pendingNotes.length > 0 && (
            <NoteList
              title="باز"
              notes={pendingNotes}
              onToggle={(note) => void toggleNote(note)}
              onRemove={(note) => void removeNote(note)}
            />
          )}
          {doneNotes.length > 0 && (
            <NoteList
              title="انجام‌شده"
              notes={doneNotes}
              onToggle={(note) => void toggleNote(note)}
              onRemove={(note) => void removeNote(note)}
            />
          )}
        </div>
      )}

      <AppModal open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <AppModalHeader onClose={() => setCategoryModalOpen(false)}>
          <h2 className="text-lg font-semibold">
            {editCategory ? "ویرایش دسته یادداشت" : "دسته یادداشت جدید"}
          </h2>
        </AppModalHeader>
        <Modal.Body>
          <form className="space-y-4" onSubmit={(e) => void saveCategory(e)}>
            <TextField name="categoryTitle" isRequired>
              <Label>عنوان</Label>
              <Input
                placeholder="مثلاً: طلب و بدهی"
                value={categoryTitle}
                onChange={(e) => setCategoryTitle(e.target.value)}
              />
            </TextField>
            <Button className="w-full" type="submit" isPending={categorySaving}>
              ذخیره
            </Button>
          </form>
        </Modal.Body>
      </AppModal>
    </div>
  );
}

function NoteList({
  title,
  notes,
  onToggle,
  onRemove,
}: {
  title: string;
  notes: IUserNote[];
  onToggle: (note: IUserNote) => void;
  onRemove: (note: IUserNote) => void;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium text-muted">{title}</h3>
      <ul className="space-y-2">
        {notes.map((note) => {
          const categoryTitle = getCategoryTitle(note);
          return (
            <li
              key={note._id}
              className="flex items-start gap-2 rounded-2xl border border-border bg-field-background p-3"
            >
              <Checkbox
                isSelected={note.done}
                onChange={() => onToggle(note)}
                aria-label={note.text}
              >
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Content className="min-w-0 flex-1">
                  <span
                    className={`block text-sm leading-7 ${
                      note.done ? "text-muted line-through" : ""
                    }`}
                  >
                    {note.text}
                  </span>
                  {categoryTitle && (
                    <span className="mt-1 block text-xs text-muted">
                      {categoryTitle}
                    </span>
                  )}
                </Checkbox.Content>
              </Checkbox>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="shrink-0"
                onPress={() => onRemove(note)}
              >
                <Trash size={16} />
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
