export interface INoteCategory {
  _id: string;
  title: string;
}

export type NoteDuration = "daily" | "monthly" | "yearly" | "general";

export interface IUserNote {
  _id: string;
  text: string;
  done: boolean;
  duration: NoteDuration;
  year: number;
  month: number;
  day?: number;
  category?: INoteCategory | string | null;
  createdAt?: string;
}
