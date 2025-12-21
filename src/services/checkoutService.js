import axios from "axios";

const API_BASE = "http://localhost:5126/api";

/**
 * Header Authorization nếu token tồn tại
 */
function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const checkoutService = {
  /**
   * Checkout đơn hàng
   * @param {Object} payload
   * {
   *   ShippingAddress, ToProvinceId, ToProvinceName, ToDistrictId, ToDistrictName,
   *   ToWardCode, ToWardName, ServiceId, Weight, Length, Width, Height,
   *   PaymentMethod: "COD" | "QR",
   *   VoucherCode,
   *   devUserId
   * }
   */
  async checkout(payload) {
    try {
      // 🔄 Chuyển PaymentMethod sang enum backend (0 = COD, 1 = QR)
      payload.PaymentMethod =
        payload.PaymentMethod === "QR" || payload.PaymentMethod === 1 ? 1 : 0;

      const params = {};
      if (payload.devUserId) params.devUserId = payload.devUserId;

      console.log("Checkout payload:", payload);

      const res = await axios.post(`${API_BASE}/Checkout/order`, payload, {
        headers: { ...authHeader(), "Content-Type": "application/json" },
        params
      });

      const data = res.data;

      return {
        orderId: data.orderId,
        subtotal: data.subtotal,
        shippingFee: data.shippingFee,
        discount: data.discount,              // ⬅ Voucher discount đã tính từ backend
        finalAmount: data.finalAmount,        // ⬅ Tổng cuối sau voucher
        paymentMethod: data.paymentMethod,    // "COD" | "QR"
        voucherCode: data.voucherCode ?? null,
        serviceType: data.serviceType ?? null,
        weight: data.weight ?? null,

        // ⬇ PayOS fields (có hoặc không)
        checkoutUrl: data.checkoutUrl || null,
        qrCode: data.qrCode || null,
        paymentLinkId: data.paymentLinkId || null
      };
    } catch (err) {
      console.error("❌ Lỗi khi checkout:", err.response?.data || err.message);
      throw err;
    }
  },

  /**
   * Lấy chi tiết đơn hàng sau khi tạo hoặc khi reload
   */
  async getOrderById(orderId) {
    try {
      const res = await axios.get(`${API_BASE}/order/${orderId}`, {
        headers: authHeader()
      });

      const data = res.data;

      return {
        orderId: data.orderId ?? data.id,
        subtotal: data.subtotal,
        shippingFee: data.shippingFee,
        discount: data.discount,
        finalAmount: data.finalAmount,
        paymentMethod: data.paymentMethod,
        voucherCode: data.voucherCode,
        serviceType: data.serviceType,
        weight: data.weight,

        checkoutUrl: data.checkoutUrl || null,
        qrCode: data.qrCode || null,
        paymentLinkId: data.paymentLinkId || null,

        status: data.status,
        paymentStatus: data.paymentStatus
      };
    } catch (err) {
      console.error("❌ Lỗi khi lấy đơn hàng:", err.response?.data || err.message);
      throw err;
    }
  },

  /**
   * Poll trạng thái đơn hàng (tự refresh trạng thái PayOS)
   * @param {number} orderId
   * @param {function} callback
   * @param {number} interval
   */
  pollOrderStatus(orderId, callback, interval = 10000) {
    const timer = setInterval(async () => {
      try {
        const order = await this.getOrderById(orderId);
        callback(order);
      } catch (err) {
        console.error("❌ Lỗi khi polling:", err);
      }
    }, interval);

    return () => clearInterval(timer); // trả về hàm dừng poll
  }
};

export default checkoutService;
