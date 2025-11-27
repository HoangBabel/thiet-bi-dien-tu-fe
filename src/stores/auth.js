import { defineStore } from "pinia";
import userService from "@/services/userService";
import api from "@/services/api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    token: null,
    is2FARequired: false,
    pendingEmail: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userId: (state) => state.user?.id || null,
    userRole: (state) => state.user?.role || "User",
  },

  actions: {
    /* =====================================================
       🟢 ĐĂNG NHẬP - BƯỚC 1
    ===================================================== */
    async login(email, password) {
      try {
        const res = await userService.login({ email, password });

        if (res.data?.requiresTwoFactor || res.data?.requires2FA) {
          this.is2FARequired = true;
          this.pendingEmail = res.data.email || email;
          return { requires2FA: true, email: this.pendingEmail };
        }

        if (res.data?.token && res.data?.user) {
          this.applyAuthData(res.data);
          return res.data;
        }

        throw new Error("Phản hồi đăng nhập không hợp lệ từ máy chủ.");
      } catch (err) {
        console.error("❌ Lỗi đăng nhập:", err);
        throw err.response?.data || err;
      }
    },

    /* =====================================================
       🔑 XÁC NHẬN MÃ 2FA
    ===================================================== */
   async verify2FA(code) {
  try {
    if (!this.pendingEmail) throw new Error("Không tìm thấy email đang chờ xác thực.");

    const res = await userService.verify2FA(this.pendingEmail, code);
    const data = res.data || res;

    if (data?.token) {
      // ✅ 1. Lưu token ngay lập tức
      this.token = data.token;
      localStorage.setItem("token", data.token);

      // ✅ 2. Gọi API lấy user (giờ đã có Authorization header)
      const user = await this.fetchCurrentUser();

      // ✅ 3. Hoàn tất xác thực
      this.applyAuthData({ token: data.token, user });
      this.is2FARequired = false;
      this.pendingEmail = null;

      return { token: data.token, user };
    }

    throw new Error("Phản hồi xác thực 2FA không hợp lệ.");
  } catch (err) {
    console.error("❌ Lỗi xác nhận mã OTP:", err);
    throw err.response?.data || err;
  }
},

    /* =====================================================
       📩 GỬI LẠI MÃ OTP
    ===================================================== */
    async resend2FA(emailParam) {
      try {
        const email = emailParam || this.pendingEmail;
        if (!email) throw new Error("Không có email để gửi lại mã OTP.");
        const res = await userService.resend2FA(email);
        return res.data;
      } catch (err) {
        console.error("❌ Lỗi gửi lại mã OTP:", err);
        throw err.response?.data || err;
      }
    },

    /* =====================================================
       🔁 BẬT / TẮT 2FA
    ===================================================== */
    async toggle2FA(password) {
      try {
        const res = await userService.toggle2FA(password);
        if (res.data?.isTwoFactorEnabled !== undefined) {
          this.user.isTwoFactorEnabled = res.data.isTwoFactorEnabled;
          localStorage.setItem("user", JSON.stringify(this.user));
        }
        return res.data;
      } catch (err) {
        console.error("❌ Lỗi toggle 2FA:", err);
        throw err.response?.data || err;
      }
    },

    /* =====================================================
       🔍 LẤY TRẠNG THÁI 2FA
    ===================================================== */
    async get2FAStatus() {
      try {
        const res = await userService.get2FAStatus();
        if (res.data?.isTwoFactorEnabled !== undefined) {
          this.user.isTwoFactorEnabled = res.data.isTwoFactorEnabled;
          localStorage.setItem("user", JSON.stringify(this.user));
        }
        return res.data;
      } catch (err) {
        console.error("❌ Lỗi lấy trạng thái 2FA:", err);
        throw err.response?.data || err;
      }
    },

    /* =====================================================
       🧭 ÁP DỮ LIỆU AUTH SAU LOGIN / VERIFY2FA
    ===================================================== */
    applyAuthData(data) {
      if (!data?.token || !data?.user)
        throw new Error("Phản hồi xác thực không hợp lệ.");

      const user = { ...data.user };
      user.role = this.mapRole(user.role);
      user.avatar = data.user.avatarUrl || data.user.avatar || null;

      this.token = data.token;
      this.user = user;

      localStorage.setItem("token", this.token);
      localStorage.setItem("user", JSON.stringify(this.user));
    },

    /* =====================================================
       📸 CẬP NHẬT ẢNH ĐẠI DIỆN
    ===================================================== */
    async updateAvatar(file) {
      try {
        if (!this.userId) throw new Error("Không xác định được người dùng hiện tại.");
        const res = await userService.uploadAvatar(this.userId, file);
        if (res.data?.avatarUrl) {
          this.user.avatar = res.data.avatarUrl;
          localStorage.setItem("user", JSON.stringify(this.user));
        }
        return res.data;
      } catch (err) {
        console.error("❌ Lỗi cập nhật avatar:", err);
        throw err.response?.data || err;
      }
    },

    /* =====================================================
       ✏️ CẬP NHẬT THÔNG TIN HỒ SƠ
    ===================================================== */
    async updateProfile(data) {
      try {
        if (!this.userId) throw new Error("Không xác định được người dùng hiện tại.");
        const res = await userService.update(this.userId, data);
        if (res.data) {
          this.user = { ...this.user, ...res.data };
          localStorage.setItem("user", JSON.stringify(this.user));
        }
        return res.data;
      } catch (err) {
        console.error("❌ Lỗi cập nhật thông tin:", err);
        throw err.response?.data || err;
      }
    },

    /* =====================================================
       👤 LẤY USER HIỆN TẠI
    ===================================================== */
    async fetchCurrentUser() {
      try {
        const res = await userService.getCurrentUser();
        if (res.data) {
          this.user = res.data;
          localStorage.setItem("user", JSON.stringify(this.user));
        }
        return res.data;
      } catch (err) {
        console.error("❌ Lỗi lấy thông tin người dùng:", err);
        throw err.response?.data || err;
      }
    },

    /* =====================================================
       🔄 REFRESH TOKEN
    ===================================================== */
    async refreshToken() {
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("Không tìm thấy refresh token.");

        const res = await api.post("/auth/refresh", { refreshToken });
        if (!res.data?.token) throw new Error("Refresh token thất bại.");

        this.token = res.data.token;
        localStorage.setItem("token", res.data.token);
        return res.data.token;
      } catch (err) {
        console.error("❌ Lỗi refresh token:", err);
        this.logout();
        throw err.response?.data || err;
      }
    },

    /* =====================================================
       🟢 ĐĂNG KÝ
    ===================================================== */
    async register(data) {
      try {
        const res = await userService.register(data);
        return res.data;
      } catch (err) {
        console.error("❌ Lỗi đăng ký:", err);
        throw err.response?.data || err;
      }
    },

    /* =====================================================
       🟡 LOAD LOCAL STORAGE
    ===================================================== */
    loadFromStorage() {
      try {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (token && user) {
          this.token = token;
          this.user = user;
        } else {
          this.logout();
        }
      } catch (err) {
        console.warn("⚠️ Lỗi khi đọc localStorage:", err);
        this.logout();
      }
    },

    /* =====================================================
       🔴 ĐĂNG XUẤT
    ===================================================== */
    logout() {
      this.token = null;
      this.user = null;
      this.is2FARequired = false;
      this.pendingEmail = null;
      ["token", "refreshToken", "user"].forEach((k) => localStorage.removeItem(k));
    },

    /* =====================================================
       🧩 ÁNH XẠ ROLE
    ===================================================== */
    mapRole(roleValue) {
      const map = { 0: "Admin", 1: "Staff", 2: "Customer", 3: "Shipper" };
      if (typeof roleValue === "number") return map[roleValue] || "User";
      if (typeof roleValue === "string" && /^\d+$/.test(roleValue))
        return map[Number(roleValue)] || roleValue;
      return roleValue || "User";
    },
  },
});
