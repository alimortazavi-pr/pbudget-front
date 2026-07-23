import type { IDebt } from "@/common/interfaces/debt.interface";

export function normalizePersonName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Exact person match (trim + collapse spaces), case-insensitive. */
export function filterDebtsByExactPerson(debts: IDebt[], person: string) {
  const key = normalizePersonName(person);
  if (!key) return [];
  return debts.filter((debt) => normalizePersonName(debt.person) === key);
}

export async function fetchOpenDebtsForPerson(
  fetchDebts: (params?: {
    status?: string;
    type?: string;
    person?: string;
    currency?: string;
  }) => Promise<{ debts: IDebt[] } | IDebt[]>,
  person: string,
  type?: string,
  currency?: string,
) {
  const trimmed = person.trim();
  if (!trimmed) return [] as IDebt[];

  const result = await fetchDebts({
    status: "open",
    person: trimmed,
    ...(type ? { type } : {}),
    ...(currency ? { currency } : {}),
  });
  const debts = Array.isArray(result) ? result : result.debts;
  const exact = filterDebtsByExactPerson(debts, trimmed);
  if (!currency) return exact;
  const resolved = currency.trim().toLowerCase();
  return exact.filter(
    (debt) => (debt.currency ?? "toman").toLowerCase() === resolved,
  );
}
