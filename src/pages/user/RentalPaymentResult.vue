<template>
  <div class="payment-result-container container mt-5">
    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
      <p class="mt-3 text-muted">Đang tải dữ liệu đơn thuê...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center text-danger py-5">
      <i class="bi bi-exclamation-triangle-fill display-3"></i>
      <h4 class="mt-3 fw-bold">Lỗi khi xử lý thanh toán</h4>
      <p class="text-muted">{{ error }}</p>
      <button class="btn btn-primary mt-3" @click="goToRentals">Quay lại danh sách thuê</button>
    </div>

    <!-- Result -->
    <div v-else class="text-center py-5">
      <!-- Paid -->
      <div v-if="isPaid">
        <i class="bi bi-check-circle-fill display-3 text-success"></i>
        <h4 class="mt-3 fw-bold">Thanh toán thành công!</h4>
        <p class="text-muted">
          Đơn thuê #{{ rental.rentalId }} đã được xác nhận.
        </p>
        <p class="fw-semibold">
          Tổng thanh toán: {{ formatCurrency(rental.finalAmount) }}
        </p>

        <button class="btn btn-secondary mt-4" @click="goToRentals">
          Xem danh sách thuê
        </button>
      </div>

      <!-- Pending -->
      <div v-else>
        <i class="bi bi-hourglass-split display-3 text-warning icon-pending"></i>
        <h4 class="mt-3 fw-bold">Đang chờ thanh toán</h4>
        <p class="text-muted">
          Vui lòng hoàn tất thanh toán cho đơn thuê #{{ rental.rentalId }}.
        </p>

        <p class="fw-semibold">
          Tổng thanh toán: {{ formatCurrency(rental.finalAmount) }}
        </p>

        <!-- QR + Link -->
        <div class="mt-3 qr-container">
          <!-- Link PayOS -->
          <a
            v-if="rental.paymentUrl"
            :href="rental.paymentUrl"
            target="_blank"
            class="btn btn-primary pulse-button"
          >
            <i class="bi bi-credit-card me-1"></i> Thanh toán PayOS
          </a>

          <!-- QR -->
          <div v-if="rental.qrCodeUrl" class="mt-3">
            <img
              :src="rental.qrCodeUrl"
              alt="QR PayOS"
              class="img-fluid qr-blink"
              style="max-width: 220px"
            />
          </div>
        </div>

        <p class="text-muted mt-3 small">
          Trang sẽ tự động kiểm tra trạng thái mỗi <b>{{ pollInterval / 1000 }}s</b>...
        </p>

        <p class="countdown mt-2">
          Kiểm tra lại sau: <b>{{ countdown }}</b>s
        </p>

        <button class="btn btn-secondary mt-4" @click="goToRentals">
          Về danh sách thuê
        </button>
      </div>
    </div>

    <!-- Popup Success -->
    <div
      v-if="showSuccess"
      class="popup-overlay d-flex align-items-center justify-content-center"
    >
      <div class="popup-card text-center p-4 shadow-lg bg-white rounded-4">
        <div class="icon mb-3">
          <i class="bi bi-check-circle-fill text-success display-3"></i>
        </div>
        <h4 class="fw-bold mb-2">Thanh toán thành công!</h4>
        <p class="text-muted mb-4">
          Đơn thuê #{{ rental.rentalId }} đã được xác nhận.
        </p>
        <button class="btn btn-primary w-100" @click="closeSuccessPopup">
          Đóng
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import rentalCheckoutService from "@/services/rentalCheckoutService";

const route = useRoute();
const router = useRouter();

const rental = ref(null);
const loading = ref(true);
const error = ref(null);
const isPaid = ref(false);
const showSuccess = ref(false);

const pollInterval = 5000; // 5s
let intervalPoll = null;

// ---------------------
// Helpers
// ---------------------
function formatCurrency(value) {
  return value?.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) || "0₫";
}
function goToRentals() {
  router.push("/rentalOrder");
}
function closeSuccessPopup() {
  showSuccess.value = false;
}

// ---------------------
// Load rental detail & start polling
// ---------------------
async function loadRentalInfo() {
  const rentalId = Number(route.query.rentalId);
  const devUserId = route.query.devUserId ? Number(route.query.devUserId) : null;

  if (!rentalId) {
    error.value = "Không tìm thấy thông tin đơn thuê.";
    loading.value = false;
    return;
  }

  try {
    const data = await rentalCheckoutService.getPaymentStatus(rentalId, devUserId);
    rental.value = data;
    isPaid.value = data.paymentStatus === "PAID";

    // Nếu chưa thanh toán QR → poll
    if (!isPaid.value && data.paymentMethod === "QR") {
      startPolling(rentalId, devUserId);
    }
  } catch (e) {
    console.error(e);
    error.value = "Không thể tải dữ liệu đơn thuê.";
  } finally {
    loading.value = false;
  }
}

// ---------------------
// Poll realtime payment status
// ---------------------
function startPolling(rentalId, devUserId) {
  intervalPoll = setInterval(async () => {
    try {
      const status = await rentalCheckoutService.getPaymentStatus(rentalId, devUserId);

      rental.value.paymentStatus = status.paymentStatus;
      rental.value.paymentUrl = status.paymentUrl;
      rental.value.qrCodeUrl = status.qrCodeUrl;

      const wasPaid = isPaid.value;
      isPaid.value = status.paymentStatus === "PAID";

      if (!wasPaid && isPaid.value) {
        showSuccess.value = true;
        intervalPoll && clearInterval(intervalPoll);
      }
    } catch (e) {
      console.error("❌ Poll error:", e);
    }
  }, pollInterval);
}

// ---------------------
onMounted(loadRentalInfo);
onUnmounted(() => intervalPoll && clearInterval(intervalPoll));
</script>

<style scoped>
.payment-result-container {
  animation: fadeIn 0.4s ease-in-out;
}
.pulse-button {
  animation: pulse 1.2s infinite;
}
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.04); }
  100% { transform: scale(1); }
}

.icon-pending {
  animation: shake 1s infinite alternate;
}
@keyframes shake {
  0% { transform: rotate(-8deg); }
  100% { transform: rotate(8deg); }
}

.qr-blink {
  animation: blink 1.3s infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 1055;
}
.popup-card {
  width: 380px;
  animation: zoomIn 0.35s ease;
}
@keyframes zoomIn {
  from { transform: scale(0.85); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.countdown {
  font-size: 14px;
  color: #6c757d;
}
</style>
