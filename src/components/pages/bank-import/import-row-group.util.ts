import type { ImportRowDraft } from "./import-row.types";

export type ImportRowGroup = {
  groupKey: string;
  documentNumber: string | null;
  rows: ImportRowDraft[];
  isPairedDocument: boolean;
};

export function groupImportRows(rows: ImportRowDraft[]): ImportRowGroup[] {
  const order: string[] = [];
  const buckets = new Map<string, ImportRowDraft[]>();

  for (const row of rows) {
    const documentNumber = row.documentNumber?.trim() || null;
    const groupKey = documentNumber ?? `row-${row.tempId}`;
    if (!buckets.has(groupKey)) {
      buckets.set(groupKey, []);
      order.push(groupKey);
    }
    buckets.get(groupKey)!.push(row);
  }

  return order.map((groupKey) => {
    const groupRows = buckets.get(groupKey) ?? [];
    const documentNumber =
      groupRows[0]?.documentNumber?.trim() || null;
    return {
      groupKey,
      documentNumber,
      rows: groupRows,
      isPairedDocument: Boolean(documentNumber) && groupRows.length > 1,
    };
  });
}
