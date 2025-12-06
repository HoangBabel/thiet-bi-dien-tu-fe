<template>
  <div class="checkout-container container mt-5">
    <h3 class="mb-4 text-center fw-bold text-primary">🛒 Thanh Toán Đơn Thuê</h3>

    <div class="row g-4">
      <!-- Thông tin giao hàng -->
      <div class="col-md-6">
        <div class="card shadow border-0 checkout-card">
          <div class="card-header text-white bg-gradient-primary fw-semibold">
            Thông tin giao hàng
          </div>

          <div class="card-body">
            <form @submit.prevent="submitOrder">
              <!-- Địa chỉ -->
              <div class="mb-3">
                <label class="form-label">Địa chỉ</label>
                <textarea v-model="checkout.ShippingAddress" class="form-control" rows="2" required></textarea>
              </div>

              <!-- Tỉnh -->
              <div class="mb-3">
                <label class="form-label">Tỉnh/Thành phố</label>
                <select v-model="checkout.ToProvinceId" @change="onProvinceChange" class="form-select" required>
                  <option value="" disabled>Chọn tỉnh/thành phố</option>
                  <option v-for="p in provinces" :key="p.ProvinceID" :value="p.ProvinceID">
                    {{ p.ProvinceName }}
                  </option>
                </select>
              </div>

              <!-- Huyện -->
              <div class="mb-3">
                <label class="form-label">Quận/Huyện</label>
                <select v-model="checkout.ToDistrictId" @change="onDistrictChange" class="form-select" required>
                  <option value="" disabled>Chọn quận/huyện</option>
                  <option v-for="d in districts" :key="d.DistrictID" :value="d.DistrictID">
                    {{ d.DistrictName }}
                  </option>
                </select>
              </div>

              <!-- Xã -->
              <div class="mb-3">
                <label class="form-label">Phường/Xã</label>
                <select v-model="checkout.ToWardCode" class="form-select" required>
                  <option value="" disabled>Chọn phường/xã</option>
                  <option v-for="w in wards" :key="w.WardCode" :value="w.WardCode">
                    {{ w.WardName }}
                  </option>
                </select>
              </div>

              <!-- Shipping service -->
              <div class="mb-3">
                <label class="form-label">Loại dịch vụ vận chuyển</label>
                <select v-model="checkout.ServiceId" class="form-select">
                  <option disabled value="">Chọn dịch vụ</option>
                  <option v-for="s in serviceTypes" :key="s.service_id" :value="s.service_id">
                    {{ s.service_type }} - {{ formatCurrency(getShippingFeeById(s.service_id)) }}
                  </option>
                </select>
              </div>

              <!-- Voucher -->
              <div class="mb-3">
                <label class="form-label">Mã giảm giá</label>
                <div class="input-group">
                  <input v-model="voucherCode" type="text" class="form-control" placeholder="Nhập mã giảm giá (nếu có)" />
                  <button type="button" class="btn btn-outline-primary" @click="applyVoucherCode" :disabled="loadingVoucher">
                    <span v-if="loadingVoucher" class="spinner-border spinner-border-sm me-2"></span>
                    Áp dụng
                  </button>
                </div>
                <div v-if="voucherError" class="text-danger small mt-2">{{ voucherError }}</div>
                <div v-if="voucherSuccess" class="text-success small mt-2">
                  ✅ Giảm {{ formatCurrency(voucherDiscount) }} với mã "{{ voucherSuccess }}"
                </div>
              </div>

              <!-- Payment -->
              <div class="mb-3">
                <label class="form-label">Phương thức thanh toán</label>
                <select v-model="checkout.PaymentMethod" class="form-select">
                  <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                  <option value="QR">Thanh toán QR/PayOS</option>
                </select>
              </div>

              <button type="submit" class="btn btn-success w-100 py-2 fw-semibold" :disabled="loading">
                <span v-if="loading">
                  <span class="spinner-border spinner-border-sm me-2"></span>Đang xử lý...
                </span>
                <span v-else>💳 Xác nhận thanh toán</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="col-md-6">
        <div class="card shadow border-0 order-summary">
          <div class="card-header text-white bg-gradient-secondary fw-semibold">Tóm tắt đơn hàng</div>

          <ul class="list-group list-group-flush">
            <li v-for="item in rentalItems" :key="item.id"
                class="list-group-item d-flex justify-content-between align-items-center">
              <div>
                {{ item.productName }} (x{{ item.quantity }})
                <div class="text-muted small">
                  Số ngày: {{ item.units }},
                  Đơn giá: {{ formatCurrency(item.pricePerUnitAtBooking) }}
                </div>
              </div>
              <strong>{{ formatCurrency(item.subTotal) }}</strong>
            </li>

            <li v-if="rentalData?.depositPaid"
                class="list-group-item d-flex justify-content-between text-warning">
              <span>Cọc đã thanh toán:</span>
              <strong>{{ formatCurrency(rentalData.depositPaid) }}</strong>
            </li>

            <li class="list-group-item d-flex justify-content-between">
              <span>Phí vận chuyển:</span>
              <strong>{{ formatCurrency(selectedShippingFee) }}</strong>
            </li>

            <li v-if="voucherDiscount > 0"
                class="list-group-item d-flex justify-content-between text-success">
              <span>Giảm giá:</span>
              <strong>-{{ formatCurrency(voucherDiscount) }}</strong>
            </li>

            <li class="list-group-item d-flex justify-content-between fw-bold fs-5 bg-light">
              <span>Tổng cộng:</span>
              <span class="text-success">{{ formatCurrency(finalTotalWithDeposit) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Success Popup -->
    <div v-if="showSuccess" class="popup-overlay d-flex align-items-center justify-content-center">
      <div class="popup-card text-center p-4 shadow-lg bg-white rounded-4">
        <div class="icon mb-3">
          <i class="bi bi-check-circle-fill text-success display-3"></i>
        </div>
        <h4 class="fw-bold mb-2">Đặt thuê thành công!</h4>
        <p class="text-muted mb-4">Cảm ơn bạn đã đặt thuê. Đơn hàng của bạn đang được xử lý.</p>
        <button class="btn btn-primary w-100" @click="goToOrders">Xem đơn hàng</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";

import rentalService from "@/services/RentalService";
import rentalCheckoutService from "@/services/rentalCheckoutService";
import locationService from "@/services/locationService";
import shippingService from "@/services/shippingService";
import { useAuthStore } from "@/stores/auth";

import payosService from "@/services/payosService";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const rentalId = Number(route.query.rentalId || 0);
const rentalData = ref(null);
const rentalItems = ref([]);

const checkout = ref({
  ShippingAddress: "",
  PaymentMethod: "COD",
  ToProvinceId: null,
  ToDistrictId: null,
  ToWardCode: "",
  ServiceId: null,
  Weight: 200,
  Length: 20,
  Width: 20,
  Height: 20
});

// Location data
const provinces = ref([]);
const districts = ref([]);
const wards = ref([]);
const shippingOptions = ref([]);
const serviceTypes = ref([]);

// Voucher state
const voucherCode = ref("");
const voucherDiscount = ref(0);
const voucherSuccess = ref(null);
const voucherError = ref(null);
const loadingVoucher = ref(false);

const loading = ref(false);
const showSuccess = ref(false);

// Computed values
const selectedShippingFee = computed(() => {
  const opt = shippingOptions.value.find(s => s.service_id === checkout.value.ServiceId);
  return opt ? opt.shipping_fee : 0;
});

const finalTotalWithDeposit = computed(() => {
  const itemsTotal = rentalItems.value.reduce((s, i) => s + i.subTotal, 0);
  const deposit = rentalData.value?.depositPaid || 0;
  return itemsTotal + selectedShippingFee.value - voucherDiscount.value + deposit;
});

function formatCurrency(v) {
  return v?.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) || "0₫";
}

function getShippingFeeById(id) {
  const opt = shippingOptions.value.find(s => s.service_id === id);
  return opt ? opt.shipping_fee : 0;
}

// Load rental data
async function loadRentalData() {
  try {
    const data = await rentalService.getRentalById(rentalId);
    rentalData.value = data;
    rentalItems.value = data.items.map(i => ({
      ...i,
      subTotal: i.pricePerUnitAtBooking * i.quantity * i.units
    }));
  } catch (e) { console.error(e); }
}

// Location
async function loadProvinces() { provinces.value = await locationService.getProvinces(); }
async function loadDistricts(id) { districts.value = await locationService.getDistricts(id); }
async function loadWards(id) { wards.value = await locationService.getWards(id); }

function onProvinceChange() {
  checkout.value.ToDistrictId = null;
  checkout.value.ToWardCode = "";
  districts.value = [];
  wards.value = [];
  loadDistricts(checkout.value.ToProvinceId);
}

function onDistrictChange() {
  checkout.value.ToWardCode = "";
  wards.value = [];
  loadWards(checkout.value.ToDistrictId);
}

// Recalculate shipping
watch(
  [() => checkout.value.ToDistrictId, () => checkout.value.ToWardCode, () => checkout.value.Weight],
  async () => {
    if (!checkout.value.ToDistrictId || !checkout.value.ToWardCode) return;
    try {
      shippingOptions.value = await shippingService.calculateShipping({
        to_district_id: checkout.value.ToDistrictId,
        to_ward_code: checkout.value.ToWardCode,
        weight: checkout.value.Weight
      });
      serviceTypes.value = shippingOptions.value.map(s => ({ service_id: s.service_id, service_type: s.service_type }));
      if (!shippingOptions.value.find(s => s.service_id === checkout.value.ServiceId)) {
        checkout.value.ServiceId = shippingOptions.value[0]?.service_id || null;
      }
    } catch(e) {
      shippingOptions.value = [];
      serviceTypes.value = [];
      console.error(e);
    }
  }
);

// Voucher
async function applyVoucherCode() {
  if (!voucherCode.value.trim()) {
    voucherError.value = "Vui lòng nhập mã giảm giá.";
    return;
  }
  voucherError.value = null;
  voucherSuccess.value = null;
  loadingVoucher.value = true;

  try {
    const result = await rentalCheckoutService.validateVoucher({
      rentalId,
      code: voucherCode.value.trim()
    });
    voucherDiscount.value = result.discount || 0;
    voucherSuccess.value = result.code || null;
  } catch (e) {
    voucherError.value = "Mã không hợp lệ hoặc đã hết hạn.";
    voucherDiscount.value = 0;
    voucherSuccess.value = null;
  } finally {
    loadingVoucher.value = false;
  }
}

// Submit order
async function submitOrder() {
  if (!authStore.isLoggedIn) {
    alert("Vui lòng đăng nhập.");
    router.push("/login");
    return;
  }

  if (!checkout.value.ShippingAddress || !checkout.value.ToProvinceId || !checkout.value.ToDistrictId || !checkout.value.ToWardCode) {
    alert("Vui lòng chọn đầy đủ địa chỉ giao hàng.");
    return;
  }

  loading.value = true;

  try {
    const payload = {
      RentalId: rentalId,
      ShippingAddress: checkout.value.ShippingAddress,
      ToProvinceId: checkout.value.ToProvinceId,
      ToProvinceName: provinces.value.find(x => x.ProvinceID === checkout.value.ToProvinceId)?.ProvinceName,
      ToDistrictId: checkout.value.ToDistrictId,
      ToDistrictName: districts.value.find(x => x.DistrictID === checkout.value.ToDistrictId)?.DistrictName,
      ToWardCode: checkout.value.ToWardCode,
      ToWardName: wards.value.find(x => x.WardCode === checkout.value.ToWardCode)?.WardName,
      ServiceId: checkout.value.ServiceId,
      Weight: checkout.value.Weight,
      Length: checkout.value.Length,
      Width: checkout.value.Width,
      Height: checkout.value.Height,
      PaymentMethod: checkout.value.PaymentMethod === "QR" ? 1 : 0,
      VoucherCode: voucherCode.value.trim() || null
    };

    const result = await rentalCheckoutService.checkoutRental(payload);

    if (result.voucherCode) voucherSuccess.value = result.voucherCode;
    voucherDiscount.value = result.discount || 0;

    if (checkout.value.PaymentMethod === "QR") {
      let payResult;
      try {
        payResult = await payosService.createRentalPaymentLink(result.rentalId);
      } catch (err) {
        const data = err.response?.data;
        if (data?.message?.includes("Đã tồn tại link thanh toán")) {
          payResult = {
            message: data.message,
            rentalId: result.rentalId,
            paymentUrl: data.paymentUrl || "",
            qrCodeUrl: data.qrCodeUrl || "",
            paymentLinkId: data.paymentLinkId || "",
            status: data.status || "PENDING"
          };
        } else {
          console.error("❌ Lỗi tạo PayOS link:", err);
          alert("Lỗi khi tạo PayOS link: " + (data?.message || err.message));
          return;
        }
      }

      const stopPolling = payosService.pollRentalPaymentStatus(result.rentalId, (status) => {
        if (status.paymentStatus === "PAID") {
          stopPolling();
          showSuccess.value = true;
        }
      }, 5000, 60);

      router.push({
        path: "/rental-payment-result",
        query: { rentalData: JSON.stringify(payResult) }
      });
      return;
    }

    showSuccess.value = true;

  } catch (err) {
    console.error("❌ Lỗi khi thanh toán:", err);
    const msg = err.response?.data?.message || err.response?.data?.error || err.message || "";
    alert("Lỗi khi thanh toán: " + msg);
  } finally {
    loading.value = false;
  }
}

function goToOrders() {
  showSuccess.value = false;
  router.push("/rentalOrder");
}

onMounted(() => {
  loadRentalData();
  loadProvinces();
});
</script>

<style scoped>
.checkout-container { animation: fadeIn 0.5s ease-in-out; }
.bg-gradient-primary { background: linear-gradient(135deg, #007bff, #00bcd4); }
.bg-gradient-secondary { background: linear-gradient(135deg, #6c757d, #adb5bd); }
.checkout-card, .order-summary { border-radius: 12px; overflow: hidden; background-color: #f9fafb; }
.btn-success { background-color: #28a745; border: none; transition: 0.3s ease; }
.btn-success:hover { background-color: #218838; transform: scale(1.02); }
.popup-overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,0.55); z-index: 1050; }
.popup-card { width: 380px; max-width: 90%; animation: zoomIn 0.4s ease; }
@keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
@keyframes zoomIn { from { transform:scale(0.85); opacity:0; } to { transform:scale(1); opacity:1; } }
</style>
