<template>
  <div class="rental-admin-container">
    <h2 class="mb-3 fw-bold text-dark">📊 Quản lý đơn thuê</h2>

    <!-- FILTER -->
    <div class="d-flex flex-wrap align-items-center mb-4 gap-2">
      <div class="input-group shadow-sm" style="max-width: 400px;">
        <input
          v-model="search"
          class="form-control"
          placeholder="Tìm theo tên hoặc email..."
          @keyup.enter="applyFilters"
        />
        <button class="btn btn-gradient" @click="applyFilters">Tìm</button>
      </div>

      <div class="ms-auto">
        <select
          v-model="statusFilter"
          class="form-select shadow-sm"
          style="width: 220px"
          @change="applyFilters"
        >
          <option value="">Tất cả trạng thái</option>
          <option v-for="s in rentalStatuses" :key="s.value" :value="s.value">
            {{ s.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- TABLE -->
    <div class="table-responsive shadow-sm rounded-3">
      <table class="table table-hover align-middle">
        <thead class="table-dark">
          <tr>
            <th>#</th>
            <th>Rental ID</th>
            <th>Khách hàng</th>
            <th>Ngày thuê</th>
            <th>Số ngày</th>
            <th>Tổng</th>
            <th>Trạng thái</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(r, i) in pagedRentals" :key="r.id">
            <td>{{ (currentPage - 1) * pageSize + i + 1 }}</td>
            <td>#{{ r.id }}</td>

            <td>
              {{ r.fullName || r.user?.fullName || r.email }}
              <br />
              <small class="text-muted">{{ r.email || r.user?.email }}</small>
            </td>

            <td>
              {{ formatDate(r.startDate) }} <br />
              → {{ formatDate(r.endDate) }}
            </td>

            <td>{{ totalDays(r) }}</td>

            <td class="fw-bold text-primary">
              {{ formatPrice(totalAll(r)) }}
            </td>

            <td>
              <span :class="statusClass(r.status)">
                {{ statusLabel(r.status) }}
              </span>
            </td>

            <td>
              <button class="btn btn-sm btn-warning me-1" @click="openStatusModal(r)">
                Cập nhật
              </button>
              <button class="btn btn-sm btn-info" @click="openDetail(r)">
                Chi tiết
              </button>
            </td>
          </tr>

          <tr v-if="pagedRentals.length === 0">
            <td colspan="9" class="text-center text-muted py-3">
              Không có đơn thuê phù hợp.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PAGINATION -->
    <nav v-if="totalPages > 1" class="mt-3 d-flex justify-content-center">
      <ul class="pagination shadow-sm">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link" @click="changePage(currentPage - 1)">‹</button>
        </li>

        <li
          v-for="p in totalPages"
          :key="p"
          class="page-item"
          :class="{ active: currentPage === p }"
        >
          <button class="page-link" @click="changePage(p)">{{ p }}</button>
        </li>

        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button class="page-link" @click="changePage(currentPage + 1)">›</button>
        </li>
      </ul>
    </nav>

    <!-- STATUS MODAL -->
    <div class="modal fade" tabindex="-1" ref="statusModalRef">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 shadow-lg">
          <form @submit.prevent="saveStatus">
            <div class="modal-header bg-dark text-white">
              <h5 class="modal-title">Cập nhật trạng thái</h5>
              <button class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body">
              <select v-model="selectedStatus" class="form-select">
                <option v-for="s in rentalStatuses" :key="s.value" :value="s.value">
                  {{ s.label }}
                </option>
              </select>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
              <button class="btn btn-success">Lưu</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- ===== DETAIL FORM (ADMIN ORDER STYLE) ===== -->
    <div v-if="detailVisible" class="detail-overlay" @click.self="closeDetail">
      <div class="detail-panel">
        <div class="detail-header d-flex justify-content-between align-items-center">
          <h5 class="fw-bold">🧾 Chi tiết đơn thuê #{{ selectedRental.id }}</h5>
          <button class="btn-close" @click="closeDetail"></button>
        </div>

        <div class="detail-body mt-3">
          <!-- Customer -->
          <section class="mb-4">
            <h6 class="fw-bold text-primary">👤 Khách hàng</h6>
            <p><strong>Họ tên:</strong> {{ selectedRental.fullName }}</p>
            <p><strong>Email:</strong> {{ selectedRental.email }}</p>
          </section>

          <!-- Rental -->
          <section class="mb-4">
            <h6 class="fw-bold text-primary">📅 Thông tin thuê</h6>
            <p><strong>Bắt đầu:</strong> {{ formatDate(selectedRental.startDate) }}</p>
            <p><strong>Kết thúc:</strong> {{ formatDate(selectedRental.endDate) }}</p>

            <p>
              <strong>Trạng thái:</strong>
              <span :class="statusClass(selectedRental.status)">
                {{ statusLabel(selectedRental.status) }}
              </span>
            </p>

                      <p><strong>Tiền cọc:</strong> {{ formatPrice(selectedRental.depositPaid || 0) }}</p>

          <p><strong>Tổng thanh toán:</strong>
            <span class="fw-bold text-primary">
              {{ formatPrice(selectedRental.totalPrice || 0) }}
            </span>
          </p>

          <p class="mt-2"><strong>Tổng cộng:</strong>
            <span class="fw-bold text-danger">
              {{ formatPrice(totalAll(selectedRental)) }}
            </span>
          </p>
          </section>

          <!-- Items -->
          <section>
            <h6 class="fw-bold text-primary mb-2">📦 Sản phẩm thuê</h6>

            <div
              v-for="i in normalizedItems"
              :key="i.id"
              class="product-item shadow-sm mb-3 p-3 rounded"
            >
              <div class="fw-bold">{{ i.productName }}</div>
              <div>Số lượng: {{ i.quantity }}</div>
              <div>Số ngày: {{ i.units }}</div>
              <div>Đơn giá/ngày: {{ formatPrice(i.pricePerUnitAtBooking) }}</div>

              <div class="text-end fw-bold text-primary mt-2">
                Thành tiền: {{ formatPrice(i.subTotal) }}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>

    <!-- ===== TOAST ===== -->
<div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 3000">
  <div
    v-if="toastMessage"
    class="toast show align-items-center text-white border-0"
    :class="toastType"
    role="alert"
  >
    <div class="d-flex">
      <div class="toast-body">
        {{ toastMessage }}
      </div>
      <button
        type="button"
        class="btn-close btn-close-white me-2 m-auto"
        @click="toastMessage = ''"
      ></button>
    </div>
  </div>
</div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Modal } from "bootstrap";
import rentalService from "@/services/dailyRentalService";

/* ===== DATA ===== */
const rentals = ref([]);
const search = ref("");
const statusFilter = ref("");
const currentPage = ref(1);
const pageSize = 10;
const totalPages = ref(1);

const statusModalRef = ref(null);
let statusModalInstance = null;

const selectedRental = ref(null);
const selectedStatus = ref("");
const detailVisible = ref(false);

const toastMessage = ref("");
const toastType = ref("bg-success");

function getProductName(item) {
  return (
    item.productName ||
    item.product?.name ||
    item.product?.title ||
    "Không xác định"
  );
}

/* ===== STATUSES ===== */
const rentalStatuses = [
  { value: "Pending", label: "Đang chờ" },
  { value: "Paid", label: "Đã thanh toán" },
  { value: "Active", label: "Đang thuê" },
  { value: "Completed", label: "Hoàn tất" },
  { value: "Cancelled", label: "Đã hủy" }
];

/* ===== FORMAT ===== */
function totalDays(r) {
  const s = new Date(r.startDate);
  const e = new Date(r.endDate);
  return Math.max(1, Math.ceil((e - s) / 86400000));
}

function totalAll(r) {
  return Number(r.totalPrice || 0) + Number(r.depositPaid || 0);
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("vi-VN");
}

function formatPrice(v) {
  return (v || 0).toLocaleString("vi-VN") + " ₫";
}

function statusLabel(s) {
  return rentalStatuses.find(x => x.value === s)?.label || s;
}

function statusClass(s) {
  switch (s) {
    case "Pending": return "badge bg-warning text-dark";
    case "Paid": return "badge bg-info text-dark";
    case "Active": return "badge bg-primary";
    case "Completed": return "badge bg-success";
    case "Cancelled": return "badge bg-secondary";
    default: return "badge bg-light text-dark";
  }
}


function paymentText(s) {
  return s === "PAID" ? "Đã thanh toán"
    : s === "PENDING" ? "Đang xử lý"
    : s === "UNPAID" ? "Chưa thanh toán"
    : s;
}

function paymentClass(s) {
  return s === "PAID" ? "badge bg-success"
    : s === "PENDING" ? "badge bg-warning text-dark"
    : s === "UNPAID" ? "badge bg-danger"
    : "badge bg-secondary";
}

/* ===== NORMALIZE ITEMS (QUAN TRỌNG) ===== */
const normalizedItems = computed(() => {
  if (!selectedRental.value?.items) return [];

  return selectedRental.value.items.map(i => ({
    ...i,
    productName: i.productName || i.product?.name || "Không xác định",
    units: i.units ?? i.rentalDays ?? 1,
    pricePerUnitAtBooking: i.pricePerUnitAtBooking ?? i.pricePerDay ?? 0,
    subTotal:
      i.subTotal ??
      (i.quantity ?? 1) *
        (i.units ?? i.rentalDays ?? 1) *
        (i.pricePerUnitAtBooking ?? i.pricePerDay ?? 0)
  }));
});

/* ===== LOAD ===== */
async function loadRentals() {
  rentals.value = await rentalService.getAllRentals();
  applyFilters();
}

/* ===== FILTER & PAGINATION ===== */
const filteredRentals = computed(() => {
  let list = rentals.value;

  // 🚫 1. LOẠI ĐƠN CHƯA THANH TOÁN
  list = list.filter(
    r => r.paymentStatus !== "UNPAID"
  );

  // 🔍 2. SEARCH
  if (search.value) {
    const k = search.value.toLowerCase();
    list = list.filter(r =>
      (r.fullName || r.user?.fullName || "")
        .toLowerCase()
        .includes(k) ||
      (r.email || r.user?.email || "")
        .toLowerCase()
        .includes(k)
    );
  }

  // 🏷️ 3. STATUS FILTER
  if (statusFilter.value) {
    list = list.filter(r => r.status === statusFilter.value);
  }

  return list;
});


const pagedRentals = computed(() => {
  totalPages.value = Math.ceil(filteredRentals.value.length / pageSize);
  const start = (currentPage.value - 1) * pageSize;
  return filteredRentals.value.slice(start, start + pageSize);
});

function changePage(p) {
  if (p >= 1 && p <= totalPages.value) currentPage.value = p;
}

function applyFilters() {
  currentPage.value = 1;
}

/* ===== UPDATE STATUS ===== */
function openStatusModal(r) {
  selectedRental.value = r;
  selectedStatus.value = r.status;

  if (!statusModalInstance)
    statusModalInstance = new Modal(statusModalRef.value);

  statusModalInstance.show();
}

async function saveStatus() {
  if (!selectedRental.value) return;

  // ❌ Không thay đổi
  if (selectedRental.value.status === selectedStatus.value) {
    showToast("Trạng thái không thay đổi", "bg-warning");
    return;
  }

  try {
    await rentalService.updateRentalStatus(
      selectedRental.value.id,
      selectedStatus.value
    );

    // ✅ Update local UI
    selectedRental.value.status = selectedStatus.value;

    // ✅ Reload danh sách để đồng bộ
    await loadRentals();

    showToast("Cập nhật trạng thái thành công!", "bg-success");
    statusModalInstance.hide();
  } catch (err) {
    console.error(err);
    showToast(
      err?.response?.data?.error ||
        err?.response?.data ||
        "❌ Cập nhật trạng thái thất bại",
      "bg-danger"
    );
  }
}

/* ===== DETAIL ===== */
function openDetail(r) {
  selectedRental.value = r;
  detailVisible.value = true;
}
function closeDetail() {
  detailVisible.value = false;
}

/* ===== TOAST ===== */
function showToast(msg, type) {
  toastMessage.value = msg;
  toastType.value = type;
  setTimeout(() => (toastMessage.value = ""), 3000);
}

onMounted(loadRentals);
</script>

<style scoped>
.rental-admin-container {
  padding: 2rem;
  background: #f8fafc;
  border-radius: 1rem;
}

/* Button Gradient */
.btn-gradient {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  color: white;
  border: none;
  transition: 0.2s ease;
}
.btn-gradient:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
}

/* Table */
.table-hover tbody tr:hover {
  background-color: rgba(37, 99, 235, 0.05);
}

/* Slide-over panel */
.detail-overlay {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.35);
  display: flex;
  justify-content: flex-end;
  z-index: 2000;
}

.detail-panel {
  width: 420px;
  background: white;
  height: 100%;
  padding: 1.5rem;
  animation: slideIn 0.3s ease;
  overflow-y: auto;
  border-radius: 0.75rem 0 0 0.75rem;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* Toast */
.toast {
  min-width: 280px;
  border-radius: 0.6rem;
  font-size: 0.95rem;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
