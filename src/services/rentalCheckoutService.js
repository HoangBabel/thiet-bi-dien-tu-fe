import axios from "axios";

const API_URL = "http://localhost:5126/api/RentalCheckout"; // đổi theo backend thực tế

// Lấy JWT token từ localStorage
function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const rentalCheckoutService = {
  /**
   * Checkout một rental
   * @param {object} checkoutDto - CheckoutRentalRequest (body JSON)
   * @param {number} [devUserId] - optional, chỉ dùng test khi không có token
   * @returns {Promise<object>} thông tin checkout, bao gồm CheckoutUrl, FinalAmount, PaymentMethod, v.v.
   */
  async checkoutRental(checkoutDto, devUserId = null) {
    if (!checkoutDto || typeof checkoutDto !== "object") {
      throw new Error("checkoutDto không hợp lệ.");
    }

    try {
      const config = { headers: authHeader() };

      // Nếu có devUserId, gửi dưới dạng query param
      const query = devUserId ? `?devUserId=${devUserId}` : "";

      const res = await axios.post(`${API_URL}${query}`, checkoutDto, config);

      // Trả về toàn bộ dữ liệu backend trả về
      return {
        rentalId: res.data.RentalId ?? res.data.rentalId,
        message: res.data.Message ?? res.data.message,
        subtotal: res.data.Subtotal ?? 0,
        shippingFee: res.data.ShippingFee ?? 0,
        deposit: res.data.Deposit ?? 0,
        discount: res.data.Discount ?? 0,
        finalAmount: res.data.FinalAmount ?? 0,
        voucherCode: res.data.VoucherCode ?? null,
        serviceType: res.data.ServiceType ?? null,
        weight: res.data.Weight ?? null,
        nextStep: res.data.nextStep ?? null,
        paymentInstruction: res.data.paymentInstruction ?? null,
        checkoutUrl: res.data.CheckoutUrl ?? null,
        qrCode: res.data.QrCode ?? null,
        paymentLinkId: res.data.PaymentLinkId ?? null
      };
    } catch (err) {
      // Bắt lỗi từ backend
      if (err.response) {
        throw new Error(err.response.data?.error || err.response.data?.message || JSON.stringify(err.response.data));
      }
      throw err;
    }
  }
};

export default rentalCheckoutService;
