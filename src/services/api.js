import axios from "axios";

/* ==========================================
   ⚙️ CẤU HÌNH API BASE
========================================== */
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5126/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false, // JWT lưu localStorage → không dùng cookie
});

/* ==========================================
   🔑 TOKEN HELPER
========================================== */
function getToken() {
  return localStorage.getItem("token");
}
function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}
function saveTokens(token, refreshToken) {
  if (token) localStorage.setItem("token", token);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
}
function clearTokens() {
  ["token", "refreshToken", "user"].forEach((k) =>
    localStorage.removeItem(k)
  );
}

/* ==========================================
   🔐 INTERCEPTOR REQUEST
   - Gắn Bearer Token vào Header
========================================== */
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/* ==========================================
   🔄 REFRESH TOKEN LOGIC
========================================== */
let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

/* ==========================================
   🚨 INTERCEPTOR RESPONSE
   - Tự động refresh token khi gặp 401
   - Chỉ logout nếu refresh cũng thất bại
========================================== */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      console.warn("🚫 Refresh token không hợp lệ hoặc đã hết hạn.");
      clearTokens();
      window.dispatchEvent(new Event("auth-expired"));
      return Promise.reject(error);
    }

    if (!isRefreshing) {
      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error("Không có refresh token.");

        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const { token: newToken, refreshToken: newRefresh } = res.data;

        if (!newToken) throw new Error("Phản hồi refresh token không hợp lệ.");

        saveTokens(newToken, newRefresh);
        onRefreshed(newToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        console.error("❌ Refresh token thất bại:", refreshError);

        clearTokens();
        window.dispatchEvent(new Event("auth-expired"));
        return Promise.reject(refreshError);
      }
    }

    return new Promise((resolve) => {
      addRefreshSubscriber((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        resolve(api(originalRequest));
      });
    });
  }
);

/* ==========================================
   📡 ĐỊNH NGHĨA ENDPOINTS CHUẨN
========================================== */
export const USER_API = {
  // 👤 CRUD
  GET_ALL: "/user",
  GET_BY_ID: (id) => `/user/${id}`,
  UPDATE: (id) => `/user/${id}`,
  DELETE: (id) => `/user/${id}`,

  // 👤 Thông tin người dùng hiện tại
  CURRENT_USER: "/user/me",

  // 🖼️ Avatar
  UPLOAD_AVATAR: (id) => `/user/${id}/avatar`,

  // 🔐 Auth & 2FA
  REGISTER: "/user/register",
  LOGIN: "/user/login",
  VERIFY_2FA: "/user/verify-2fa",
  RESEND_2FA: "/user/resend-2fa",
  TOGGLE_2FA: "/user/toggle-2fa",
  GET_2FA_STATUS: "/user/2fa-status", // endpoint kiểm tra trạng thái 2FA

  // 🔄 Reset password
  SEND_RESET_CODE: "/user/send-reset-code",
  RESEND_RESET_CODE: "/user/resend-reset-code",
  RESET_PASSWORD: "/user/reset-password",
  CHANGE_PASSWORD: "/user/change-password",
};

export default api;
