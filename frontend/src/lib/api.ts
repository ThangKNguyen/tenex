/**
 * Axios instance with JWT auth header injected automatically.
 * All API calls go through here — no raw fetch/axios in components.
 */

import axios from "axios";
import { useAuthStore } from "@/store/authStore";

// In dev, Vite's proxy handles routing to the backend.
// In production, VITE_API_URL points to the deployed backend.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

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
