import axios from "axios";

import { axiosInstance } from "@/common/axiosInstance";
import type {
  ExportCenterMeta,
  ExportFormat,
  ExportHistoryItem,
  ExportPresetItem,
  ExportPreview,
  ExportRequest,
} from "@/common/interfaces/export-center.interface";
import { getApiErrorMessage } from "@/common/utils/api-error";

export async function fetchExportMeta() {
  const { data } = await axiosInstance.get<ExportCenterMeta>("/export-center/meta");
  return data;
}

export async function fetchExportPreview(request: ExportRequest, signal?: AbortSignal) {
  const { data } = await axiosInstance.post<ExportPreview>("/export-center/preview", request, { signal });
  return data;
}

const EXTENSIONS: Record<string, string> = {
  "application/zip": "zip",
  "text/csv": "csv",
  "text/html": "html",
};

/** Errors of blob requests arrive as a Blob; read the server's message out of it. */
async function blobErrorMessage(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const parsed = JSON.parse(await error.response.data.text()) as { message?: string | string[] };
      const message = Array.isArray(parsed.message) ? parsed.message[0] : parsed.message;
      if (message) return message;
    } catch {
      /* not JSON */
    }
  }
  return getApiErrorMessage(error);
}

export interface ExportFile {
  blob: Blob;
  filename: string;
  rows: number;
}

export async function downloadExportFile(
  request: ExportRequest,
  format: ExportFormat,
  presetId?: string,
): Promise<ExportFile> {
  try {
    const response = await axiosInstance.post<Blob>(
      "/export-center/download",
      { ...request, format, ...(presetId ? { presetId } : {}) },
      { responseType: "blob" },
    );
    const type = String(response.headers["content-type"] ?? "").split(";")[0];
    const extension = EXTENSIONS[type] ?? format;
    const single = request.sources.length === 1 ? request.sources[0].key : "report";
    const stamp = new Date().toISOString().slice(0, 10);
    return {
      blob: response.data,
      filename: `pdesk-${single}-${stamp}.${extension}`,
      rows: Number(response.headers["x-export-rows"] ?? 0) || 0,
    };
  } catch (error) {
    throw new Error(await blobErrorMessage(error));
  }
}

export function saveExportFile(file: ExportFile) {
  const url = URL.createObjectURL(file.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Opens the printable report in a new tab (the user prints / saves as PDF there). */
export function openExportReport(file: ExportFile) {
  const url = URL.createObjectURL(new Blob([file.blob], { type: "text/html" }));
  const opened = window.open(url, "_blank");
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
  return Boolean(opened);
}

export async function fetchExportPresets() {
  const { data } = await axiosInstance.get<ExportPresetItem[]>("/export-center/presets");
  return data;
}

export type ExportPresetPayload = {
  name: string;
  description?: string;
  format: ExportFormat;
  favorite?: boolean;
  config: ExportRequest;
};

export async function createExportPreset(payload: ExportPresetPayload) {
  const { data } = await axiosInstance.post<ExportPresetItem>("/export-center/presets", payload);
  return data;
}

export async function updateExportPreset(id: string, payload: ExportPresetPayload) {
  const { data } = await axiosInstance.patch<ExportPresetItem>(`/export-center/presets/${id}`, payload);
  return data;
}

export async function deleteExportPreset(id: string) {
  await axiosInstance.delete(`/export-center/presets/${id}`);
}

export async function fetchExportHistory() {
  const { data } = await axiosInstance.get<ExportHistoryItem[]>("/export-center/history");
  return data;
}

export async function clearExportHistory() {
  await axiosInstance.delete("/export-center/history");
}
