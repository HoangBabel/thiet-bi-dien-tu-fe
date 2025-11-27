import axios from "axios";

const API_BASE = "https://localhost:44303/api";

// Lấy token JWT từ localStorage
function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const orderService = {
  /**
   * Tạo liên kết thanh toán PayOS
   */
  async createPaymentLink(orderId) {
    try {
      const res = await axios.post(
        `${API_BASE}/payos/create-payment-link`,
        { orderId },
        { headers: authHeader() }
      );
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi tạo PayOS link:", err.response?.data || err.message);
      throw err;
    }
  },

  /**
   * Kiểm tra trạng thái thanh toán PayOS
   */
  async getPaymentStatus(orderId) {
    try {
      const res = await axios.get(`${API_BASE}/payos/status/${orderId}`, { headers: authHeader() });
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi kiểm tra trạng thái thanh toán:", err.response?.data || err.message);
      throw err;
    }
  },

  /**
   * Xác nhận thanh toán PayOS (verify HMAC)
   */
  async confirmPayOSPayment(payload) {
    try {
      const res = await axios.post(`${API_BASE}/payos/confirm`, payload, { headers: authHeader() });
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi xác nhận thanh toán PayOS:", err.response?.data || err.message);
      throw err;
    }
  },

  /**
   * Lấy danh sách đơn hàng của user hiện tại
   */
  async getOrdersByUser() {
    try {
      const res = await axios.get(`${API_BASE}/order/user`, { headers: authHeader() });
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách đơn hàng:", err.response?.data || err.message);
      throw err;
    }
  },

  /**
   * Lấy chi tiết đơn hàng theo ID
   */
  async getOrderById(orderId) {
    try {
      const res = await axios.get(`${API_BASE}/order/${orderId}`, { headers: authHeader() });
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy chi tiết đơn hàng:", err.response?.data || err.message);
      throw err;
    }
  },

  /**
   * Đánh dấu đơn hàng đã thanh toán (Admin)
   */
  async markAsPaid(orderId) {
    try {
      const res = await axios.put(`${API_BASE}/order/payment/${orderId}`, null, { headers: authHeader() });
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi đánh dấu thanh toán:", err.response?.data || err.message);
      throw err;
    }
  },

  /**
   * Cập nhật trạng thái đơn hàng
   */
  async updateOrderStatus(orderId, status) {
    try {
      const res = await axios.put(
        `${API_BASE}/order/status/${orderId}`,
        { status },
        { headers: { ...authHeader(), "Content-Type": "application/json" } }
      );
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật trạng thái đơn hàng:", err.response?.data || err.message);
      throw err;
    }
  },

  /**
   * Hủy đơn hàng
   */
  async cancelOrder(orderId) {
    try {
      const res = await axios.delete(`${API_BASE}/order/${orderId}`, { headers: authHeader() });
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi hủy đơn hàng:", err.response?.data || err.message);
      throw err;
    }
  },

  /**
   * Lấy tất cả đơn hàng (Admin)
   */
  async getAllOrders(status = null) {
    try {
      const params = status ? { status } : {};
      const res = await axios.get(`${API_BASE}/order`, { headers: authHeader(), params });
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy toàn bộ đơn hàng:", err.response?.data || err.message);
      throw err;
    }
  },

  /**
   * Polling trạng thái thanh toán PayOS
   */
  pollPaymentStatus(orderId, callback, interval = 10000) {
    const timer = setInterval(async () => {
      try {
        const status = await orderService.getPaymentStatus(orderId);
        callback(status);
      } catch (err) {
        console.error("❌ Lỗi khi polling trạng thái thanh toán:", err);
      }
    }, interval);

    return () => clearInterval(timer); // stop polling
  },
};

/**
 * Mapping trạng thái đơn hàng sang text hiển thị
 */
export function mapOrderStatus(status) {
  if (!status) return "Không xác định";
  const s = typeof status === "string" ? status.toLowerCase() : status;
  switch (s) {
    case "pending":
    case 0: return "Chờ xử lý";
    case "processing":
    case 1: return "Đang xử lý";
    case "completed":
    case 2: return "Hoàn tất";
    case "cancelled":
    case 3: return "Đã hủy";
    default: return "Không xác định";
  }
}

export default orderService;
