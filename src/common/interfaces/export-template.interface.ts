export type ExportSource = "budgets" | "debts" | "combined";
export type ExportColumnFormat = "text" | "number" | "date" | "currency";

export interface ExportField {
  key: string;
  label: string;
  sources: ExportSource[];
  format: ExportColumnFormat;
}

export interface ExportColumn {
  id: string;
  key: string;
  label: string;
  enabled: boolean;
  order: number;
  width: number;
  format: ExportColumnFormat;
  sourceHeader?: string;
}

export interface ExportCanvasElement {
  id: string;
  type: "text" | "field" | "shape" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  field?: string;
  fontSize?: number;
  color?: string;
  fill?: string;
  bold?: boolean;
  align?: "left" | "center" | "right";
  radius?: number;
  opacity?: number;
  imageDataUrl?: string;
}

export interface ExportTemplate {
  _id: string;
  user: string;
  name: string;
  description: string;
  source: ExportSource;
  columns: ExportColumn[];
  branding: {
    title: string;
    subtitle: string;
    primaryColor: string;
    textColor: string;
    backgroundColor: string;
    footer: string;
    logoDataUrl: string;
  };
  canvas: { width: number; height: number; backgroundColor: string; elements: ExportCanvasElement[] };
  importedHeaders: string[];
  importMapping: Record<string, string>;
  favorite: boolean;
}
