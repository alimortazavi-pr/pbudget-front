"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { Add, CloseCircle, Trash } from "iconsax-reactjs";

import * as boardApi from "@/common/api/context-board";
import type {
  IContextBoardCard,
  IContextBoardColumn,
} from "@/common/interfaces/context-board.interface";
import type { PartnerContextType } from "@/common/interfaces/partner.interface";
import { formatJalaliDate } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { FormInput } from "@/components/common/form/FormFields";

type ContextPlanningBoardProps = {
  contextType: PartnerContextType;
  contextId: string;
  readOnly?: boolean;
};

type DragState = {
  cardId: string;
  sourceColumnId: string;
} | null;

function reorderColumns(
  columns: IContextBoardColumn[],
  sourceColumnId: string,
  targetColumnId: string,
  cardId: string,
  targetIndex: number,
) {
  const next = columns.map((column) => ({
    ...column,
    cards: [...column.cards],
  }));

  const sourceColumn = next.find((column) => column._id === sourceColumnId);
  const targetColumn = next.find((column) => column._id === targetColumnId);
  if (!sourceColumn || !targetColumn) {
    return columns;
  }

  const cardIndex = sourceColumn.cards.findIndex((card) => card._id === cardId);
  if (cardIndex < 0) {
    return columns;
  }

  const [card] = sourceColumn.cards.splice(cardIndex, 1);
  card.columnId = targetColumnId;
  targetColumn.cards.splice(targetIndex, 0, card);
  return next;
}

