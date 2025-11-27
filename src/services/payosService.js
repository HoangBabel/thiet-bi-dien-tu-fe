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

        if (status.paymentStatus === "PAID" || attempts >= maxAttempts) {
          clearInterval(timer);
        }
      } catch (err) {
        console.error("❌ Polling error:", err);
        if (attempts >= maxAttempts) clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  },

  // ========================
  // RENTAL PAYMENT (QR PayOS)
  // ========================
  async getRentalPaymentStatus(rentalId, devUserId) {
    if (!rentalId || rentalId <= 0) throw new Error("Invalid rentalId.");

    const params = devUserId ? { devUserId } : {};

    try {
      const res = await axios.get(`${API_BASE}/payos/rental-status/${rentalId}`, {
        headers: authHeader(),
        params,
      });

      // API trả về: { Id, Status, paymentStatus, PaymentUrl, QrCodeUrl }
      return {
        rentalId: res.data.Id,
        status: res.data.Status,
        paymentStatus: res.data.paymentStatus || "UNPAID",
        paymentUrl: res.data.PaymentUrl,
        qrCodeUrl: res.data.QrCodeUrl,
      };
    } catch (err) {
      console.error("❌ Lỗi khi lấy trạng thái rental:", err.response?.data || err.message);
      throw err;
    }
  },

  async createRentalPaymentLink(rentalId, devUserId) {
    if (!rentalId || rentalId <= 0) throw new Error("Invalid rentalId.");

    const params = devUserId ? { devUserId } : {};

    try {
      const res = await axios.post(
        `${API_BASE}/payos/create-rental-payment-link`,
        { rentalId },
        { headers: authHeader(), params }
      );

      return {
        message: res.data.message,
        rentalId: res.data.rentalId,
        paymentUrl: res.data.paymentUrl,
        qrCodeUrl: res.data.qrCodeUrl || res.data.qrCode,
        paymentLinkId: res.data.paymentLinkId,
        status: res.data.paymentStatus || "PENDING",
      };
    } catch (err) {
      const data = err.response?.data;

      // Nếu BE trả "Đã tồn tại link thanh toán."
      if (data?.message?.toLowerCase().includes("tồn tại")) {
        return {
          message: data.message,
          rentalId,
          paymentUrl: data.paymentUrl,
          qrCodeUrl: data.qrCodeUrl,
          paymentLinkId: data.paymentLinkId,
          status: "PENDING",
        };
      }

      console.error("❌ Lỗi tạo PayOS link rental:", err.response?.data || err.message);
      throw new Error("Lỗi PayOS Rental.");
    }
  },

  async getRentalPaymentLink(rentalId, devUserId) {
    if (!rentalId || rentalId <= 0) throw new Error("Invalid rentalId.");

    try {
      const status = await payosService.getRentalPaymentStatus(rentalId, devUserId);

      // Nếu đã có QR + paymentUrl (BE đã tạo link rồi)
      if (status.paymentUrl) {
        return {
          message: "Link đã tồn tại",
          rentalId: status.rentalId,
          paymentUrl: status.paymentUrl,
          qrCodeUrl: status.qrCodeUrl,
          status: status.paymentStatus,
        };
      }

      // Nếu chưa có → tạo mới
      return await payosService.createRentalPaymentLink(rentalId, devUserId);

    } catch (err) {
      console.error("❌ Lỗi getRentalPaymentLink:", err);
      throw err;
    }
  },

  pollRentalPaymentStatus(rentalId, callback, interval = 5000, maxAttempts = 60, devUserId) {
    let attempts = 0;

    const timer = setInterval(async () => {
      attempts++;
      try {
        const status = await payosService.getRentalPaymentStatus(rentalId, devUserId);
        callback(status);

        if (status.paymentStatus === "PAID" || attempts >= maxAttempts) {
          clearInterval(timer);
        }
      } catch (err) {
        console.error("❌ Poll rental error:", err);
        if (attempts >= maxAttempts) clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  },
};

export default payosService;
