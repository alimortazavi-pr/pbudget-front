export interface INoteCategory {
  _id: string;
  title: string;
}

export type NoteDuration = "daily" | "monthly" | "yearly" | "general";
export type NoteLineType = "text" | "checkbox";

export interface INoteLineReminder {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  beforeMinutes?: number;
  sentBefore?: boolean;
  sentAt?: boolean;
}

export interface INoteLine {
  id: string;
  type: NoteLineType;
  text: string;
  done?: boolean;
  reminder?: INoteLineReminder | null;
}

export interface IUserNote {
  _id: string;
  items: INoteLine[];
  duration: NoteDuration;
  year: number;
  month: number;
  day: number;
  category?: INoteCategory | string | null;
  createdAt?: string;
  updatedAt?: string;
}
