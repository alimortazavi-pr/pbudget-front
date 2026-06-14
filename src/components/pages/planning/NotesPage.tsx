"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";

import { PATHS } from "@/common/constants";
import * as periodNotesApi from "@/common/api/period-notes";
import type { PeriodNoteDuration } from "@/common/interfaces/period-note.interface";
import {
  formatJalaliDate,
  formatJalaliMonthYear,
  formatJalaliYear,
} from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { FilterDatePicker } from "@/components/pages/dashboard/FilterDatePicker";
import { chipClass } from "@/components/pages/planning/planning-shared";
import { PeriodNavigator } from "@/components/pages/planning/PeriodNavigator";
import { usePeriodQuery } from "@/components/pages/planning/usePeriodQuery";

export function NotesPage() {
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
    (searchParams.get("duration") as PeriodNoteDuration) || "monthly";

  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const periodLabel = useMemo(() => {
    if (noteDuration === "general") return "یادداشت کلی";
    if (noteDuration === "daily") return formatJalaliDate(year, month, day);
    if (noteDuration === "yearly") return formatJalaliYear(year);
    return formatJalaliMonthYear(year, month);
  }, [noteDuration, year, month, day]);

  const showPeriodNav = noteDuration !== "general";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const note = await periodNotesApi.fetchPeriodNote({
        duration: noteDuration,
        year: noteDuration === "general" ? undefined : year,
        month:
          noteDuration === "daily" || noteDuration === "monthly"
            ? month
            : undefined,
        day: noteDuration === "daily" ? day : undefined,
      });
      setNoteContent(note?.content ?? "");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, [noteDuration, year, month, day]);

  useEffect(() => {
    void load();
  }, [load]);

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

  async function saveNote() {
    setNoteSaving(true);
    try {
      await periodNotesApi.upsertPeriodNote({
        duration: noteDuration,
        year: noteDuration === "general" ? undefined : year,
        month:
          noteDuration === "daily" || noteDuration === "monthly"
            ? month
            : undefined,
        day: noteDuration === "daily" ? day : undefined,
        content: noteContent,
      });
      showToast("یادداشت ذخیره شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setNoteSaving(false);
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-3xl bg-gradient-to-br from-teal-600 to-emerald-600 p-5 text-white shadow-lg">
        <p className="text-sm font-medium text-white/80">یادداشت مالی</p>
        <h1 className="mt-1 text-2xl font-bold">یادداشت‌ها</h1>
        <p className="mt-2 text-sm leading-7 text-white/80">
          نسیه‌ها، کارهای پرداخت و برنامه‌های مالی — روزانه تا کلی.
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

      {loading ? (
        <p className="text-center text-sm text-muted">در حال بارگذاری…</p>
      ) : (
        <textarea
          className="min-h-48 w-full rounded-2xl border border-border bg-field-background p-4 text-sm leading-7 outline-none"
          placeholder={
            noteDuration === "general"
              ? "یادداشت‌های کلی مثل اهداف مالی، لیست نسیه‌ها، برنامه بلندمدت…"
              : "مثلاً: نسیه فروشگاه X، قسط وام Y، پرداخت به علی تا پنجشنبه…"
          }
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
        />
      )}

      <Button className="w-full" isPending={noteSaving} onPress={() => void saveNote()}>
        ذخیره یادداشت
      </Button>
    </div>
  );
}
