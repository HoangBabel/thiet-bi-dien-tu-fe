import axios from "axios";

const API_URL = "https://localhost:44303/api/Reviews";

/**
 * Lấy JWT token
 */
function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Helper xử lý request
 * → trả nguyên response backend (success / error / code / remainingSeconds...)
 */
async function handleRequest(promise) {
  try {
    const res = await promise;
    return res.data;
  } catch (err) {
    const backendError = err?.response?.data;
    console.error("Review Service Error:", backendError || err.message);

    throw backendError || {
      error: "NETWORK_ERROR",
      detail: err.message
    };
  }
}

/**
 * Build query string cho devUserId
 */
function withDevUser(devUserId) {
  return devUserId ? { params: { devUserId } } : {};
}

export default {
  /* ============================
   * LẤY REVIEW
   * ============================ */

  // Lấy review của sản phẩm
  async getProductReviews(productId) {
    return handleRequest(
      axios.get(`${API_URL}/product/${productId}`, {
        headers: authHeader()
      })
    );
  },

  // Lấy review của user hiện tại
  async getMyReviews(devUserId) {
    return handleRequest(
      axios.get(`${API_URL}/my-reviews`, {
        headers: authHeader(),
        ...withDevUser(devUserId)
      })
    );
  },

  /* ============================
   * TẠO / TƯƠNG TÁC REVIEW
   * ============================ */

  // Tạo review mới
  async createReview(dto, devUserId) {
    return handleRequest(
      axios.post(API_URL, dto, {
        headers: {
          ...authHeader(),
          "Content-Type": "application/json"
        },
        ...withDevUser(devUserId)
      })
    );
  },

  // Cập nhật review (chỉ trong 7 ngày)
  async updateReview(id, dto, devUserId) {
    return handleRequest(
      axios.put(`${API_URL}/${id}`, dto, {
        headers: {
          ...authHeader(),
          "Content-Type": "application/json"
        },
        ...withDevUser(devUserId)
      })
    );
  },

  // Reply review
  async replyReview(reviewId, dto, devUserId) {
    return handleRequest(
      axios.post(`${API_URL}/${reviewId}/reply`, dto, {
        headers: {
          ...authHeader(),
          "Content-Type": "application/json"
        },
        ...withDevUser(devUserId)
      })
    );
  },

  /* ============================
   * XÓA REVIEW
   * ============================ */

  // Xóa review (Owner hoặc Admin)
  async deleteReview(id, devUserId) {
    return handleRequest(
      axios.delete(`${API_URL}/${id}`, {
        headers: authHeader(),
        ...withDevUser(devUserId)
      })
    );
  },

  /* ============================
   * ANTI-SPAM / BAN
   * ============================ */

  // Kiểm tra trạng thái ban
  async getBanStatus(devUserId) {
    return handleRequest(
      axios.get(`${API_URL}/ban-status`, {
        headers: authHeader(),
        ...withDevUser(devUserId)
      })
    );
  }
};
