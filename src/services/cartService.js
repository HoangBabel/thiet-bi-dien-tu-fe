import axios from "axios";

const API_URL = "http://localhost:5126/api/cart"; // đổi theo backend thực tế

// lấy JWT token
function authHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export default {
  async getCart() {
    const res = await axios.get(API_URL, { headers: authHeader() });
    return res.data;
  },

  async addItem(productId, quantity = 1) {
    const res = await axios.post(`${API_URL}/items`, { productId, quantity }, { headers: authHeader() });
    return res.data;
  },

  async updateQuantity(productId, quantity) {
    const res = await axios.patch(`${API_URL}/items/${productId}`, { quantity }, { headers: authHeader() });
    return res.data;
  },

  async removeItem(productId) {
    const res = await axios.delete(`${API_URL}/items/${productId}`, { headers: authHeader() });
    return res.data;
  },

  async clearCart() {
    await axios.delete(API_URL, { headers: authHeader() });
  }
};
