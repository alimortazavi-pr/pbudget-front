export interface IContextBoardCard {
  _id: string;
  columnId: string;
  title: string;
  description: string;
  position: number;
  dueYear?: number;
  dueMonth?: number;
  dueDay?: number;
  assigneePartnerId?: string;
  assigneeName?: string;
}

export interface IContextBoardColumn {
  _id: string;
  title: string;
  position: number;
  color?: string;
  cards: IContextBoardCard[];
}

export interface IContextBoard {
  columns: IContextBoardColumn[];
}
