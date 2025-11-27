import api, { USER_API } from "./api";

const userService = {
  /* ===========================
     👤 NGƯỜI DÙNG
  ============================ */

  // 📋 Lấy toàn bộ user (Admin)
  getAll() {
    return api.get(USER_API.GET_ALL);
  },

  // 🔍 Lấy user theo ID
  getById(id) {
    return api.get(USER_API.GET_BY_ID(id));
  },

  // 👤 Lấy thông tin user hiện tại (từ token)
  getCurrentUser() {
    return api.get(USER_API.CURRENT_USER);
  },

  // ✏️ Cập nhật user
  update(id, data) {
    return api.put(USER_API.UPDATE(id), data);
  },

  // 🖼 Upload avatar
  uploadAvatar(id, file) {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.post(USER_API.UPLOAD_AVATAR(id), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // ❌ Xóa user
  delete(id) {
    // Backend route: DELETE /api/user/{id}
    return api.delete(USER_API.DELETE(id));
  },

  /* ===========================
     🔐 XÁC THỰC (AUTH)
  ============================ */

  // 🧾 Đăng ký
  register(data) {
    return api.post(USER_API.REGISTER, data);
  },

  // 🔑 Đăng nhập (có thể yêu cầu 2FA)
  login(credentials) {
    return api.post(USER_API.LOGIN, credentials);
  },

  // 🔢 Xác thực mã 2FA
  verify2FA(email, code) {
    return api.post(USER_API.VERIFY_2FA, { email, code });
  },

  // 🔁 Gửi lại mã 2FA
  resend2FA(email) {
    return api.post(USER_API.RESEND_2FA, { email });
  },

  // ⚙️ Bật / tắt 2FA (cần mật khẩu xác minh)
  toggle2FA(password) {
    return api.post(USER_API.TOGGLE_2FA, { password });
  },

  // 📊 Kiểm tra trạng thái 2FA hiện tại của người dùng
  get2FAStatus() {
    return api.get(USER_API.GET_2FA_STATUS);
  },
};

export default userService;
