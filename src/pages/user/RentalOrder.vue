<template>
  <div class="order-container container py-4">
    <h3 class="fw-bold mb-4 text-primary">📦 Danh sách đơn thuê của bạn</h3>

    <!-- Loading -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary"></div>
      <p class="mt-3 text-muted">Đang tải dữ liệu...</p>
    </div>

    <!-- Không có đơn thuê -->
    <div v-else-if="rentals.length === 0" class="empty-state text-center p-5 rounded shadow bg-light">
      <i class="bi bi-box-seam fs-1 text-muted"></i>
      <p class="mt-3 text-muted">Không có đơn thuê nào.</p>
    </div>

    <!-- Danh sách đơn thuê -->
    <div v-else class="order-list">
      <div
        v-for="rental in rentals"
        :key="rental.id"
        class="card order-card mb-4 shadow-sm border-0"
      >
        <div class="card-body p-4">
          <!-- Header -->
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 class="fw-semibold text-dark mb-1">🧾 Đơn thuê #{{ rental.id }}</h5>
              <p class="small text-muted mb-1">Ngày bắt đầu: {{ formatDate(rental.startDate) }}</p>
              <p class="small text-muted mb-1">Ngày kết thúc: {{ formatDate(rental.endDate) }}</p>
            </div>

            <!-- Badge trạng thái -->
            <span class="status-badge" :class="statusClass(rental)">
              <i :class="statusIcon(rental)" class="me-1"></i> {{ statusText(rental) }}
            </span>
          </div>

          <!-- Chi tiết sản phẩm -->
          <div v-if="rental.items?.length" class="table-responsive">
            <table class="table align-middle mb-3">
              <thead class="table-light">
                <tr>
                  <th>Sản phẩm</th>
                  <th class="text-center">SL</th>
                  <th class="text-center">Đơn giá/ngày</th>
                  <th class="text-center">Ngày thuê</th>
                  <th class="text-end">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in rental.items" :key="item.id">
                  <td>{{ item.productName || `Mã sản phẩm: ${item.productId}` }}</td>
                  <td class="text-center">{{ item.quantity }}</td>
                  <td class="text-center">{{ formatCurrency(item.dailyPrice) }}</td>
                  <td class="text-center">{{ rental.rentalDays || computeRentalDays(rental) }} ngày</td>
                  <td class="text-end">
                    {{ formatCurrency(item.dailyPrice * item.quantity * (rental.rentalDays || computeRentalDays(rental))) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Tổng tiền -->
          <div class="order-footer text-end">
            <p class="fw-semibold mb-0 text-danger">
              Tổng thanh toán: <span>{{ formatCurrency(rental.totalPrice) }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import rentalService from "@/services/rentalService";

const rentals = ref([]);
const loading = ref(true);

// Format ngày
function formatDate(dateStr) {
  if (!dateStr) return "Không xác định";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Format tiền
function formatCurrency(value) {
  return (
    value?.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) || "0₫"
  );
}

// Trạng thái hiển thị
function statusText(rental) {
  switch (rental.status) {
    case "Paid": return "Đã thanh toán";
    case "Active": return "Đang thuê";
    case "Completed": return "Đã hoàn tất";
    case "Cancelled": return "Đã hủy";
    default: return "Không xác định";
  }
}
function statusIcon(rental) {
  switch (rental.status) {
    case "Paid": return "bi bi-cash-stack";
    case "Active": return "bi bi-truck";
    case "Completed": return "bi bi-check-circle";
    case "Cancelled": return "bi bi-x-circle";
    default: return "bi bi-question-circle";
  }
}
function statusClass(rental) {
  switch (rental.status) {
    case "Paid": return "badge-paid";
    case "Active": return "badge-info";
    case "Completed": return "badge-success";
    case "Cancelled": return "badge-danger";
    default: return "badge-secondary";
  }
}

// Tính số ngày thuê (nếu chưa có rentalDays)
function computeRentalDays(rental) {
  const start = new Date(rental.startDate);
  const end = new Date(rental.endDate);
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  rental.rentalDays = diff > 0 ? diff : 1;
  return rental.rentalDays;
}

// Load danh sách Rental (loại trừ Pending)
async function loadRentals() {
  loading.value = true;
  try {
    const userId = localStorage.getItem("userId");
    const data = await rentalService.getUserRentals(userId);
    rentals.value = Array.isArray(data)
      ? data
          .filter(r => r.status !== "Pending") // loại trừ Pending
          .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
      : [];
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

// Refresh rental sau khi tạo hoặc update
async function refreshRental(rentalId) {
  try {
    const data = await rentalService.getRentalById(rentalId);
    const index = rentals.value.findIndex(r => r.id === rentalId);
    if (index !== -1) rentals.value[index] = data;
    else rentals.value.unshift(data);
  } catch (err) {
    console.error(err);
  }
}

onMounted(loadRentals);
</script>

<style scoped>
.order-container { background: #f9fafb; min-height: 100vh; }
.order-card { border-radius: 0.75rem; background: #fffefc; border-left: 4px solid #0d6efd; transition: all 0.25s ease; }
.order-card:hover { transform: translateY(-3px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
.status-badge { font-weight: 600; font-size: 0.9rem; padding: 0.35rem 0.75rem; border-radius: 999px; color: #fff; }
.badge-info { background-color: #0dcaf0; }
.badge-success { background-color: #28a745; }
.badge-danger { background-color: #dc3545; }
.badge-secondary { background-color: #6c757d; }
.badge-paid { background-color: #0d6efd; }
</style>
