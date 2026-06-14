import axios from "axios";

import { BASE_API_URL, SERVER_BASE_API_URL } from "../constants";
import { forceAuthLogout } from "../utils/force-auth-logout";
import { toEnglishDigits } from "../utils/persian-digits";
import { storage } from "../utils/storage";

const isServer = typeof window === "undefined";

function normalizeDigitsDeep(value: unknown): unknown {
  if (typeof value === "string") {
    return toEnglishDigits(value);
  }
  if (Array.isArray(value)) {
    return value.map(normalizeDigitsDeep);
  }
  if (value !== null && typeof value === "object" && !(value instanceof FormData)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeDigitsDeep(entry)]),
    );
  }
  return value;
}

export const axiosInstance = axios.create({
  baseURL: isServer ? SERVER_BASE_API_URL : BASE_API_URL,
});

axiosInstance.interceptors.request.use((config) => {
  if (config.params) {
    config.params = normalizeDigitsDeep(config.params) as typeof config.params;
  }
  if (
    config.data &&
    typeof config.data === "object" &&
    !(config.data instanceof FormData)
  ) {
    config.data = normalizeDigitsDeep(config.data);
  }

  if (!isServer) {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

if (!isServer) {

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        forceAuthLogout();
      }
      return Promise.reject(error);
    },
  );
}
