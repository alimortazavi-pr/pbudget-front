"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { Add, CloseCircle, Maximize, Trash } from "iconsax-reactjs";

import * as boardApi from "@/common/api/context-board";
import type {
  IContextBoardCard,
  IContextBoardColumn,
} from "@/common/interfaces/context-board.interface";
import type { PartnerContextType } from "@/common/interfaces/partner.interface";
import {
  boardCardSurfaceStyle,
  boardColumnSurfaceStyle,
  resolveBoardColumnColor,
} from "@/common/utils/board-colors";
import { formatJalaliDate } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { FormInput } from "@/components/common/form/FormFields";
import { FullscreenOverlay } from "@/components/common/ui/FullscreenOverlay";
import { BoardColumnColorPicker } from "@/components/pages/planning/BoardColumnColorPicker";

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
  const { t } = useTranslation();
  const [columns, setColumns] = useState<IContextBoardColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [addingColumn, setAddingColumn] = useState(false);
  const [addingCardColumnId, setAddingCardColumnId] = useState<string | null>(null);
  const [colorPickerColumnId, setColorPickerColumnId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [dragState, setDragState] = useState<DragState>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [updatingColorId, setUpdatingColorId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const board = await boardApi.fetchContextBoard(contextType, contextId);
      setColumns(board.columns);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.k62fb27b530"));
    } finally {
      setLoading(false);
    }
  }, [contextId, contextType]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addColumn() {
    if (!newColumnTitle.trim()) {
      showToast(t("auto.k215e6163b4"));
      return;
    }

    setAddingColumn(true);
    try {
      const column = await boardApi.createBoardColumn(
        contextType,
        contextId,
        newColumnTitle.trim(),
      );
      setColumns((prev) => [...prev, { ...column, cards: column.cards ?? [] }]);
      setNewColumnTitle("");
      showToast(t("auto.k71dee9b0e3"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.k0f0c451776"));
    } finally {
      setAddingColumn(false);
    }
  }

  async function changeColumnColor(columnId: string, color: string) {
    setUpdatingColorId(columnId);
    try {
      const updated = await boardApi.updateBoardColumn(columnId, { color });
      setColumns((prev) =>
        prev.map((column) =>
          column._id === columnId ? { ...column, color: updated.color } : column,
        ),
      );
      setColorPickerColumnId(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.kfa02e8f59c"));
    } finally {
      setUpdatingColorId(null);
    }
  }

  async function addCard(columnId: string) {
    if (!newCardTitle.trim()) {
      showToast(t("auto.kbb4a67e1e7"));
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
      showToast(t("auto.kcb3af6bc54"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.k054a58a5d1"));
    }
  }

  async function removeCard(columnId: string, cardId: string) {
    if (!confirm(t("auto.kc8580f4320"))) return;

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
      showToast(t("auto.k4f3516862c"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.kbf37818067"));
    }
  }

  async function removeColumn(columnId: string) {
    if (!confirm(t("auto.kf32eb5b733"))) return;

    try {
      await boardApi.deleteBoardColumn(columnId);
      setColumns((prev) => prev.filter((column) => column._id !== columnId));
      showToast(t("auto.k25deee9f0b"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.kfe4b4a6a27"));
    }
  }

  async function handleDrop(targetColumnId: string, targetIndex?: number) {
    if (readOnly || !dragState) {
      return;
    }

    const { cardId, sourceColumnId } = dragState;
    const targetColumn = columns.find((column) => column._id === targetColumnId);
    const index =
      targetIndex ?? (targetColumn ? targetColumn.cards.length : 0);

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
      showToast(err instanceof Error ? err.message : t("auto.k50416723ae"));
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

  function renderColumn(
    column: IContextBoardColumn,
    index: number,
    expanded: boolean,
  ) {
    const columnColor = resolveBoardColumnColor(column.color, index);
    const columnStyle = boardColumnSurfaceStyle(column.color, index);

    return (
      <section
        key={column._id}
        className={`flex shrink-0 flex-col rounded-2xl border p-3 transition ${
          expanded ? "h-full max-h-full w-80" : "w-72"
        } ${
          dragOverColumnId === column._id
            ? "ring-2 ring-accent/40"
            : ""
        }`}
        style={columnStyle}
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
        <div className="shrink-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: columnColor }}
                />
                <h3 className="truncate font-bold">{column.title}</h3>
              </div>
              {!readOnly ? (
                <button
                  type="button"
                  className="mt-1 text-[11px] text-muted hover:text-foreground"
                  onClick={() =>
                    setColorPickerColumnId((current) =>
                      current === column._id ? null : column._id,
                    )
                  }
                >
                  {colorPickerColumnId === column._id ? t("auto.k6b7092b444") : t("auto.k062852b726")}
                </button>
              ) : null}
            </div>
            <span
              className="rounded-lg px-2 py-0.5 text-xs text-muted"
              style={{ backgroundColor: boardCardSurfaceStyle(column.color, index).backgroundColor }}
            >
              {column.cards.length}
            </span>
          </div>

          {!readOnly && colorPickerColumnId === column._id ? (
            <BoardColumnColorPicker
              compact
              value={columnColor}
              onChange={(color) => void changeColumnColor(column._id, color)}
            />
          ) : null}
          {updatingColorId === column._id ? (
            <p className="text-[11px] text-muted">{t("auto.k5c2be493b5")}</p>
          ) : null}
        </div>

        <div
          className={`mt-3 flex min-h-0 flex-col gap-2 ${
            expanded ? "flex-1 overflow-y-auto pr-1" : "min-h-24"
          }`}
        >
          {column.cards.map((card, cardIndex) => (
            <div
              key={card._id}
              draggable={!readOnly}
              onDragStart={(event) => handleDragStart(event, card, column._id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.stopPropagation();
                event.preventDefault();
                void handleDrop(column._id, cardIndex);
              }}
              className={`rounded-xl border p-3 shadow-sm ${
                readOnly ? "" : "cursor-grab active:cursor-grabbing"
              }`}
              style={boardCardSurfaceStyle(column.color, index)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-6">{card.title}</p>
                {!readOnly ? (
                  <button
                    type="button"
                    className="shrink-0 text-muted hover:text-danger"
                    onClick={() => void removeCard(column._id, card._id)}
                    aria-label={t("auto.k250472cb45")}
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
                  <span className="rounded-md bg-background/50 px-1.5 py-0.5 text-accent">
                    {card.assigneeName}
                  </span>
                ) : null}
                {formatDueDate(card) ? (
                  <span className="rounded-md bg-background/50 px-1.5 py-0.5">
                    {formatDueDate(card)}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 shrink-0">
          {!readOnly ? (
            addingCardColumnId === column._id ? (
              <div className="space-y-2 rounded-xl border border-dashed border-border/60 bg-background/40 p-2">
                <FormInput
                  label={t("auto.k1cb627075c")}
                  value={newCardTitle}
                  onChange={(event) => setNewCardTitle(event.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" onPress={() => void addCard(column._id)}>
                    {t("auto.k15f2d066f9")}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onPress={() => {
                      setAddingCardColumnId(null);
                      setNewCardTitle("");
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onPress={() => setAddingCardColumnId(column._id)}
              >
                <Add size={14} />
                {t("auto.k480ffe699b")}
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
              {t("auto.k5ff7975e00")}
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  function renderBoard(expanded: boolean) {
    if (expanded) {
      return (
        <div className="flex h-full min-h-0 items-stretch gap-3 pb-1">
          {columns.map((column, index) => renderColumn(column, index, true))}
          {!readOnly ? (
            <section className="flex h-full w-80 shrink-0 flex-col rounded-2xl border border-dashed border-border/70 bg-background/40 p-3">
              <FormInput
                label={t("auto.k70f0286075")}
                placeholder={t("auto.k3e35c13fa2")}
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
                {t("auto.k0d31d87b59")}
              </Button>
            </section>
          ) : null}
        </div>
      );
    }

    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((column, index) => renderColumn(column, index, false))}
        {!readOnly ? (
          <section className="flex w-72 shrink-0 flex-col rounded-2xl border border-dashed border-border/70 bg-background/40 p-3">
            <FormInput
              label={t("auto.k70f0286075")}
              placeholder={t("auto.k3e35c13fa2")}
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
              {t("auto.k0d31d87b59")}
            </Button>
          </section>
        ) : null}
      </div>
    );
  }

  function renderToolbar(expanded: boolean) {
    return (
      <div
        className={`flex shrink-0 items-center justify-between gap-3 ${
          expanded ? "border-b border-border/50 px-5 py-4" : ""
        }`}
      >
        <h2 className={expanded ? "text-xl font-bold" : "text-lg font-bold"}>
          {t("auto.k11dd432167")}
        </h2>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => setFullscreen((value) => !value)}
        >
          {expanded ? <CloseCircle size={16} /> : <Maximize size={16} />}
          {expanded ? t("auto.k1ca78d59b7") : t("auto.ka6a93e1b5d")}
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-muted">
        {t("auto.kb75ffcda6b")}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {renderToolbar(false)}
        {renderBoard(false)}
      </div>

      <FullscreenOverlay
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        title={t("auto.k11dd432167")}
      >
        <div className="flex h-dvh min-h-0 flex-col">
          {renderToolbar(true)}
          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden p-4 sm:p-5">
            {renderBoard(true)}
          </div>
        </div>
      </FullscreenOverlay>
    </>
  );
}
