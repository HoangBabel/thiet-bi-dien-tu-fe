import axios from "axios";

const API_URL = "https://localhost:44303/api/RentalCheckout"; // đổi theo backend thực tế

// Lấy JWT token từ localStorage
function authHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export default {
  /**
   * Checkout một rental
   * @param {object} checkoutDto - CheckoutRentalRequest (body JSON)
   * @param {number} [devUserId] - optional, chỉ dùng test khi không có token
   * @returns {Promise<object>} thông tin checkout, bao gồm CheckoutUrl, FinalAmount, PaymentMethod, v.v.
   */
  async checkoutRental(checkoutDto, devUserId = null) {
    try {
      const config = { headers: authHeader() };

      // Nếu có devUserId, gửi dưới dạng query param
      const query = devUserId ? `?devUserId=${devUserId}` : "";

      const res = await axios.post(`${API_URL}${query}`, checkoutDto, config);
      return res.data;
    } catch (err) {
      // Bắt lỗi từ backend
      if (err.response) {
        throw new Error(err.response.data?.error || JSON.stringify(err.response.data));
      }
      throw err;
    }
  }
};
