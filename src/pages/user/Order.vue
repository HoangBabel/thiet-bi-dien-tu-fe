<template>
  <div class="order-container container py-4">
    <h3 class="fw-bold mb-4 text-primary">📦 Danh sách đơn hàng của bạn</h3>

    <!-- Loading -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary"></div>
      <p class="mt-3 text-muted">Đang tải dữ liệu...</p>
    </div>

    <!-- Không có đơn hàng -->
    <div
      v-else-if="!orders || orders.length === 0"
      class="empty-state text-center p-5 rounded shadow bg-light"
    >
      <i class="bi bi-box-seam fs-1 text-muted"></i>
      <p class="mt-3 text-muted">Bạn chưa có đơn hàng nào.</p>
    </div>

    <!-- Danh sách đơn hàng -->
    <div v-else class="order-list">
      <div
        v-for="order in orders"
        :key="order.id"
        class="card order-card mb-4 shadow-sm border-0"
      >
        <div class="card-body p-4">
          <!-- Header -->
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 class="fw-semibold text-dark mb-1">
                🧾 Đơn hàng #{{ order.id }}
              </h5>
              <p class="small text-muted mb-1">
                Ngày tạo: {{ formatDate(order.orderDate) }}
              </p>
              <p class="small text-muted mb-0">
                Phương thức: <span class="fw-medium">{{ order.paymentMethod }}</span>
              </p>
            </div>

            <!-- Trạng thái -->
            <span class="status-badge" :class="statusClass(order)">
              <i :class="statusIcon(order)" class="me-1"></i>
              {{ statusText(order) }}
            </span>
          </div>

          <!-- Chi tiết sản phẩm -->
          <div v-if="order.items?.length" class="table-responsive">
            <table class="table align-middle mb-3">
              <thead class="table-light">
                <tr>
                  <th>Sản phẩm</th>
                  <th class="text-center">SL</th>
                  <th class="text-end">Đơn giá</th>
                  <th class="text-end">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in order.items" :key="item.id">
                  <td>{{ item.product?.name || `Mã sản phẩm: ${item.productId}` }}</td>
                  <td class="text-center">{{ item.quantity }}</td>
                  <td class="text-end">{{ formatCurrency(item.unitPrice) }}</td>
                  <td class="text-end">
                    {{ formatCurrency(item.unitPrice * item.quantity) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div class="order-footer text-end">
            <p class="fw-semibold mb-2">
              Tổng thanh toán:
              <span class="text-danger">{{ formatCurrency(order.finalAmount) }}</span>
            </p>

            <!-- COD -->

            <!-- PayOS chưa thanh toán -->
            <a
              v-if="order.paymentMethod === 'QR' && order.paymentStatus === 'UNPAID' && order.paymentUrl"
              :href="order.paymentUrl"
              target="_blank"
              class="btn btn-primary btn-sm ms-2"
            >
              <i class="bi bi-credit-card me-1"></i> Thanh toán PayOS
            </a>

            <!-- PayOS đang chờ -->
            <a
              v-if="order.paymentMethod === 'QR' && order.paymentStatus === 'PENDING' && order.paymentUrl"
              :href="order.paymentUrl"
              target="_blank"
              class="btn btn-warning btn-sm text-dark ms-2 pulse-button"
            >
              <i class="bi bi-hourglass-split me-1"></i>
              Đang chờ xác nhận thanh toán...
            </a>

            <!-- PayOS thành công -->
            <div
              v-if="order.paymentStatus === 'PAID'"
              class="alert alert-success py-2 px-3 mt-2 d-inline-block"
            >
              <i class="bi bi-check-circle me-1"></i>
              Thanh toán thành công
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import orderService from "@/services/orderService";

const orders = ref([]);
const loading = ref(true);
let intervalId = null;

function formatDate(dateStr) {
  if (!dateStr) return "Không xác định";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(value) {
  return (
    value?.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) || "0₫"
  );
}

// Hiển thị trạng thái
function statusText(order) {
  if (order.paymentStatus === "PAID") return "Đã thanh toán";
  switch (order.status) {
    case "Pending":
    case 0:
      return "Chờ xử lý";
    case "Processing":
    case 1:
      return "Đang vận chuyển";
    case "Completed":
    case 2:
      return "Hoàn tất";
    case "Cancelled":
    case 3:
      return "Đã hủy";
    default:
      return "Không xác định";
  }
}

function statusIcon(order) {
  if (order.paymentStatus === "PAID") return "bi bi-check-circle";
  switch (order.status) {
    case "Pending":
    case 0:
      return "bi bi-hourglass-split";
    case "Processing":
    case 1:
      return "bi bi-truck";
    case "Completed":
    case 2:
      return "bi bi-check-circle";
    case "Cancelled":
    case 3:
      return "bi bi-x-circle";
    default:
      return "bi bi-question-circle";
  }
}

function statusClass(order) {
  if (order.paymentStatus === "PAID") return "badge-success";
  switch (order.status) {
    case "Pending":
    case 0:
      return "badge-warning";
    case "Processing":
    case 1:
      return "badge-info";
    case "Completed":
    case 2:
      return "badge-success";
    case "Cancelled":
    case 3:
      return "badge-danger";
    default:
      return "badge-secondary";
  }
}

// Load orders
async function loadOrders() {
  loading.value = true;
  try {
    const data = await orderService.getOrdersByUser();
    orders.value = (Array.isArray(data) ? data : []).sort(
      (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
    );
  } catch (err) {
    console.error("❌ Lỗi khi tải đơn hàng:", err);
  } finally {
    loading.value = false;
  }
}

// Xác nhận thanh toán COD
async function markAsPaid(orderId) {
  if (!confirm(`Xác nhận hoàn tất đơn hàng #${orderId}?`)) return;
  try {
    await orderService.markAsPaid(orderId);
    await loadOrders();
  } catch (err) {
    console.error(err);
    alert("Không thể cập nhật đơn hàng.");
  }
}

// Auto-refresh đơn QR chưa thanh toán
async function refreshPendingQROrders() {
  for (const order of orders.value) {
    if (order.paymentMethod === "QR" && order.paymentStatus !== "PAID") {
      try {
        await orderService.confirmPayOSPayment({ orderId: order.id });
        const updated = await orderService.getOrderById(order.id);
        Object.assign(order, updated);
      } catch (err) {
        console.error("❌ Lỗi refresh QR order #" + order.id, err);
      }
    }
  }
}

onMounted(async () => {
  await loadOrders();
  intervalId = setInterval(refreshPendingQROrders, 10000);
});

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<style scoped>
.order-container {
  background: #f9fafb;
  min-height: 100vh;
}

.order-card {
  border-radius: 0.75rem;
  background: #fffefc;
  border-left: 4px solid #0d6efd;
  transition: all 0.25s ease;
}
.order-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.status-badge {
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  color: #fff;
}

.badge-warning {
  background-color: #ffc107;
}
.badge-info {
  background-color: #0dcaf0;
}
.badge-success {
  background-color: #28a745;
}
.badge-danger {
  background-color: #dc3545;
}
.badge-secondary {
  background-color: #6c757d;
}

/* Hiệu ứng nhấp nháy nhẹ cho nút chờ thanh toán */
.pulse-button {
  animation: pulse 1.4s infinite;
}
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
