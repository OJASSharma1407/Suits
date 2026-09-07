import axios from "axios";

// Create an Axios instance with base URL and default headers
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh / 401s
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

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
