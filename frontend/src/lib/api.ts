import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;

type FailedRequest = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let failedQueue: FailedRequest[] = [];

const processQueue = (
  error: unknown,
  token: string | null = null
) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });

  failedQueue = [];
};

/*
 * Attach access token to every request.
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {
      delete config.headers["Content-Type"];
    }

    if (typeof window !== "undefined") {
      const accessToken =
        localStorage.getItem("access_token");

      if (accessToken) {
        config.headers.Authorization =
          `Bearer ${accessToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/*
 * Automatically refresh access token on 401.
 */
api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry
    ) {
      return Promise.reject(error);
    }

    /*
     * Never try to refresh the login/refresh endpoints
     * themselves.
     */
    const requestUrl = originalRequest?.url || "";

    if (
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/token") ||
      requestUrl.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    if (typeof window === "undefined") {
      return Promise.reject(error);
    }

    const refreshToken =
      localStorage.getItem("refresh_token");

    if (!refreshToken) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");

      return Promise.reject(error);
    }

    /*
     * If another request is already refreshing,
     * wait for that request instead of sending
     * multiple refresh requests.
     */
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization =
              `Bearer ${token}`;

            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await axios.post(
        `${API_URL}/api/auth/refresh`,
        {
          refresh_token: refreshToken,
        }
      );

      const {
        access_token,
        refresh_token: newRefreshToken,
        user,
      } = refreshResponse.data;

      /*
       * Store rotated tokens.
       */
      localStorage.setItem(
        "access_token",
        access_token
      );

      localStorage.setItem(
        "refresh_token",
        newRefreshToken
      );

      if (user) {
        localStorage.setItem(
          "user",
          JSON.stringify(user)
        );
      }

      processQueue(null, access_token);

      originalRequest.headers.Authorization =
        `Bearer ${access_token}`;

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;