import { axiosInstance } from "@/common/axiosInstance";
import type {
  IContextBoard,
  IContextBoardCard,
  IContextBoardColumn,
} from "@/common/interfaces/context-board.interface";
import type { PartnerContextType } from "@/common/interfaces/partner.interface";

function boardBase(contextType: PartnerContextType, contextId: string) {
  return contextType === "project"
    ? `/projects/${contextId}/board`
    : `/ventures/${contextId}/board`;
}

export async function fetchContextBoard(
  contextType: PartnerContextType,
  contextId: string,
) {
  const { data } = await axiosInstance.get<IContextBoard>(
    boardBase(contextType, contextId),
  );
  return data;
}

export async function createBoardColumn(
  contextType: PartnerContextType,
  contextId: string,
  title: string,
) {
  const { data } = await axiosInstance.post<{ column: IContextBoardColumn }>(
    `${boardBase(contextType, contextId)}/columns`,
    { title },
  );
  return data.column;
}

export async function updateBoardColumn(
  columnId: string,
  payload: { title?: string; position?: number },
) {
  const { data } = await axiosInstance.patch<{ column: IContextBoardColumn }>(
    `/context-board/columns/${columnId}`,
    payload,
  );
  return data.column;
}

export async function deleteBoardColumn(columnId: string) {
  await axiosInstance.delete(`/context-board/columns/${columnId}`);
}

export async function createBoardCard(
  columnId: string,
  payload: {
    title: string;
    description?: string;
    dueYear?: number;
    dueMonth?: number;
    dueDay?: number;
    assigneePartnerId?: string;
  },
) {
  const { data } = await axiosInstance.post<{ card: IContextBoardCard }>(
    `/context-board/columns/${columnId}/cards`,
    payload,
  );
  return data.card;
}

export async function updateBoardCard(
  cardId: string,
  payload: {
    title?: string;
    description?: string;
    columnId?: string;
    position?: number;
    dueYear?: number;
    dueMonth?: number;
    dueDay?: number;
    assigneePartnerId?: string | null;
  },
) {
  const { data } = await axiosInstance.patch<{ card: IContextBoardCard }>(
    `/context-board/cards/${cardId}`,
    payload,
  );
  return data.card;
}

export async function reorderBoardCards(
  cardId: string,
  columnId: string,
  cardIds: string[],
) {
  const { data } = await axiosInstance.post<IContextBoard>(
    `/context-board/cards/${cardId}/reorder`,
    { columnId, cardIds },
  );
  return data;
}

export async function deleteBoardCard(cardId: string) {
  await axiosInstance.delete(`/context-board/cards/${cardId}`);
}