export function ContextPlanningBoard({
  contextType,
  contextId,
  readOnly = false,
}: ContextPlanningBoardProps) {
  const [columns, setColumns] = useState<IContextBoardColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [addingColumn, setAddingColumn] = useState(false);
  const [addingCardColumnId, setAddingCardColumnId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [dragState, setDragState] = useState<DragState>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const board = await boardApi.fetchContextBoard(contextType, contextId);
      setColumns(board.columns);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری بورد");
    } finally {
      setLoading(false);
    }
  }, [contextId, contextType]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addColumn() {
    if (!newColumnTitle.trim()) {
      showToast("نام ستون را وارد کنید");
      return;
    }

    setAddingColumn(true);
    try {
      const column = await boardApi.createBoardColumn(
        contextType,
        contextId,
        newColumnTitle.trim(),
      );
      setColumns((prev) => [...prev, column]);
      setNewColumnTitle("");
      showToast("ستون اضافه شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در افزودن ستون");
    } finally {
      setAddingColumn(false);
    }
  }

  async function addCard(columnId: string) {
    if (!newCardTitle.trim()) {
      showToast("عنوان کارت را وارد کنید");
      return;
    }

    try {
      const card = await boardApi.createBoardCard(columnId, {
        title: newCardTitle.trim(),
      });
      setColumns((prev) =>
        prev.map((column) =>
          column._id === columnId
            ? { ...column, cards: [...column.cards, card] }
            : column,
        ),
      );
      setNewCardTitle("");
      setAddingCardColumnId(null);
      showToast("کارت اضافه شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در افزودن کارت");
    }
  }

  async function removeCard(columnId: string, cardId: string) {
    if (!confirm("این کارت حذف شود؟")) return;

    try {
      await boardApi.deleteBoardCard(cardId);
      setColumns((prev) =>
        prev.map((column) =>
          column._id === columnId
            ? {
                ...column,
                cards: column.cards.filter((card) => card._id !== cardId),
              }
            : column,
        ),
      );
      showToast("کارت حذف شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در حذف کارت");
    }
  }

  async function removeColumn(columnId: string) {
    if (!confirm("این ستون حذف شود؟")) return;

    try {
      await boardApi.deleteBoardColumn(columnId);
      setColumns((prev) => prev.filter((column) => column._id !== columnId));
      showToast("ستون حذف شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در حذف ستون");
    }
  }

  async function handleDrop(
    targetColumnId: string,
    targetIndex?: number,
  ) {
    if (readOnly || !dragState) {
      return;
    }

    const { cardId, sourceColumnId } = dragState;
    const targetColumn = columns.find((column) => column._id === targetColumnId);
    const index =
      targetIndex ??
      (targetColumn ? targetColumn.cards.length : 0);

    const nextColumns = reorderColumns(
      columns,
      sourceColumnId,
      targetColumnId,
      cardId,
      index,
    );
    setColumns(nextColumns);
    setDragState(null);
    setDragOverColumnId(null);

    const updatedTarget = nextColumns.find(
      (column) => column._id === targetColumnId,
    );
    if (!updatedTarget) {
      return;
    }

    try {
      const board = await boardApi.reorderBoardCards(
        cardId,
        targetColumnId,
        updatedTarget.cards.map((card) => card._id),
      );
      setColumns(board.columns);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در جابه‌جایی کارت");
      void load();
    }
  }

  function handleDragStart(
    event: React.DragEvent<HTMLDivElement>,
    card: IContextBoardCard,
    columnId: string,
  ) {
    if (readOnly) {
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", card._id);
    setDragState({ cardId: card._id, sourceColumnId: columnId });
  }

  function formatDueDate(card: IContextBoardCard) {
    if (!card.dueYear || !card.dueMonth || !card.dueDay) {
      return null;
    }
    return formatJalaliDate(
      String(card.dueYear),
      String(card.dueMonth),
      String(card.dueDay),
    );
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-muted">
        در حال بارگذاری بورد…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">بورد برنامه‌ریزی</h2>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((column) => (
          <section
            key={column._id}
            className={`flex w-72 shrink-0 flex-col rounded-2xl border bg-surface-secondary/50 p-3 transition ${
              dragOverColumnId === column._id
                ? "border-accent ring-2 ring-accent/30"
                : "border-border/50"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              if (!readOnly) {
                setDragOverColumnId(column._id);
              }
            }}
            onDragLeave={() => setDragOverColumnId(null)}
            onDrop={(event) => {
              event.preventDefault();
              void handleDrop(column._id);
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-bold">{column.title}</h3>
              <span className="rounded-lg bg-background/70 px-2 py-0.5 text-xs text-muted">
                {column.cards.length}
              </span>
            </div>

            <div className="flex min-h-24 flex-1 flex-col gap-2">
              {column.cards.map((card, index) => (
                <div
                  key={card._id}
                  draggable={!readOnly}
                  onDragStart={(event) => handleDragStart(event, card, column._id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    void handleDrop(column._id, index);
                  }}
                  className={`rounded-xl border border-border/40 bg-background p-3 shadow-sm ${
                    readOnly ? "" : "cursor-grab active:cursor-grabbing"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-6">{card.title}</p>
                    {!readOnly ? (
                      <button
                        type="button"
                        className="shrink-0 text-muted hover:text-danger"
                        onClick={() => void removeCard(column._id, card._id)}
                        aria-label="حذف کارت"
                      >
                        <Trash size={14} />
                      </button>
                    ) : null}
                  </div>
                  {card.description ? (
                    <p className="mt-1 text-xs leading-5 text-muted">
                      {card.description}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted">
                    {card.assigneeName ? (
                      <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-accent">
                        {card.assigneeName}
                      </span>
                    ) : null}
                    {formatDueDate(card) ? (
                      <span className="rounded-md bg-surface-secondary px-1.5 py-0.5">
                        {formatDueDate(card)}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {!readOnly ? (
              addingCardColumnId === column._id ? (
                <div className="mt-2 space-y-2 rounded-xl border border-dashed border-border p-2">
                  <FormInput
                    label="عنوان کارت"
                    value={newCardTitle}
                    onChange={(event) => setNewCardTitle(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onPress={() => void addCard(column._id)}>
                      افزودن
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onPress={() => {
                        setAddingCardColumnId(null);
                        setNewCardTitle("");
                      }}
                    >
                      انصراف
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onPress={() => setAddingCardColumnId(column._id)}
                >
                  <Add size={14} />
                  کارت جدید
                </Button>
              )
            ) : null}

            {!readOnly && columns.length > 1 ? (
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1 text-xs text-muted hover:text-danger"
                onClick={() => void removeColumn(column._id)}
              >
                <CloseCircle size={14} />
                حذف ستون
              </button>
            ) : null}
          </section>
        ))}

        {!readOnly ? (
          <section className="flex w-72 shrink-0 flex-col rounded-2xl border border-dashed border-border/70 bg-background/40 p-3">
            <FormInput
              label="ستون جدید"
              placeholder="مثلاً بررسی"
              value={newColumnTitle}
              onChange={(event) => setNewColumnTitle(event.target.value)}
            />
            <Button
              className="mt-2"
              size="sm"
              variant="secondary"
              onPress={() => void addColumn()}
              isPending={addingColumn}
            >
              <Add size={14} />
              افزودن ستون
            </Button>
          </section>
        ) : null}
      </div>
    </div>
  );
}
