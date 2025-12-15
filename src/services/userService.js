// userService.js
import axios from "axios";

import api, { USER_API } from "./api"; // import api instance đã config sẵn axios

const userService = {
  /* ===========================
        👤 NGƯỜI DÙNG
  ============================ */

  getAll() {
    return api.get(USER_API.GET_ALL);
  },

  getById(id) {
    return api.get(USER_API.GET_BY_ID(id));
  },

  getCurrentUser() {
    return api.get(USER_API.CURRENT_USER);
  },

  update(id, data) {
    return api.put(USER_API.UPDATE(id), data);
  },

  uploadAvatar(id, file) {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.post(USER_API.UPLOAD_AVATAR(id), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  delete(id) {
    return api.delete(USER_API.DELETE(id));
  },

  /* ===========================
       🔐 AUTHENTICATION
  ============================ */

  register(data) {
    return api.post(USER_API.REGISTER, data);
  },

  login(credentials) {
    return api.post(USER_API.LOGIN, credentials);
  },

  verify2FA(email, code) {
    return api.post(USER_API.VERIFY_2FA, { email, code });
  },

  resend2FA(email) {
    return api.post(USER_API.RESEND_2FA, { email });
  },

  toggle2FA(password) {
    return api.post(USER_API.TOGGLE_2FA, { password });
  },

  get2FAStatus() {
    return api.get(USER_API.GET_2FA_STATUS);
  },

  /* ===========================
      🔄 RESET PASSWORD
  ============================ */

  sendResetCode(email) {
    return api.post(USER_API.SEND_RESET_CODE, { email });
  },

  resendResetCode(email) {
    return api.post(USER_API.RESEND_RESET_CODE, { email });
  },

  resetPassword(email, code, newPassword, confirmPassword) {
    return api.post(USER_API.RESET_PASSWORD, {
      email,
      code,
      newPassword,
      confirmPassword,
    });
  },

/* ===========================
      🔑 CHANGE PASSWORD
=========================== */
changePassword(currentPassword, newPassword, confirmPassword) {
  return api.post(USER_API.CHANGE_PASSWORD, {
    currentPassword,
    newPassword,
    confirmPassword,
  });
}

};

export default userService;
