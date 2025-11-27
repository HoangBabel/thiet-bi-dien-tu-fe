<template>
  <div class="payment-result-container container mt-5">
    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-3 text-muted">Đang kiểm tra trạng thái thanh toán...</p>
    </div>

    <!-- Lỗi -->
    <div v-else-if="error" class="text-center text-danger py-5">
      <i class="bi bi-exclamation-triangle-fill display-3"></i>
      <h4 class="mt-3 fw-bold">Lỗi khi xử lý thanh toán</h4>
      <p class="text-muted">{{ error }}</p>
      <button class="btn btn-primary mt-3" @click="goToOrders">Quay lại đơn hàng</button>
    </div>

    <!-- Kết quả -->
    <div v-else class="text-center py-5">
      <!-- Thanh toán thành công -->
      <div v-if="isPaid">
        <i class="bi bi-check-circle-fill display-3 text-success"></i>
        <h4 class="mt-3 fw-bold">Thanh toán thành công!</h4>
        <p class="text-muted">Đơn hàng #{{ order.id }} đã được xác nhận.</p>
        <p class="fw-semibold">Tổng thanh toán: {{ formatCurrency(order.finalAmount) }}</p>
      </div>

      <!-- Chưa thanh toán -->
      <div v-else>
        <i class="bi bi-hourglass-split display-3 text-warning icon-pending"></i>
        <h4 class="mt-3 fw-bold">Thanh toán chưa hoàn tất</h4>
        <p class="text-muted">Đơn hàng #{{ order.id }} đang chờ thanh toán.</p>
        <p class="fw-semibold">Tổng thanh toán: {{ formatCurrency(order.finalAmount) }}</p>

       <!-- QR / Link -->
<div v-if="order.paymentUrl || order.qrCodeUrl" class="mt-3 qr-container">
  <!-- Nút mở liên kết PayOS -->
  <a
    v-if="order.paymentUrl && order.paymentStatus !== 'PAID'"
    :href="order.paymentUrl"
    target="_blank"
    class="btn"
    :class="order.paymentStatus === 'UNPAID' ? 'btn-primary' : 'btn-warning text-dark pulse-button'"
  >
    <i class="bi bi-credit-card me-1"></i>
    {{ order.paymentStatus === 'UNPAID' ? 'Thanh toán PayOS' : 'Đang chờ xác nhận...' }}
  </a>
</div>


        <p class="text-muted mt-3 small">Trang sẽ tự động cập nhật trạng thái mỗi 10 giây...</p>
      </div>

      <button class="btn btn-secondary mt-4" @click="goToOrders">Xem danh sách đơn hàng</button>
    </div>

    <!-- Popup realtime -->
    <div v-if="showSuccess" class="popup-overlay d-flex align-items-center justify-content-center">
      <div class="popup-card text-center p-4 shadow-lg bg-white rounded-4">
        <div class="icon mb-3">
          <i class="bi bi-check-circle-fill text-success display-3"></i>
        </div>
        <h4 class="fw-bold mb-2">Thanh toán thành công!</h4>
        <p class="text-muted mb-4">Đơn hàng #{{ order.id }} đã được xác nhận.</p>
        <button class="btn btn-primary w-100" @click="closeSuccessPopup">Đóng</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import payosService from "@/services/payosService";
import orderService from "@/services/orderService";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref(null);
const order = ref(null);
const isPaid = ref(false);
const showSuccess = ref(false);
let intervalId = null;

function formatCurrency(value) {
  return value?.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) || "0₫";
}

function goToOrders() {
  router.push("/order");
}

function closeSuccessPopup() {
  showSuccess.value = false;
}

async function refreshPaymentStatus() {
  if (!order.value?.orderId || order.value.paymentMethod !== "QR") return;

  try {
    const updatedOrder = await orderService.getOrderById(order.value.orderId);

    const wasPaid = isPaid.value;

    order.value = {
      ...order.value,
      paymentStatus: updatedOrder.paymentStatus,
      paymentUrl: updatedOrder.checkoutUrl || updatedOrder.paymentUrl,
      qrCodeUrl: updatedOrder.qrCode || updatedOrder.qrCodeUrl,
      finalAmount: updatedOrder.finalAmount,
      transactionCode: updatedOrder.transactionCode,
      paidAt: updatedOrder.paidAt
    };

    isPaid.value = updatedOrder.paymentStatus === "PAID";

    if (!wasPaid && isPaid.value) showSuccess.value = true;
  } catch (err) {
    console.error("❌ Lỗi khi refresh trạng thái thanh toán:", err);
    error.value = "Không thể kiểm tra trạng thái thanh toán.";
  }
}

onMounted(() => {
  try {
    const orderData = route.query.orderData;
    if (!orderData) {
      error.value = "Không tìm thấy thông tin đơn hàng.";
      loading.value = false;
      return;
    }

    order.value = JSON.parse(orderData);
    isPaid.value = order.value.paymentStatus === "PAID";

    if (!isPaid.value && order.value.paymentMethod === "QR") {
      refreshPaymentStatus();
      intervalId = setInterval(refreshPaymentStatus, 10000);
    }
  } catch (err) {
    console.error(err);
    error.value = "Không thể xử lý dữ liệu đơn hàng.";
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});

onMounted(() => {
  try {
    const orderData = route.query.orderData;
    if (!orderData) {
      error.value = "Không tìm thấy thông tin đơn hàng.";
      loading.value = false;
      return;
    }

    order.value = JSON.parse(orderData);

    isPaid.value =
      order.value.paymentStatus === "PAID" ||
      (typeof order.value.status === "string"
        ? order.value.status.toLowerCase() === "completed"
        : order.value.status === 2);

    if (!isPaid.value) {
      refreshPaymentStatus();
      intervalId = setInterval(refreshPaymentStatus, 50000);
    }
  } catch (err) {
    console.error(err);
    error.value = "Không thể xử lý dữ liệu đơn hàng.";
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<style scoped>
.payment-result-container { animation: fadeIn 0.5s ease-in-out; }
.text-muted { color: #6c757d; }
.btn { min-width: 180px; }

.popup-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0,0,0,0.55);
  z-index: 1050;
}
.popup-card {
  width: 380px;
  max-width: 90%;
  animation: zoomIn 0.4s ease;
}

/* Icon hourglass lắc lư */
.icon-pending { animation: shake 1s infinite alternate; }
@keyframes shake { 0% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } 100% { transform: rotate(-10deg); } }

/* QR code nhấp nháy */
.qr-blink { animation: blink 1.2s infinite; }
@keyframes blink { 0%,50%,100% { opacity:1; } 25%,75% { opacity:0.4; } }

@keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
@keyframes zoomIn { from { transform:scale(0.85); opacity:0; } to { transform:scale(1); opacity:1; } }
</style>
