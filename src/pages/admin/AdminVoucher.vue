<template>
  <div class="voucher-admin-container">
    <h2 class="mb-3 fw-bold text-dark">🎫 Quản lý Voucher</h2>

    <!-- 🔍 Tìm kiếm + Lọc trạng thái -->
    <div class="d-flex flex-wrap align-items-center mb-3 gap-2">
      <div class="input-group" style="max-width: 400px;">
        <input
          type="text"
          v-model="search"
          class="form-control"
          placeholder="Tìm voucher..."
          @keyup.enter="applyFilters"
        />
        <button class="btn btn-gradient" @click="applyFilters">Tìm</button>
      </div>

      <!-- Lọc trạng thái -->
      <div class="ms-auto">
        <select v-model="statusFilter" class="form-select shadow-sm" style="width: 200px;" @change="applyFilters">
          <option value="">Tất cả trạng thái</option>
          <option value="Valid">Còn hiệu lực</option>
          <option value="Expired">Hết hạn</option>
          <option value="Invalid">Vô hiệu</option>
        </select>
      </div>

      <button class="btn btn-success ms-2" @click="openForm()">+ Thêm Voucher</button>
    </div>

    <!-- 📋 Bảng voucher -->
    <div class="table-responsive shadow-sm rounded-3">
      <table class="table table-hover align-middle">
        <thead class="table-dark">
          <tr>
            <th>#</th>
            <th>Mã</th>
            <th>Loại</th>
            <th>Giá trị</th>
            <th>Hết hạn</th>
            <th>Min Order</th>
            <th>Lượt dùng</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(v, i) in pagedVouchers" :key="v.id">
            <td>{{ (currentPage - 1) * pageSize + i + 1 }}</td>
            <td>{{ v.code }}</td>

            <td>{{ typeLabel(v.type) }}</td>

            <td>
              <template v-if="v.type === 'Fixed'">
                {{ formatPrice(v.discountValue) }}
              </template>

              <template v-else-if="v.type === 'Percent'">
                {{ v.discountPercent }}%
                <div class="text-muted small">
                  Tối đa: {{ formatPrice(v.maximumDiscount) }}
                </div>
              </template>

              <template v-else-if="v.type === 'Shipping'">
                <span class="badge bg-info">
                  {{ v.shippingDiscountPercent === null ? "Free Ship 100%" : "Giảm " + v.shippingDiscountPercent + "% Ship" }}
                </span>
              </template>
            </td>

            <td>{{ formatDate(v.expirationDate) }}</td>

            <td>{{ formatPrice(v.minimumOrderValue) }}</td>

            <td>{{ v.currentUsageCount }}/{{ v.maxUsageCount }}</td>

            <td>
              <span :class="statusClass(v)">
                {{ statusLabel(v) }}
              </span>
            </td>

            <td>
              <button class="btn btn-sm btn-warning me-2" @click="openForm(v)">Sửa</button>
              <button class="btn btn-sm btn-danger" @click="deleteVoucher(v.id)">Xóa</button>
            </td>
          </tr>

          <tr v-if="pagedVouchers.length === 0">
            <td colspan="9" class="text-center text-muted py-3">Không có voucher phù hợp.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Phân trang -->
    <nav v-if="totalPages > 1" class="mt-3 d-flex justify-content-center">
      <ul class="pagination shadow-sm">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link" @click="changePage(currentPage - 1)">Trước</button>
        </li>

        <li
          class="page-item"
          v-for="page in totalPages"
          :key="page"
          :class="{ active: currentPage === page }"
        >
          <button class="page-link" @click="changePage(page)">
            {{ page }}
          </button>
        </li>

        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button class="page-link" @click="changePage(currentPage + 1)">Sau</button>
        </li>
      </ul>
    </nav>

    <!-- 🧩 Modal -->
    <div class="modal fade" id="voucherModal" tabindex="-1" ref="modalRef">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title">{{ form.id ? "Cập nhật Voucher" : "Thêm Voucher" }}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>

          <form @submit.prevent="saveVoucher">
            <div class="modal-body">
              <div class="row g-3">

                <!-- Mã -->
                <div class="col-md-6">
                  <label class="form-label">Mã Voucher</label>
                  <input v-model="form.code" class="form-control" required maxlength="50" />
                </div>

                <!-- Type -->
                <div class="col-md-6">
                  <label class="form-label">Loại Voucher</label>
                  <select v-model="form.type" class="form-select">
                    <option value="Fixed">Giảm cố định</option>
                    <option value="Percent">Giảm %</option>
                    <option value="Shipping">Miễn/giảm Ship</option>
                  </select>
                </div>

                <!-- Value -->
                <div class="col-md-6" v-if="form.type === 'Fixed'">
                  <label class="form-label">Số tiền giảm (₫)</label>
                  <input type="number" class="form-control" v-model.number="form.discountValue" />
                </div>

                <div class="col-md-6" v-if="form.type === 'Percent'">
                  <label class="form-label">% giảm</label>
                  <input type="number" class="form-control" v-model.number="form.discountPercent" />
                </div>

                <div class="col-md-6" v-if="form.type === 'Percent'">
                  <label class="form-label">Giảm tối đa</label>
                  <input type="number" class="form-control" v-model.number="form.maximumDiscount" />
                </div>

                <!-- Shipping Percent -->
                <div class="col-md-6" v-if="form.type === 'Shipping'">
                  <label class="form-label">% giảm phí ship</label>
                  <input type="number" class="form-control" v-model.number="form.shippingDiscountPercent" placeholder="Để trống = Free Ship 100%" />
                </div>

                <!-- Min order -->
                <div class="col-md-6">
                  <label class="form-label">Đơn tối thiểu (₫)</label>
                  <input type="number" class="form-control" v-model.number="form.minimumOrderValue" />
                </div>

                <!-- Expiration -->
                <div class="col-md-6">
                  <label class="form-label">Ngày hết hạn</label>
                  <input type="date" class="form-control" v-model="form.expirationDate" />
                </div>

                <!-- Apply To Shipping -->
                <div class="col-md-6">
                  <label class="form-label">Áp dụng cho ship?</label>
                  <select class="form-select" v-model="form.applyToShipping">
                    <option :value="true">Có</option>
                    <option :value="false">Không</option>
                  </select>
                </div>

                <!-- Usage -->
                <div class="col-md-6">
                  <label class="form-label">Lượt sử dụng tối đa</label>
                  <input type="number" class="form-control" v-model.number="form.maxUsageCount" />
                </div>

                <!-- Status -->
                <div class="col-md-6">
                  <label class="form-label">Kích hoạt</label>
                  <select class="form-select" v-model="form.isValid">
                    <option :value="true">Có</option>
                    <option :value="false">Không</option>
                  </select>
                </div>

              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
              <button class="btn btn-success" type="submit">Lưu</button>
            </div>

          </form>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { Modal } from "bootstrap";
