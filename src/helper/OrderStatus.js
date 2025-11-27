/**
 * OrderStatus.js
 * Enum helper cho trạng thái đơn hàng & thanh toán
 * Dùng trong các component (như Order.vue) để map ra text, màu & icon tương ứng
 */

export const OrderStatus = Object.freeze({
  PENDING: 0,
  PROCESSING: 1,
  COMPLETED: 2,
  CANCELLED: 3,
});

export const PaymentStatus = Object.freeze({
  UNPAID: "UNPAID",
  PENDING: "PENDING",
  PAID: "PAID",
});

export function getStatusText(order) {
  if (order.paymentStatus === PaymentStatus.PAID) return "Đã thanh toán";

  switch (order.status) {
    case OrderStatus.PENDING:
    case "Pending":
      return "Chờ xử lý";
    case OrderStatus.PROCESSING:
    case "Processing":
      return "Đang vận chuyển";
    case OrderStatus.COMPLETED:
    case "Completed":
      return "Hoàn tất";
    case OrderStatus.CANCELLED:
    case "Cancelled":
      return "Đã hủy";
    default:
      return "Không xác định";
  }
}

export function getStatusIcon(order) {
  if (order.paymentStatus === PaymentStatus.PAID) return "bi bi-check-circle";

  switch (order.status) {
    case OrderStatus.PENDING:
    case "Pending":
      return "bi bi-hourglass-split";
    case OrderStatus.PROCESSING:
    case "Processing":
      return "bi bi-truck";
    case OrderStatus.COMPLETED:
    case "Completed":
      return "bi bi-check-circle";
    case OrderStatus.CANCELLED:
    case "Cancelled":
      return "bi bi-x-circle";
    default:
      return "bi bi-question-circle";
  }
}

export function getStatusClass(order) {
  if (order.paymentStatus === PaymentStatus.PAID) return "badge-success";

  switch (order.status) {
    case OrderStatus.PENDING:
    case "Pending":
      return "badge-warning";
    case OrderStatus.PROCESSING:
    case "Processing":
      return "badge-info";
    case OrderStatus.COMPLETED:
    case "Completed":
      return "badge-success";
    case OrderStatus.CANCELLED:
    case "Cancelled":
      return "badge-danger";
    default:
      return "badge-secondary";
  }
}

/**
 * Helper: Trả về object tổng hợp để bind trực tiếp trong Vue template
 */
export function getStatusDisplay(order) {
  return {
    text: getStatusText(order),
    icon: getStatusIcon(order),
    class: getStatusClass(order),
  };
}

export default {
  OrderStatus,
  PaymentStatus,
  getStatusText,
  getStatusIcon,
  getStatusClass,
  getStatusDisplay,
};
