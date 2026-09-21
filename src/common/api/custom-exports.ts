import { axiosInstance } from "@/common/axiosInstance";
import type { ExportField, ExportTemplate } from "@/common/interfaces/export-template.interface";

export async function fetchExportFields(source: string) {
  const { data } = await axiosInstance.get<ExportField[]>("/exports/fields", { params: { source } });
  return data;
}

export async function fetchExportTemplates() {
  const { data } = await axiosInstance.get<ExportTemplate[]>("/exports/templates");
  return data;
}

export async function createExportTemplate(payload: Omit<ExportTemplate, "_id" | "user">) {
  const { data } = await axiosInstance.post<ExportTemplate>("/exports/templates", payload);
  return data;
}

export async function updateExportTemplate(id: string, payload: Omit<ExportTemplate, "_id" | "user">) {
  const { data } = await axiosInstance.patch<ExportTemplate>(`/exports/templates/${id}`, payload);
  return data;
}

export async function deleteExportTemplate(id: string) {
  await axiosInstance.delete(`/exports/templates/${id}`);
}

export async function inspectExportExcel(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await axiosInstance.post<{ sheetName: string; headerRow: number; headers: string[]; rows: string[][]; fields: ExportField[] }>("/exports/templates/inspect-excel", form, { headers: { "Content-Type": "multipart/form-data" } });
  return data;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadExport(id: string, format: "xlsx" | "pdf") {
  const response = await axiosInstance.get(`/exports/templates/${id}/export`, { params: { format }, responseType: "blob" });
  const blob = new Blob([response.data], { type: format === "pdf" ? "text/html" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  if (format === "pdf") {
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (printWindow) {
      const timer = window.setInterval(() => {
        if (printWindow.closed) {
          window.clearInterval(timer);
          URL.revokeObjectURL(url);
          return;
        }
        try {
          printWindow.focus();
          printWindow.print();
          window.clearInterval(timer);
        } catch {
          // The browser may not have finished loading the blob yet.
        }
      }, 400);
    }
    return;
  }
  downloadBlob(blob, "pdesk-export.xlsx");
}
