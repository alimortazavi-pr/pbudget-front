import { axiosInstance } from "@/common/axiosInstance";
import type {
  ITransactionTemplate,
  TransactionTemplatePayload,
} from "@/common/interfaces/transaction-template.interface";

export const MAX_TEMPLATES = 40;

export async function fetchTemplates() {
  const { data } = await axiosInstance.get<{ templates: ITransactionTemplate[] }>(
    "/transaction-templates",
  );
  return data.templates;
}

export async function createTemplate(payload: TransactionTemplatePayload & { title: string; type: "0" | "1" }) {
  const { data } = await axiosInstance.post<{ template: ITransactionTemplate }>(
    "/transaction-templates",
    payload,
  );
  return data.template;
}

export async function updateTemplate(id: string, payload: TransactionTemplatePayload) {
  const { data } = await axiosInstance.put<{ template: ITransactionTemplate }>(
    `/transaction-templates/${id}`,
    payload,
  );
  return data.template;
}

export async function deleteTemplate(id: string) {
  await axiosInstance.delete(`/transaction-templates/${id}`);
}

/** Count a use (call after a transaction made from the template was saved). */
export async function markTemplateUsed(id: string) {
  await axiosInstance.post(`/transaction-templates/${id}/use`);
}
