import axios from "axios";

const API_URL = "https://localhost:44303/api/Reviews";

// Lấy JWT token
function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleRequest(promise) {
  try {
    const res = await promise;
    return res.data;
  } catch (err) {
    console.error("Review Service Error:", err?.response?.data || err.message);
    throw err?.response?.data || { error: err.message };
  }
}

export default {
  // Lấy toàn bộ review của sản phẩm
  async getProductReviews(productId) {
    return await handleRequest(
      axios.get(`${API_URL}/product/${productId}`, {
        headers: authHeader()
      })
    );
  },

  // Tạo review mới (yêu cầu JWT)
  async createReview(dto) {
    return await handleRequest(
      axios.post(API_URL, dto, {
        headers: {
          ...authHeader(),
          "Content-Type": "application/json"
        }
      })
    );
  },

  // Cập nhật review
  async updateReview(id, dto) {
    return await handleRequest(
      axios.put(`${API_URL}/${id}`, dto, {
        headers: {
          ...authHeader(),
          "Content-Type": "application/json"
        }
      })
    );
  },

  // Trả lời review
  async replyReview(reviewId, dto) {
    return await handleRequest(
      axios.post(`${API_URL}/${reviewId}/reply`, dto, {
        headers: {
          ...authHeader(),
          "Content-Type": "application/json"
        }
      })
    );
  },

  // Xóa review
  async deleteReview(id) {
    return await handleRequest(
      axios.delete(`${API_URL}/${id}`, {
        headers: authHeader()
      })
    );
  },

  // Review của user hiện tại
  async getMyReviews() {
    return await handleRequest(
      axios.get(`${API_URL}/my-reviews`, {
        headers: authHeader()
      })
    );
  },

  // Anti-spam review
  async getBanStatus() {
    return await handleRequest(
      axios.get(`${API_URL}/ban-status`, {
        headers: authHeader()
      })
    );
  },
};
