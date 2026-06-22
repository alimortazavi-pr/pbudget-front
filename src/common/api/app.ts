import axios from "axios";

import { BASE_API_URL } from "@/common/constants";
import type { AndroidAppInfo } from "@/common/interfaces/app.interface";

export async function fetchAndroidAppInfo(): Promise<AndroidAppInfo> {
  const { data } = await axios.get<AndroidAppInfo>(`${BASE_API_URL}/app/android`, {
    timeout: 12_000,
  });
  return data;
}
