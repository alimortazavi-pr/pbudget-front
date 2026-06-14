import axios from "axios";

import { BASE_API_URL, SERVER_BASE_API_URL } from "../constants";
import { forceAuthLogout } from "../utils/force-auth-logout";
import { storage } from "../utils/storage";

const isServer = typeof window === "undefined";

export const axiosInstance = axios.create({
  baseURL: isServer ? SERVER_BASE_API_URL : BASE_API_URL,
});

if (!isServer) {
  axiosInstance.interceptors.request.use((config) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

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
