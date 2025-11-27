import axios from "axios";
import payosService from "./payosService";

const API_BASE = "https://localhost:44303/api";

/** Lấy header JWT nếu có */
function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const rentalCheckoutService = {
  /**
   * Checkout đơn thuê → tạo rental
   * Nếu PaymentMethod = "QR" → gọi riêng payosService tạo link
   */
  checkoutRental: async (payload) => {
    try {
      // Convert enum đúng chuẩn backend
      if (payload.PaymentMethod === "QR") payload.PaymentMethod = 1;
      else if (payload.PaymentMethod === "COD") payload.PaymentMethod = 0;

      const params = {};
      if (payload.devUserId) params.devUserId = payload.devUserId;

      // 1️⃣ Tạo rental trên backend (không tạo QR)
      const res = await axios.post(`${API_BASE}/RentalCheckout`, payload, {
        headers: { ...authHeader(), "Content-Type": "application/json" },
        params,
      });

      const rental = res.data;
      let paymentLink = null;

      // 2️⃣ Nếu PaymentMethod = QR → gọi PayOS service tạo link
      if (payload.PaymentMethod === 1) {
        try {
          paymentLink = await payosService.getRentalPaymentLink(
            rental.RentalId,
            payload.devUserId
          );
        } catch (err) {
          console.error("❌ Lỗi khi tạo hoặc lấy liên kết PayOS:", err);
          paymentLink = null; // FE vẫn trả về rental
        }
      }

      // 3️⃣ Chuẩn hóa dữ liệu trả về FE
      return {
        message: rental.Message,
        rentalId: rental.RentalId,
        subtotal: rental.Subtotal,
        shippingFee: rental.ShippingFee,
        discount: rental.Discount,
        deposit: rental.Deposit,
        voucherCode: rental.VoucherCode,
        serviceType: rental.ServiceType,
        weight: rental.Weight,
        finalAmount: rental.FinalAmount,
        paymentMethod: payload.PaymentMethod === 1 ? "QR" : "COD",
        paymentLink: paymentLink
          ? {
              paymentUrl: paymentLink.paymentUrl,
              qrCodeUrl: paymentLink.qrCodeUrl,
              paymentLinkId: paymentLink.paymentLinkId,
              status: paymentLink.status,
            }
          : null,
        nextStep: rental.nextStep || null,
        paymentInstruction: rental.paymentInstruction || null,
      };
    } catch (err) {
      console.error("❌ Lỗi khi checkout rental:", err.response?.data || err.message);
      throw err;
    }
  },

  /** Lấy trạng thái Payment Rental từ PayOS */
  getPaymentStatus: async (rentalId, devUserId) => {
    try {
      if (!rentalId || rentalId <= 0) throw new Error("Invalid rentalId.");
      return await payosService.getRentalPaymentStatus(rentalId, devUserId);
    } catch (err) {
      console.error("❌ Lỗi khi lấy trạng thái rental:", err.response?.data || err.message);
      throw err;
    }
  },

  /** Poll trạng thái Rental Payment */
  pollRentalStatus: (rentalId, callback, interval = 5000, maxAttempts = 60, devUserId) => {
    return payosService.pollRentalPaymentStatus(
      rentalId,
      callback,
      interval,
      maxAttempts,
      devUserId
    );
  },

  /** Hủy Payment Link → cập nhật DB */
  cancelPayment: async (rentalId, devUserId) => {
    try {
      if (!rentalId || rentalId <= 0) throw new Error("Invalid rentalId.");
      const params = devUserId ? { devUserId } : {};
      const res = await axios.post(
        `${API_BASE}/RentalCheckout/${rentalId}/cancel-payment`,
        null,
        { headers: authHeader(), params }
      );
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi hủy payment link:", err.response?.data || err.message);
      throw err;
    }
  },
};

export default rentalCheckoutService;
