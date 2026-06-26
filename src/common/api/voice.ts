import { axiosInstance } from "@/common/axiosInstance";
import type {
  VoiceExecuteResponse,
  VoiceInterpretResponse,
  VoiceLogListResponse,
} from "@/common/interfaces/voice.interface";

export async function interpretVoice(transcript: string) {
  const { data } = await axiosInstance.post<VoiceInterpretResponse>(
    "/voice/interpret",
    { transcript },
  );
  return data;
}

export async function executeVoice(logId: string) {
  const { data } = await axiosInstance.post<VoiceExecuteResponse>(
    "/voice/execute",
    { logId },
  );
  return data;
}

export async function cancelVoice(logId: string) {
  const { data } = await axiosInstance.post<{ log: VoiceInterpretResponse["log"] }>(
    "/voice/cancel",
    { logId },
  );
  return data;
}

export async function fetchAdminVoiceLogs(params: {
  page?: number;
  limit?: number;
  status?: string;
  intent?: string;
  userId?: string;
}) {
  const { data } = await axiosInstance.get<VoiceLogListResponse>(
    "/admin/voice-logs",
    {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 30,
        status: params.status || undefined,
        intent: params.intent || undefined,
        userId: params.userId || undefined,
      },
    },
  );
  return data;
}
