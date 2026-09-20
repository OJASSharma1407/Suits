import axios from "axios";

// Create an Axios instance with base URL and default headers
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

import { useAIModeStore } from "@/store/ai-mode-store";

// Request interceptor to attach access token and AI provider header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach active AI provider header
    try {
      const effective = useAIModeStore.getState().getEffectiveProvider();
      if (effective === "local" && config.headers) {
        config.headers["X-AI-Provider"] = "ollama";
      }
    } catch {
      // Store may not be initialized yet
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh / 401s and AI rate limit fallbacks
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle Online AI rate limits / quota exhaustion
    const isAiLimitError =
      error.response?.status === 429 ||
      error.response?.data?.error_code === "ONLINE_AI_LIMIT_REACHED" ||
      error.response?.data?.can_switch_to_ollama ||
      (typeof error.response?.data?.message === "string" &&
        /quota|rate limit|credits depleted|resource_exhausted/i.test(
          error.response.data.message
        ));

    if (isAiLimitError && !originalRequest._aiRetry) {
      originalRequest._aiRetry = true;
      const message =
        error.response?.data?.message ||
        "Online AI rate limit or quota reached. Would you like to switch to Local Ollama (Qwen 7B)?";
      useAIModeStore.getState().triggerLimitModal(message, () => {
        if (originalRequest.headers) {
          originalRequest.headers["X-AI-Provider"] = "ollama";
        }
        return api(originalRequest);
      });
      return Promise.reject(error);
    }

    // If error is 401 and we haven't retried this request yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          // Attempt to refresh the token
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/auth/refresh`,
            { refresh_token: refreshToken }
          );

          const newAccessToken = res.data?.data?.access_token;
          const newRefreshToken = res.data?.data?.refresh_token;

          if (newAccessToken) {
            localStorage.setItem("access_token", newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem("refresh_token", newRefreshToken);
            }
            
            // Retry the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // If refresh fails, force logout
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          // Optionally trigger a logout event or redirect to /login
          window.dispatchEvent(new Event("auth:logout"));
        }
      } else {
        // No refresh token, force logout
        localStorage.removeItem("access_token");
        window.dispatchEvent(new Event("auth:logout"));
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
