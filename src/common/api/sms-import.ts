import { axiosInstance } from "@/common/axiosInstance";
import type { SmsRules } from "@/common/utils/sms-parser";

export interface ISmsFormat {
  _id: string;
  name: string;
  sender?: string;
  bankName?: string;
  rules: SmsRules;
  enabled: boolean;
}

export const MAX_SMS_FORMATS = 20;

export async function fetchSmsFormats() {
  const { data } = await axiosInstance.get<{ formats: ISmsFormat[] }>("/sms-import/formats");
  return data.formats;
}

export async function createSmsFormat(payload: {
  name: string;
  sender?: string;
  bankName?: string;
  rules: SmsRules;
}) {
  const { data } = await axiosInstance.post<{ format: ISmsFormat }>("/sms-import/formats", payload);
  return data.format;
}

export async function updateSmsFormat(
  id: string,
  payload: { name?: string; sender?: string; bankName?: string; rules?: SmsRules; enabled?: boolean },
) {
  const { data } = await axiosInstance.put<{ format: ISmsFormat }>(`/sms-import/formats/${id}`, payload);
  return data.format;
}

export async function deleteSmsFormat(id: string) {
  await axiosInstance.delete(`/sms-import/formats/${id}`);
}

export type SmsImportItem = {
  ref: string;
  /** "0" = income, "1" = cost */
  type: "0" | "1";
  price: string;
  year: string;
  month: string;
  day: string;
  description?: string;
  cardLastFour?: string;
};

export async function importSmsItems(items: SmsImportItem[]) {
  const { data } = await axiosInstance.post<{
    importedCount: number;
    skippedDuplicates: number;
    failed: number;
    createdBudgetIds: string[];
  }>("/sms-import/import", { items });
  return data;
}
