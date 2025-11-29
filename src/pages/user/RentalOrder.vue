<template>
  <div class="order-container container py-4">
    <h3 class="fw-bold mb-4 text-primary">📦 Danh sách đơn thuê của bạn</h3>

    <!-- Loading -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary"></div>
      <p class="mt-3 text-muted">Đang tải dữ liệu...</p>
    </div>

    <!-- Không có đơn -->
    <div
      v-else-if="!rentalsFiltered.length"
      class="empty-state text-center p-5 rounded shadow bg-light"
    >
      <i class="bi bi-box-seam fs-1 text-muted"></i>
      <p class="mt-3 text-muted">Bạn chưa có đơn thuê nào.</p>
    </div>

    <!-- Danh sách -->
    <div v-else class="order-list">
      <div
        v-for="rental in rentalsFiltered"
        :key="rental.id"
        class="card order-card mb-4 shadow-sm border-0"
      >
        <div class="card-body p-4">
          <!-- Header -->
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 class="fw-semibold text-dark mb-1">
                🧾 Đơn thuê #{{ rental.id }}
              </h5>
              <p class="small text-muted mb-1">
                Bắt đầu thuê: {{ formatDate(rental.startDate) }}
              </p>
              <p class="small text-muted mb-0">
                Kết thúc: {{ formatDate(rental.endDate) }}
              </p>
              <p v-if="rental.transactionCode" class="small text-muted mb-0">
                Mã giao dịch: {{ rental.transactionCode }}
              </p>
              <p v-if="rental.paidAt" class="small text-success mb-0">
                Thanh toán lúc: {{ formatDateTime(rental.paidAt) }}
              </p>
              <p v-if="rental.confirmedAt" class="small text-info mb-0">
                Xác nhận lúc: {{ formatDateTime(rental.confirmedAt) }}
              </p>
            </div>

            <!-- Status -->
            <span class="status-badge" :class="statusClass(rental)">
              <i :class="statusIcon(rental)" class="me-1"></i>
              {{ statusText(rental) }}
            </span>
          </div>

          <!-- Chi tiết sản phẩm -->
          <div v-if="rental.items?.length" class="table-responsive">
            <table class="table align-middle mb-3">
              <thead class="table-light">
                <tr>
                  <th>Sản phẩm</th>
                  <th class="text-center">SL</th>
                  <th class="text-center">Số ngày</th>
                  <th class="text-end">Đơn giá</th>
                  <th class="text-end">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in rental.items" :key="item.id">
                  <td>{{ item.productName }}</td>
                  <td class="text-center">{{ item.quantity }}</td>
                  <td class="text-center">{{ item.units }}</td>
                  <td class="text-end">{{ formatCurrency(item.pricePerUnitAtBooking) }}</td>
                  <td class="text-end">{{ formatCurrency(item.subTotal) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div class="order-footer text-end">
            <p class="fw-semibold mb-1">
              Tổng thanh toán: <span class="text-danger">{{ formatCurrency(rental.totalPrice) }}</span>
            </p>
            <p v-if="rental.depositPaid" class="fw-semibold mb-2">
              Cọc đã thanh toán: <span class="text-warning">{{ formatCurrency(rental.depositPaid) }}</span>
            </p>

            <!-- Chưa thanh toán -->
            <a
              v-if="rental.paymentStatus === 'UNPAID' && rental.paymentUrl"
              :href="rental.paymentUrl"
              target="_blank"
              class="btn btn-primary btn-sm ms-2"
            >
              <i class="bi bi-credit-card me-1"></i> Thanh toán ngay
            </a>

            <!-- Đang chờ PayOS -->
            <a
              v-if="rental.paymentStatus === 'PENDING' && rental.paymentUrl"
              :href="rental.paymentUrl"
              target="_blank"
              class="btn btn-warning btn-sm text-dark ms-2 pulse-button"
            >
              <i class="bi bi-hourglass-split me-1"></i>
              Đang chờ xác nhận thanh toán...
            </a>

            <!-- Đã thanh toán -->
            <div
              v-if="rental.paymentStatus === 'PAID'"
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
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import rentalService from "@/services/RentalService";

const rentals = ref([]);
const loading = ref(true);
let intervalId = null;

/* =============================
    FILTERED RENTALS (Không hiển thị Pending)
============================= */
const rentalsFiltered = computed(() =>
  rentals.value.filter(r => r.status !== "Pending")
);

/* =============================
    FORMAT NGÀY & TIỀN
============================= */
function formatDate(dateStr) {
  if (!dateStr) return "Không xác định";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "Không xác định";
  const d = new Date(dateStr);
  return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", {hour: "2-digit", minute:"2-digit"})}`;
}

function formatCurrency(value) {
  return (
    value?.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) ||
    "0₫"
  );
}

/* =============================
    STATUS
============================= */
function statusText(rental) {
  if (rental.paymentStatus === "PAID") return "Đã thanh toán";

  switch (rental.status) {
    case "Pending":
      return "Chờ xác nhận";
    case "Active":
      return "Đang thuê";
    case "Completed":
      return "Hoàn tất";
    case "Cancelled":
      return "Đã hủy";
    default:
      return "Không xác định";
  }
}

function statusIcon(rental) {
  if (rental.paymentStatus === "PAID") return "bi bi-check-circle";

  switch (rental.status) {
    case "Pending":
      return "bi bi-hourglass-split";
    case "Active":
      return "bi bi-play-circle";
    case "Completed":
      return "bi bi-check-circle";
    case "Cancelled":
      return "bi bi-x-circle";
    default:
      return "bi bi-question-circle";
  }
}

function statusClass(rental) {
  if (rental.paymentStatus === "PAID") return "badge-success";

  switch (rental.status) {
    case "Pending":
      return "badge-warning";
    case "Active":
      return "badge-info";
    case "Completed":
      return "badge-success";
    case "Cancelled":
      return "badge-danger";
    default:
      return "badge-secondary";
  }
}

/* =============================
    LOAD DATA
============================= */
async function loadRentals() {
  loading.value = true;
  try {
    rentals.value = await rentalService.getMyRentals();
  } catch (err) {
    console.error("❌ Lỗi khi tải đơn thuê:", err);
  } finally {
    loading.value = false;
  }
}

/* ================================
   AUTO-REFRESH PAYOS CHO ĐƠN CHƯA THANH TOÁN
================================ */
async function refreshPendingPayments() {
  for (const rental of rentals.value) {
    if (rental.paymentStatus !== "PAID" && rental.paymentUrl) {
      try {
        const updated = await rentalService.getRentalById(rental.id);
        Object.assign(rental, updated);
      } catch (err) {
        console.error("❌ Lỗi refresh #" + rental.id, err);
      }
    }
  }
}

onMounted(async () => {
  await loadRentals();
  intervalId = setInterval(refreshPendingPayments, 10000);
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

/* Colors */
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

/* Pulse animation */
.pulse-button {
  animation: pulse 1.4s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