import VoucherService from "@/services/VoucherService";

/* =======================================
   STATE
======================================= */
const vouchers = ref([]);
const search = ref("");
const statusFilter = ref("");
const currentPage = ref(1);
const totalPages = ref(1);
const pageSize = 10;

const modalRef = ref(null);
let modalInstance = null;

const form = reactive({
  id: null,
  code: "",
  type: "Fixed",
  discountValue: null,
  discountPercent: null,
  maximumDiscount: null,
  shippingDiscountPercent: null,
  minimumOrderValue: 0,
  expirationDate: "",
  applyToShipping: false,
  maxUsageCount: 1,
  currentUsageCount: 0,
  isValid: true,
});

/* =======================================
   HELPERS
======================================= */
function typeLabel(t) {
  if (t === "Fixed") return "Giảm cố định";
  if (t === "Percent") return "Giảm theo %";
  return "Giảm/Miễn ship";
}

function formatPrice(v) {
  return (v || 0).toLocaleString("vi-VN") + " ₫";
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("vi-VN");
}

function statusLabel(v) {
  const now = new Date();
  if (!v.isValid) return "Vô hiệu";
  if (new Date(v.expirationDate) < now) return "Hết hạn";
  if (v.currentUsageCount >= v.maxUsageCount) return "Hết lượt";
  return "Còn hiệu lực";
}

function statusClass(v) {
  if (!v.isValid || new Date(v.expirationDate) < new Date())
    return "badge bg-danger";
  return "badge bg-success";
}

