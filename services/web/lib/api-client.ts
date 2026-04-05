import axios from "axios";
import { config } from "./config";

/**
 * Axios instance with base configuration
 */
export const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (requestConfig) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Skip auto-redirect if the session manager is handling the token lifecycle
      const sessionManaged =
        typeof window !== "undefined" && (window as any).__sessionManaged;
      if (!sessionManaged && typeof window !== "undefined") {
        localStorage.removeItem("token");
        const currentPath = window.location.pathname;
        const redirectTo =
          currentPath !== "/" &&
          currentPath !== "/login" &&
          currentPath !== "/signup"
            ? `?redirectTo=${encodeURIComponent(currentPath)}`
            : "";
        window.location.href = `/login${redirectTo}`;
      }
    }
    return Promise.reject(error);
  },
);
