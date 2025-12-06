<template>
  <div class="rental-admin-container">
    <h2 class="mb-3 fw-bold text-dark">📊 Quản lý đơn thuê</h2>

    <!-- Bộ lọc và tìm kiếm -->
    <div class="d-flex flex-wrap align-items-center mb-4 gap-2">
      <div class="input-group" style="max-width: 400px;">
        <input
          type="text"
          v-model="search"
          class="form-control"
          placeholder="Tìm theo UserId..."
          @keyup.enter="applyFilters"
        />
        <button class="btn btn-gradient" @click="applyFilters">Tìm</button>
      </div>

      <div class="ms-auto">
        <select v-model="statusFilter" class="form-select shadow-sm" style="width: 200px;" @change="applyFilters">
          <option value="">Tất cả trạng thái</option>
          <option v-for="s in rentalStatuses" :key="s.value" :value="s.value">
            {{ s.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Bảng đơn thuê -->
    <div class="table-responsive shadow-sm rounded-3">
      <table class="table table-hover align-middle">
        <thead class="table-dark">
          <tr>
            <th>#</th>
            <th>Rental ID</th>
            <th>User ID</th>
            <th>Ngày bắt đầu</th>
            <th>Tổng tiền</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in pagedRentals" :key="r.id">
            <td>{{ (currentPage - 1) * pageSize + i + 1 }}</td>
            <td>{{ r.id }}</td>
            <td>{{ r.userId }}</td>
            <td>{{ formatDate(r.startDate) }}</td>
            <td>{{ formatPrice(r.totalPrice) }}</td>
            <td>
              <span :class="statusClass(r.status)">
                {{ statusLabel(r.status) }}
              </span>
            </td>
            <td>
              <button class="btn btn-sm btn-warning me-2" @click="openStatusModal(r)">Cập nhật trạng thái</button>
              <button class="btn btn-sm btn-info" @click="viewRental(r.id)">Xem chi tiết</button>
            </td>
          </tr>
          <tr v-if="pagedRentals.length === 0">
            <td colspan="7" class="text-center text-muted py-3">Không tìm thấy đơn thuê phù hợp.</td>
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

    <!-- Modal cập nhật trạng thái -->
    <div class="modal fade" id="statusModal" tabindex="-1" ref="statusModalRef">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title">Cập nhật trạng thái đơn thuê</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <form @submit.prevent="saveStatus">
            <div class="modal-body">
              <p>Rental ID: {{ selectedRental?.id }}</p>
              <div class="mb-3">
                <label class="form-label">Trạng thái mới</label>
                <select v-model="selectedStatus" class="form-select" required>
                  <option v-for="s in rentalStatuses" :key="s.value" :value="s.value">
                    {{ s.label }}
                  </option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" type="button" data-bs-dismiss="modal">Hủy</button>
              <button class="btn btn-success" type="submit">Lưu</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Modal } from "bootstrap";
import rentalService from "@/services/rentalService";

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

const rentalStatuses = [
  { value: "Pending", label: "Đang chờ xử lý" },
  { value: "Paid", label: "Đã thanh toán" },
  { value: "Active", label: "Đang thuê" },
  { value: "Completed", label: "Hoàn tất" },
  { value: "Cancelled", label: "Đã hủy" }
];

async function loadRentals() {
  try {
    const res = await rentalService.getAllRentals();
    rentals.value = res;
    applyFilters();
  } catch (err) {
    console.error("❌ Lỗi khi load đơn thuê:", err);
  }
}

function statusLabel(s) {
  const item = rentalStatuses.find(x => x.value === s);
  return item ? item.label : s;
}

function statusClass(s) {
  switch (s) {
    case "Pending": return "badge bg-warning text-dark";
    case "Paid": return "badge bg-info text-dark";
    case "Active": return "badge bg-primary";
    case "Completed": return "badge bg-success";
    case "Cancelled": return "badge bg-secondary";
    default: return "badge bg-light";
  }
}

function formatPrice(v) {
  return v ? v.toLocaleString("vi-VN") + " ₫" : "0 ₫";
}

function formatDate(d) {
  return new Date(d).toLocaleString("vi-VN");
}

const filteredRentals = computed(() => {
  let list = rentals.value;
  if (search.value) {
    const kw = search.value.toString().toLowerCase();
    list = list.filter(r => r.userId.toString().includes(kw));
  }
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

function changePage(page) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

function applyFilters() {
  currentPage.value = 1;
}

function openStatusModal(rental) {
  selectedRental.value = rental;
  selectedStatus.value = rental.status;
  if (!statusModalInstance) statusModalInstance = new Modal(statusModalRef.value);
  statusModalInstance.show();
}

async function saveStatus() {
  try {
    // Lưu ý backend chưa có endpoint update trực tiếp status => demo chỉ cập nhật UI
    selectedRental.value.status = selectedStatus.value;
    statusModalInstance.hide();
    alert("Cập nhật trạng thái thành công (UI)!");
  } catch (err) {
    console.error("❌ Lỗi cập nhật trạng thái:", err);
    alert("Cập nhật thất bại!");
  }
}

function viewRental(id) {
  window.open(`/admin/rental/${id}`, "_blank");
}

onMounted(() => {
  loadRentals();
});
</script>

<style scoped>
.rental-admin-container {
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

.table {
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
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