/* =======================================
   FILTER + PAGINATION
======================================= */
const filteredVouchers = computed(() => {
  let list = vouchers.value;

  if (search.value.trim()) {
    list = list.filter(v =>
      v.code.toLowerCase().includes(search.value.toLowerCase())
    );
  }

  const now = new Date();

  if (statusFilter.value === "Valid") {
    list = list.filter(
      v =>
        v.isValid &&
        new Date(v.expirationDate) >= now &&
        v.currentUsageCount < v.maxUsageCount
    );
  }

  if (statusFilter.value === "Expired") {
    list = list.filter(v => new Date(v.expirationDate) < now);
  }

  if (statusFilter.value === "Invalid") {
    list = list.filter(v => !v.isValid);
  }

  return list;
});

const pagedVouchers = computed(() => {
  totalPages.value = Math.ceil(filteredVouchers.value.length / pageSize);
  const start = (currentPage.value - 1) * pageSize;
  return filteredVouchers.value.slice(start, start + pageSize);
});

function changePage(p) {
  if (p < 1 || p > totalPages.value) return;
  currentPage.value = p;
}

function applyFilters() {
  currentPage.value = 1;
}

/* =======================================
   API
======================================= */
async function loadVouchers() {
  try {
    vouchers.value = await VoucherService.getAll();
  } catch (err) {
    console.error("Load vouchers failed", err);
  }
}

/* =======================================
   FORM
======================================= */
function openForm(v = null) {
  if (v) {
    Object.assign(form, {
      id: v.id,
      code: v.code,
      type: v.type,
      discountValue: v.discountValue,
      discountPercent: v.discountPercent,
      maximumDiscount: v.maximumDiscount,
      shippingDiscountPercent: v.shippingDiscountPercent,
      minimumOrderValue: v.minimumOrderValue,
      expirationDate: v.expirationDate.split("T")[0],
      applyToShipping: v.applyToShipping,
      maxUsageCount: v.maxUsageCount,
      currentUsageCount: v.currentUsageCount,
      isValid: v.isValid,
    });
  } else {
    Object.assign(form, {
      id: null,
      code: "",
      type: "Fixed",
      discountValue: null,
      discountPercent: null,
      maximumDiscount: null,
      shippingDiscountPercent: null,
      minimumOrderValue: 0,
      expirationDate: "",
      applyToShipping: false,
      maxUsageCount: 1,
      currentUsageCount: 0,
      isValid: true,
    });
  }

  if (!modalInstance) modalInstance = new Modal(modalRef.value);
  modalInstance.show();
}

async function saveVoucher() {
  try {
    const dto =
      form.id === null
        ? {
            // CREATE DTO
            code: form.code,
            type: form.type,
            discountValue: form.type === "Fixed" ? form.discountValue : null,
            discountPercent: form.type === "Percent" ? form.discountPercent : null,
            shippingDiscountPercent:
              form.type === "Shipping" ? form.shippingDiscountPercent : null,
            maximumDiscount: form.maximumDiscount,
            minimumOrderValue: form.minimumOrderValue,
            expirationDate: new Date(form.expirationDate),
            maxUsageCount: form.maxUsageCount,
          }
        : {
            // UPDATE DTO
            code: form.code,
            type: form.type,
            discountValue: form.type === "Fixed" ? form.discountValue : null,
            discountPercent: form.type === "Percent" ? form.discountPercent : null,
            shippingDiscountPercent:
              form.type === "Shipping" ? form.shippingDiscountPercent : null,
            maximumDiscount: form.maximumDiscount,
            minimumOrderValue: form.minimumOrderValue,
            expirationDate: new Date(form.expirationDate),
            maxUsageCount: form.maxUsageCount,
            isValid: form.isValid,
          };

    if (form.id) {
      await VoucherService.update(form.id, dto);
    } else {
      await VoucherService.create(dto);
    }

    modalInstance.hide();
    await loadVouchers();
  } catch (e) {
    alert("Không thể lưu voucher.");
    console.error(e);
  }
}

async function deleteVoucher(id) {
  if (!confirm("Bạn chắc chắn muốn xóa voucher này?")) return;
  await VoucherService.delete(id);
  await loadVouchers();
}

onMounted(loadVouchers);
</script>

<style scoped>
.voucher-admin-container {
  padding: 2rem;
  background: #f8fafc;
  border-radius: 1rem;
  color: #1f2937;
}

.btn-gradient {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  color: white;
  border: none;
  transition: 0.25s;
}

.btn-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
}

.table-hover tbody tr:hover {
  background: rgba(0, 0, 0, 0.03);
}
</style>
