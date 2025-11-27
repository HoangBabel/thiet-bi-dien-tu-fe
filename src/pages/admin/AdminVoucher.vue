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
            <th>Mã Voucher</th>
            <th>Loại</th>
            <th>Giá trị</th>
            <th>Hạn sử dụng</th>
            <th>Đơn tối thiểu</th>
            <th>Số lượt dùng</th>
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
              <span v-if="v.type === 'Percent'">{{ v.discountPercent }}%</span>
              <span v-else-if="v.type === 'Fixed'">{{ formatPrice(v.discountValue) }}</span>
              <span v-else>Miễn phí ship</span>
            </td>
            <td>{{ formatDate(v.expirationDate) }}</td>
            <td>{{ formatPrice(v.minimumOrderValue) }}</td>
            <td>{{ v.currentUsageCount }}/{{ v.maxUsageCount }}</td>
            <td>
              <span :class="statusClass(v)">{{ statusLabel(v) }}</span>
            </td>
            <td>
              <button class="btn btn-sm btn-warning me-2" @click="openForm(v)">Sửa</button>
              <button class="btn btn-sm btn-danger" @click="deleteVoucher(v.id)">Xóa</button>
            </td>
          </tr>
          <tr v-if="pagedVouchers.length === 0">
            <td colspan="9" class="text-center text-muted py-3">Không tìm thấy voucher phù hợp.</td>
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
          <button class="page-link" @click="changePage(page)">{{ page }}</button>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button class="page-link" @click="changePage(currentPage + 1)">Sau</button>
        </li>
      </ul>
    </nav>

    <!-- 🧩 Modal thêm/sửa voucher -->
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
                <div class="col-md-6">
                  <label class="form-label">Mã Voucher</label>
                  <input v-model="form.code" class="form-control" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Loại</label>
                  <select v-model="form.type" class="form-select" required>
                    <option value="Fixed">Cố định</option>
                    <option value="Percent">Phần trăm</option>
                    <option value="Shipping">Miễn phí vận chuyển</option>
                  </select>
                </div>

                <div class="col-md-6" v-if="form.type === 'Fixed'">
                  <label class="form-label">Giá trị giảm (₫)</label>
                  <input type="number" v-model.number="form.discountValue" class="form-control" />
                </div>
                <div class="col-md-6" v-if="form.type === 'Percent'">
                  <label class="form-label">% giảm</label>
                  <input type="number" v-model.number="form.discountPercent" class="form-control" />
                </div>

                <div class="col-md-6">
                  <label class="form-label">Giảm tối đa (₫)</label>
                  <input type="number" v-model.number="form.maximumDiscount" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Đơn hàng tối thiểu (₫)</label>
                  <input type="number" v-model.number="form.minimumOrderValue" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Số lượt sử dụng tối đa</label>
                  <input type="number" v-model.number="form.maxUsageCount" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Ngày hết hạn</label>
                  <input type="date" v-model="form.expirationDate" class="form-control" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Áp dụng cho phí ship?</label>
                  <select v-model="form.applyToShipping" class="form-select">
                    <option :value="true">Có</option>
                    <option :value="false">Không</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Kích hoạt</label>
                  <select v-model="form.isValid" class="form-select">
                    <option :value="true">Có</option>
                    <option :value="false">Không</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
              <button type="submit" class="btn btn-success">Lưu</button>
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
import api from "@/services/api";

const vouchers = ref([]);
const search = ref("");
const statusFilter = ref("");
const currentPage = ref(1);
const pageSize = 10;
const totalPages = ref(1);

const modalRef = ref(null);
let modalInstance = null;

const form = reactive({
  id: null,
  code: "",
  type: "Fixed",
  discountValue: 0,
  discountPercent: 0,
  maximumDiscount: 0,
  minimumOrderValue: 0,
  expirationDate: "",
  applyToShipping: false,
  isValid: true,
  maxUsageCount: 1,
  currentUsageCount: 0,
});

