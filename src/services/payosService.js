import axios from "axios";

const API_BASE = "https://localhost:44303/api";

/** Lấy header JWT nếu có */
function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const payosService = {
  // ========================
  // ORDER PAYMENT
  // ========================
  async createPaymentLink(orderId) {
    if (!orderId || orderId <= 0) throw new Error("Invalid orderId.");

    try {
      const res = await axios.post(
        `${API_BASE}/payos/create-payment-link`,
        { orderId },
        { headers: authHeader() }
      );

      return {
        message: res.data.message,
        orderId: res.data.orderId,
        paymentUrl: res.data.paymentUrl,
        qrCodeUrl: res.data.qrCode,
        paymentLinkId: res.data.paymentLinkId,
        status: res.data.status || "PENDING",
      };
    } catch (err) {
      console.error("❌ Lỗi tạo PayOS link:", err.response?.data || err.message);
      throw err;
    }
  },

  async getPaymentStatus(orderId) {
    if (!orderId || orderId <= 0) throw new Error("Invalid orderId.");

    try {
      const res = await axios.get(`${API_BASE}/payos/status/${orderId}`, {
        headers: authHeader(),
      });

      return {
        orderId: res.data.Id || res.data.orderId,
        status: res.data.Status,
        paymentStatus: res.data.paymentStatus || "UNKNOWN",
        paymentUrl: res.data.paymentUrl,
        qrCodeUrl: res.data.qrCode || res.data.QrCodeUrl,
        finalAmount: res.data.finalAmount,
        paidAt: res.data.paidAt,
        transactionCode: res.data.transactionCode,
      };
    } catch (err) {
      console.error("❌ Lỗi khi lấy trạng thái PayOS:", err.response?.data || err.message);
      throw err;
    }
  },

  async confirmPayment(payload) {
    try {
      const res = await axios.post(`${API_BASE}/payos/confirm-payment`, payload, {
        headers: authHeader(),
      });
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi confirm PayOS:", err.response?.data || err.message);
      throw err;
    }
  },

  pollPaymentStatus(orderId, callback, interval = 10000, maxAttempts = 30) {
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts++;
      try {
        const status = await payosService.getPaymentStatus(orderId);
        callback(status);
        if (status.paymentStatus === "PAID" || attempts >= maxAttempts) clearInterval(timer);
      } catch (err) {
        console.error("❌ Polling error:", err);
        if (attempts >= maxAttempts) clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  },

  // ========================
  // RENTAL PAYMENT
  // ========================
// Tạo hoặc lấy link PayOS Rental
async createRentalPaymentLink(rentalId) {
    if (!rentalId || rentalId <= 0) throw new Error("Invalid rentalId.");

    try {
      const res = await axios.post(
        `${API_BASE}/payos/create-rental-payment-link`,
        { RentalId: rentalId },
        { headers: authHeader() }
      );

      // Trả về object chuẩn cho FE submitOrder
      return {
        message: res.data.message,
        rentalId: res.data.rentalId,
        paymentUrl: res.data.paymentUrl || "",
        qrCodeUrl: res.data.qrCodeUrl || res.data.qrCode || "",
        paymentLinkId: res.data.paymentLinkId || "",
        status: res.data.status || "PENDING"
      };
    } catch (err) {
      const data = err.response?.data;

      // Nếu link đã tồn tại trên backend → trả lại link cũ
      if (data?.message?.includes("Đã tồn tại link thanh toán")) {
        return {
          message: data.message,
          rentalId: data.rentalId || rentalId,
          paymentUrl: data.paymentUrl || "",
          qrCodeUrl: data.qrCodeUrl || "",
          paymentLinkId: data.paymentLinkId || "",
          status: data.status || "PENDING"
        };
      }

      console.error("❌ Lỗi tạo Rental PayOS link:", data || err.message);
      throw err;
    }
  },

  // Poll trạng thái thanh toán Rental
  pollRentalPaymentStatus(rentalId, callback, interval = 5000, maxAttempts = 60) {
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts++;
      try {
        const res = await axios.get(
          `${API_BASE}/payos/rental/status/${rentalId}`,
          { headers: authHeader() }
        );

        const statusObj = {
          rentalId: res.data.Id,
          paymentStatus: res.data.paymentStatus,
          paymentUrl: res.data.PaymentUrl || "",
          qrCodeUrl: res.data.QrCodeUrl || ""
        };

        callback(statusObj);

        if (statusObj.paymentStatus === "PAID" || attempts >= maxAttempts) {
          clearInterval(timer);
        }
      } catch (err) {
        console.error("❌ Lỗi polling trạng thái thanh toán:", err);
        clearInterval(timer);
      }
    }, interval);

    // Trả về hàm dừng polling nếu cần
    return () => clearInterval(timer);
  },

  /** Lấy trạng thái thanh toán đơn thuê */
  async getRentalPaymentStatus(rentalId) {
    if (!rentalId || rentalId <= 0) throw new Error("Invalid rentalId.");

    try {
      const res = await axios.get(`${API_BASE}/payos/rental/status/${rentalId}`, {
        headers: authHeader(),
      });

      return {
        rentalId: res.data.Id || res.data.rentalId,
        status: res.data.Status || res.data.status,
        paymentStatus: res.data.paymentStatus || "UNKNOWN",
        paymentUrl: res.data.paymentUrl,
        qrCodeUrl: res.data.qrCodeUrl || res.data.QrCodeUrl,
        finalAmount: res.data.TotalPrice + res.data.ShippingFee - (res.data.DiscountAmount || 0),
        paidAt: res.data.PaidAt,
        transactionCode: res.data.TransactionCode || res.data.transactionCode,
      };
    } catch (err) {
      console.error("❌ Lỗi khi lấy trạng thái Rental PayOS:", err.response?.data || err.message);
      throw err;
    }
  },

  /** Xác nhận thanh toán đơn thuê */
  async confirmRentalPayment(payload) {
    try {
      const res = await axios.post(`${API_BASE}/payos/rental/confirm-payment`, payload, { // ✅ URL
        headers: authHeader(),
      });
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi confirm Rental:", err.response?.data || err.message);
      throw err;
    }
  },
};

export default payosService;
