import { defineStore } from "pinia";
import userService from "@/services/userService";
import api from "@/services/api";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

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

    /* =====================================================
       📸 GET AVATAR URL – Fix cache, fix re-render reload
    ===================================================== */
    avatarUrl: (state) => {
      if (!state.user) return DEFAULT_AVATAR;

      let raw = state.user.avatarUrl || state.user.avatar;
      if (!raw) return DEFAULT_AVATAR;

      // Nếu là file nội bộ → chuẩn hóa URL
      if (!raw.startsWith("http")) {
        raw = raw.replace(/^\/+/, "");
        return `http://localhost:5126/${raw}`;
      }

      return raw; // Không thêm timestamp ở getter nữa
    },

    displayName: (state) =>
      state.user?.fullName ||
      state.user?.username ||
      "Tài khoản",
  },

  actions: {
    /* =====================================================
       🟢 ĐĂNG NHẬP
    ===================================================== */
    async login(email, password) {
      try {
        const res = await userService.login({ email, password });

        // 2FA
        if (res.data?.requiresTwoFactor || res.data?.requires2FA) {
          this.is2FARequired = true;
          this.pendingEmail = res.data.email || email;
          return { requires2FA: true, email: this.pendingEmail };
        }

        if (res.data?.token && res.data?.user) {
          await this.applyAuthData(res.data);
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
        if (!this.pendingEmail)
          throw new Error("Không tìm thấy email đang chờ xác thực.");

        const res = await userService.verify2FA(this.pendingEmail, code);
        const data = res.data || res;

        if (data?.token) {
          this.token = data.token;
          localStorage.setItem("token", data.token);
          const user = await this.fetchCurrentUser();

          await this.applyAuthData({ token: data.token, user });

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
       🧭 CẬP NHẬT AUTH SAU LOGIN / VERIFY2FA
    ===================================================== */
    async applyAuthData(data) {
      if (!data?.token || !data?.user)
        throw new Error("Phản hồi xác thực không hợp lệ.");

      const user = { ...data.user };
      user.role = this.mapRole(user.role);

      // Avatar chuẩn hóa
      user.avatar = data.user.avatarUrl ?? data.user.avatar ?? null;

      this.token = data.token;
      this.user = user;

      localStorage.setItem("token", this.token);
      localStorage.setItem("user", JSON.stringify(this.user));
    },

    /* =====================================================
       📸 CẬP NHẬT AVATAR – Fix cache đúng cách
    ===================================================== */
    async updateAvatar(file) {
      try {
        if (!this.userId) throw new Error("Không xác định được người dùng.");
        const res = await userService.uploadAvatar(this.userId, file);

        if (res.data?.avatarUrl) {
          // Chỉ thêm timestamp sau upload => tránh reload liên tục
          this.user.avatar = `${res.data.avatarUrl}?v=${Date.now()}`;
          localStorage.setItem("user", JSON.stringify(this.user));
        }

        return res.data;
      } catch (err) {
        console.error("❌ Lỗi cập nhật avatar:", err);
        throw err.response?.data || err;
      }
    },

    /* =====================================================
       ✏️ CẬP NHẬT HỒ SƠ
    ===================================================== */
    async updateProfile(data) {
      try {
        if (!this.userId) throw new Error("Không xác định được người dùng.");

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
       🟡 LOAD LOCAL STORAGE – Fix vòng lặp vô hạn
    ===================================================== */
    async loadFromStorage() {
      try {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "null");

        if (token && user) {
          this.token = token;
          this.user = user;

          // Chỉ fetch nếu user thiếu avatar → tránh vòng lặp + tối ưu
          if (!user.avatar && !user.avatarUrl) {
            await this.fetchCurrentUser();
          }
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

      ["token", "refreshToken", "user"].forEach((k) =>
        localStorage.removeItem(k)
      );
    },

    /* =====================================================
       🧩 ÁNH XẠ ROLE
    ===================================================== */
    mapRole(roleValue) {
      const map = { 0: "Admin", 1: "Staff", 2: "Customer", 3: "Shipper" };
      if (typeof roleValue === "number") return map[roleValue] || "User";

      if (typeof roleValue === "string" && /^\d+$/.test(roleValue))
        return map[Number(roleValue)] || "User";

      return roleValue || "User";
    },
  },
});