// ====== Helpers ======
function typeLabel(t) {
  if (t === "Fixed") return "Giảm cố định";
  if (t === "Percent") return "Giảm theo %";
  return "Miễn phí ship";
}
function formatPrice(v) {
  return v ? v.toLocaleString("vi-VN") + " ₫" : "0 ₫";
}
function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("vi-VN");
}
function statusLabel(v) {
  if (!v.isValid) return "Vô hiệu";
  if (new Date(v.expirationDate) < new Date()) return "Hết hạn";
  return "Còn hiệu lực";
}
function statusClass(v) {
  if (!v.isValid || new Date(v.expirationDate) < new Date())
    return "badge bg-danger";
  return "badge bg-success";
}

// ====== Filter + Pagination ======
const filteredVouchers = computed(() => {
  let list = vouchers.value;
  if (search.value) {
    list = list.filter(v => v.code?.toLowerCase().includes(search.value.toLowerCase()));
  }
  if (statusFilter.value) {
    const now = new Date();
    list = list.filter(v => {
      if (statusFilter.value === "Valid") return v.isValid && new Date(v.expirationDate) >= now;
      if (statusFilter.value === "Expired") return new Date(v.expirationDate) < now;
      if (statusFilter.value === "Invalid") return !v.isValid;
      return true;
    });
  }
  return list;
});

const pagedVouchers = computed(() => {
  totalPages.value = Math.ceil(filteredVouchers.value.length / pageSize);
  const start = (currentPage.value - 1) * pageSize;
  return filteredVouchers.value.slice(start, start + pageSize);
});

function changePage(page) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

function applyFilters() {
  currentPage.value = 1;
}

// ====== API ======
async function loadVouchers() {
  const res = await api.get("/voucher");
  vouchers.value = res.data;
}

// ====== Form ======
function openForm(v = null) {
  if (v) {
    Object.assign(form, {
      id: v.id,
      code: v.code,
      type: v.type,
      discountValue: v.discountValue,
      discountPercent: v.discountPercent,
      maximumDiscount: v.maximumDiscount,
      minimumOrderValue: v.minimumOrderValue,
      expirationDate: v.expirationDate?.split("T")[0],
      applyToShipping: v.applyToShipping,
      isValid: v.isValid,
      maxUsageCount: v.maxUsageCount,
      currentUsageCount: v.currentUsageCount
    });
  } else {
    Object.assign(form, {
      id: null,
      code: "",
      type: "Fixed",
      discountValue: 0,
      discountPercent: 0,
      maximumDiscount: 0,
      minimumOrderValue: 0,
      expirationDate: "",
      applyToShipping: false,
      isValid: true,
      maxUsageCount: 1,
      currentUsageCount: 0
    });
  }
  if (!modalInstance) modalInstance = new Modal(modalRef.value);
  modalInstance.show();
}

async function saveVoucher() {
  try {
    const data = {
      Id: form.id || 0,
      Code: form.code.trim(),
      Type: form.type,
      DiscountValue: form.discountValue || null,
      DiscountPercent: form.discountPercent || null,
      MaximumDiscount: form.maximumDiscount || null,
      MinimumOrderValue: form.minimumOrderValue || 0,
      ApplyToShipping: form.applyToShipping,
      ExpirationDate: new Date(form.expirationDate).toISOString(),
      IsValid: form.isValid,
      MaxUsageCount: form.maxUsageCount || 1,
      CurrentUsageCount: form.currentUsageCount || 0
    };

    if (form.id) {
      await api.put(`/Voucher/${form.id}`, data);
    } else {
      await api.post("/Voucher", data);
    }

    await loadVouchers();
    modalInstance.hide();
  } catch (err) {
    console.error("❌ Lỗi lưu voucher:", err.response?.data || err);
    alert("Không thể lưu voucher. Hãy kiểm tra dữ liệu đầu vào.");
  }
}

async function deleteVoucher(id) {
  if (!confirm("Bạn có chắc muốn xóa voucher này?")) return;
  await api.delete(`/voucher/${id}`);
  await loadVouchers();
}

onMounted(() => {
  loadVouchers();
});
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
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.btn-gradient:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
}

.badge {
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
}
.table-hover tbody tr:hover {
  background-color: rgba(37, 99, 235, 0.05);
}

.modal-content {
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 0 12px rgba(0,0,0,0.25);
}
</style>
