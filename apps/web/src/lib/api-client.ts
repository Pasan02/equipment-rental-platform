import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Flag to prevent infinite refresh loops
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

export const clearAuthCookiesAndStorage = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    document.cookie = "auth_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "user_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
};

// Response Interceptor: Auto Refresh Token on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== "undefined") {
      // Avoid looping if the endpoint is login or refresh itself
      if (originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/refresh")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        isRefreshing = false;
        clearAuthCookiesAndStorage();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login?reason=expired";
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        localStorage.setItem("accessToken", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        // Keep cookies in sync with new access token
        document.cookie = `auth_token=${newAccessToken}; path=/; max-age=604800; SameSite=Lax`;

        apiClient.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthCookiesAndStorage();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login?reason=session_expired";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
