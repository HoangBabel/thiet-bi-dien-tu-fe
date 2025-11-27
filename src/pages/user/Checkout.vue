<template>
  <div class="checkout-container container mt-5">
    <h3 class="mb-4 text-center fw-bold text-primary">🛒 Thanh Toán Đơn Hàng</h3>

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
                <textarea v-model="checkout.address" class="form-control" rows="2" required></textarea>
              </div>

              <!-- Tỉnh/Thành phố -->
              <div class="mb-3">
                <label class="form-label">Tỉnh/Thành phố</label>
                <select v-model="checkout.toProvinceId" @change="onProvinceChange" class="form-select" required>
                  <option value="" disabled>Chọn tỉnh/thành phố</option>
                  <option v-for="p in provinces" :key="p.ProvinceID" :value="p.ProvinceID">{{ p.ProvinceName }}</option>
                </select>
              </div>

              <!-- Quận/Huyện -->
              <div class="mb-3">
                <label class="form-label">Quận/Huyện</label>
                <select v-model="checkout.toDistrictId" @change="onDistrictChange" class="form-select" required>
                  <option value="" disabled>Chọn quận/huyện</option>
                  <option v-for="d in districts" :key="d.DistrictID" :value="d.DistrictID">{{ d.DistrictName }}</option>
                </select>
              </div>

              <!-- Phường/Xã -->
              <div class="mb-3">
                <label class="form-label">Phường/Xã</label>
                <select v-model="checkout.toWardCode" class="form-select" required>
                  <option value="" disabled>Chọn phường/xã</option>
                  <option v-for="w in wards" :key="w.WardCode" :value="w.WardCode">{{ w.WardName }}</option>
                </select>
              </div>

              <!-- Loại dịch vụ vận chuyển GHN -->
              <div class="mb-3">
                <label class="form-label">Loại dịch vụ vận chuyển</label>
                <select v-model="checkout.serviceId" class="form-select">
                  <option disabled value="">Chọn dịch vụ</option>
                  <option v-for="s in serviceTypes" :key="s.service_id" :value="s.service_id">
                    {{ s.service_type }} - {{ formatCurrency(getShippingFeeById(s.service_id)) }}
                  </option>
                </select>
              </div>

              <!-- Phương thức thanh toán -->
              <div class="mb-3">
                <label class="form-label">Phương thức thanh toán</label>
                <select v-model="checkout.paymentMethod" class="form-select">
                  <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                  <option value="QR">Thanh toán QR/PayOS</option>
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
                <div v-if="voucherError" class="text-danger mt-2 small">{{ voucherError }}</div>
                <div v-if="voucherSuccess" class="text-success mt-2 small">
                  ✅ Giảm {{ formatCurrency(voucherDiscount) }} với mã "{{ voucherSuccess }}"
                </div>
              </div>

              <!-- Submit -->
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

      <!-- Tóm tắt đơn hàng -->
      <div class="col-md-6">
        <div class="card shadow border-0 order-summary">
          <div class="card-header text-white bg-gradient-secondary fw-semibold">
            Tóm tắt đơn hàng
          </div>
          <ul class="list-group list-group-flush">
            <li v-if="cartItems.length === 0" class="list-group-item text-muted">Không có sản phẩm trong giỏ hàng.</li>

            <li v-for="item in cartItems" :key="item.id || item.productId" class="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <div class="fw-semibold">{{ item.productName || item.name }}</div>
                <small class="text-muted">x{{ item.quantity }} × {{ formatCurrency(item.unitPrice || item.price) }}</small>
              </div>
              <strong>{{ formatCurrency(lineTotal(item)) }}</strong>
            </li>

            <li class="list-group-item d-flex justify-content-between">
              <span>Phí vận chuyển:</span>
              <strong>{{ formatCurrency(selectedShippingFee) }}</strong>
            </li>

            <li v-if="voucherDiscount > 0" class="list-group-item d-flex justify-content-between text-success">
              <span>Giảm giá:</span>
              <strong>-{{ formatCurrency(voucherDiscount) }}</strong>
            </li>

            <li class="list-group-item d-flex justify-content-between fw-bold fs-5 bg-light">
              <span>Tổng cộng:</span>
              <span class="text-success">{{ formatCurrency(finalTotal) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Popup COD / Success -->
    <div v-if="showSuccess" class="popup-overlay d-flex align-items-center justify-content-center">
      <div class="popup-card text-center p-4 shadow-lg bg-white rounded-4">
        <div class="icon mb-3">
          <i class="bi bi-check-circle-fill text-success display-3"></i>
        </div>
        <h4 class="fw-bold mb-2">Đặt hàng thành công!</h4>
        <p class="text-muted mb-4">Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đang được xử lý.</p>
        <button class="btn btn-primary w-100" @click="goToOrders">Xem đơn hàng</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useCartStore } from "@/stores/cart";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

import checkoutService from "@/services/checkoutService";
import locationService from "@/services/locationService";
import shippingService from "@/services/shippingService";

const cartStore = useCartStore();
const authStore = useAuthStore();
const router = useRouter();

// Reactive access to cart items and subtotal
const cartItems = computed(() => cartStore.items || []);
const total = computed(() => cartStore.totalAmount || 0);

// Load cart and provinces
onMounted(() => {
  cartStore.loadCart();
  loadProvinces();
});

const shippingOptions = ref([]);
const selectedShippingFee = computed(() => {
  const option = shippingOptions.value.find(s => s.service_id === checkout.value.serviceId);
  return option ? option.shipping_fee : 0;
});

const voucherCode = ref("");
const voucherDiscount = ref(0);
const voucherSuccess = ref(null);
const voucherError = ref(null);
const loadingVoucher = ref(false);

const checkout = ref({
  address: "",
  paymentMethod: "COD",
  toProvinceId: null,
  toDistrictId: null,
  toWardCode: "",
  serviceId: 53321,
  weight: 200,
  length: 20,
  width: 20,
  height: 20
});

const serviceTypes = ref([]);
const loading = ref(false);
const showSuccess = ref(false);

const provinces = ref([]);
const districts = ref([]);
const wards = ref([]);

const finalTotal = computed(() => Math.max(0, (total.value || 0) + (selectedShippingFee.value || 0) - (voucherDiscount.value || 0)));

function formatCurrency(value) {
  if (value == null) return "0₫";
  return Number(value).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}

function lineTotal(item) {
  const qty = Number(item.quantity || 0);
  const unit = Number(item.unitPrice ?? item.price ?? item.unit_price ?? 0);
  return qty * unit;
}

function getShippingFeeById(id) {
  const opt = shippingOptions.value.find(s => s.service_id === id);
  return opt ? opt.shipping_fee : 0;
}

// Load địa chỉ
async function loadProvinces() { try { provinces.value = await locationService.getProvinces(); } catch(e){console.error(e);} }
async function loadDistricts(provinceId) { try { districts.value = await locationService.getDistricts(provinceId); } catch(e){console.error(e);} }
async function loadWards(districtId) { try { wards.value = await locationService.getWards(districtId); } catch(e){console.error(e);} }

function onProvinceChange() {
  checkout.value.toDistrictId = null;
  checkout.value.toWardCode = "";
  districts.value = [];
  wards.value = [];
  if (checkout.value.toProvinceId) loadDistricts(checkout.value.toProvinceId);
}

function onDistrictChange() {
  checkout.value.toWardCode = "";
  wards.value = [];
  if (checkout.value.toDistrictId) loadWards(checkout.value.toDistrictId);
}

// Watch địa chỉ/trọng lượng → load phí dịch vụ
watch(
  [() => checkout.value.toDistrictId, () => checkout.value.toWardCode, () => checkout.value.weight],
  async () => {
    if (!checkout.value.toDistrictId || !checkout.value.toWardCode) return;
    try {
      shippingOptions.value = await shippingService.calculateShipping({
        to_district_id: checkout.value.toDistrictId,
        to_ward_code: checkout.value.toWardCode,
        weight: checkout.value.weight
      });
      serviceTypes.value = shippingOptions.value.map(s => ({ service_id: s.service_id, service_type: s.service_type }));
      if (!shippingOptions.value.find(s => s.service_id === checkout.value.serviceId)) {
        checkout.value.serviceId = shippingOptions.value[0]?.service_id;
      }
    } catch(e){ shippingOptions.value=[]; console.error(e); }
  }
);

// Voucher
async function applyVoucherCode() {
  if (!voucherCode.value.trim()) { voucherError.value="Vui lòng nhập mã giảm giá."; return; }
  voucherError.value=null; voucherSuccess.value=null; loadingVoucher.value=true;
  try {
    const res = await checkoutService.applyVoucher?.(voucherCode.value, total.value, selectedShippingFee.value) || { discount:0, voucherCode:null };
    voucherDiscount.value = res.discount || 0; 
    voucherSuccess.value = res.voucherCode || null;
  } catch(e){ voucherError.value="Mã không hợp lệ hoặc đã hết hạn."; voucherDiscount.value=0; console.error(e); }
  finally { loadingVoucher.value=false; }
}

// Submit
async function submitOrder() {
  if (!authStore.isLoggedIn) { alert("Vui lòng đăng nhập trước khi thanh toán."); router.push("/login"); return; }
  if (!checkout.value.address || !checkout.value.toProvinceId || !checkout.value.toDistrictId || !checkout.value.toWardCode) { alert("Vui lòng chọn đầy đủ địa chỉ giao hàng."); return; }
  if (!cartItems.value || cartItems.value.length === 0) { alert("Giỏ hàng đang trống."); return; }

  loading.value = true;
  try {
    const payload = {
      ShippingAddress: checkout.value.address,
      ToProvinceId: checkout.value.toProvinceId,
      ToProvinceName: provinces.value.find(p => p.ProvinceID === checkout.value.toProvinceId)?.ProvinceName,
      ToDistrictId: checkout.value.toDistrictId,
      ToDistrictName: districts.value.find(d => d.DistrictID === checkout.value.toDistrictId)?.DistrictName,
      ToWardCode: checkout.value.toWardCode,
      ToWardName: wards.value.find(w => w.WardCode === checkout.value.toWardCode)?.WardName,
      ServiceId: checkout.value.serviceId,
      Weight: checkout.value.weight,
      Length: checkout.value.length,
      Width: checkout.value.width,
      Height: checkout.value.height,
      PaymentMethod: checkout.value.paymentMethod === "QR" ? 1 : 0,
      VoucherCode: voucherCode.value.trim() || null
    };

    const order = await checkoutService.checkout(payload);

    // QR flow
    if (checkout.value.paymentMethod === "QR" && order?.paymentLinkId) {
      const stopPolling = checkoutService.pollOrderStatus(order.orderId, (updatedOrder) => {
        if (updatedOrder.paymentStatus === "PAID" && !showSuccess.value) {
          showSuccess.value = true;
          cartStore.clearCart();
          stopPolling();
        }
      });
      router.push({ path: "/payment-result", query: { orderData: JSON.stringify(order) } });
      return;
    }

    // COD / success
    await cartStore.clearCart();
    showSuccess.value = true;

  } catch (err) {
    console.error("❌ Lỗi khi thanh toán:", err?.response?.data || err?.message || err);
    alert(err?.response?.data?.message || err?.response?.data?.error || err?.message || "Lỗi khi thanh toán, vui lòng thử lại.");
  } finally { loading.value = false; }
}

function goToOrders() { showSuccess.value=false; router.push("/order"); }
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
