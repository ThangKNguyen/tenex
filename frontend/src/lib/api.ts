/**
 * Axios instance with JWT auth header injected automatically.
 * All API calls go through here — no raw fetch/axios in components.
 */

import axios from "axios";
import { useAuthStore } from "@/store/authStore";

export const apiClient = axios.create({ baseURL: "" });

// Attach the JWT token to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear the token so the user is redirected to login.
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
