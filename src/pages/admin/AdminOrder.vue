<template>
  <div class="order-admin-container">
    <h2 class="mb-3 fw-bold text-dark">📊 Quản lý đơn hàng</h2>

    <!-- Bộ lọc và tìm kiếm -->
    <div class="d-flex flex-wrap align-items-center mb-4 gap-2">
      <div class="input-group" style="max-width: 400px;">
        <input
          type="text"
          v-model="search"
          class="form-control"
          placeholder="Tìm theo tên khách hàng hoặc email..."
          @keyup.enter="applyFilters"
        />
        <button class="btn btn-gradient" @click="applyFilters">Tìm</button>
      </div>

      <div class="ms-auto">
        <select v-model="statusFilter" class="form-select shadow-sm" style="width: 200px;" @change="applyFilters">
          <option value="">Tất cả trạng thái</option>
          <option v-for="s in orderStatuses" :key="s.value" :value="s.value">
            {{ s.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Bảng đơn hàng -->
    <div class="table-responsive shadow-sm rounded-3">
      <table class="table table-hover align-middle">
        <thead class="table-dark">
          <tr>
            <th>#</th>
            <th>Order ID</th>
            <th>Khách hàng</th>
            <th>Ngày đặt</th>
            <th>Tổng tiền</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(o, i) in pagedOrders" :key="o.id">
            <td>{{ (currentPage - 1) * pageSize + i + 1 }}</td>
            <td>{{ o.id }}</td>
            <td>{{ o.user?.fullName || o.user?.email || "Không xác định" }}</td>
            <td>{{ formatDate(o.orderDate) }}</td>
            <td>{{ formatPrice(o.totalAmount) }}</td>
            <td>
              <span :class="statusClass(o.status)">
                {{ statusLabel(o.status) }}
              </span>
            </td>
            <td>
              <button class="btn btn-sm btn-warning me-2" @click="openStatusModal(o)">Cập nhật trạng thái</button>
              <button class="btn btn-sm btn-info" @click="viewOrder(o.id)">Xem chi tiết</button>
            </td>
          </tr>
          <tr v-if="pagedOrders.length === 0">
            <td colspan="7" class="text-center text-muted py-3">Không tìm thấy đơn hàng phù hợp.</td>
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
            <h5 class="modal-title">Cập nhật trạng thái đơn hàng</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <form @submit.prevent="saveStatus">
            <div class="modal-body">
              <p>Order ID: {{ selectedOrder?.id }}</p>
              <div class="mb-3">
                <label class="form-label">Trạng thái mới</label>
                <select v-model="selectedStatus" class="form-select" required>
                  <option v-for="s in orderStatuses" :key="s.value" :value="s.value">
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
import orderService, { mapOrderStatus } from "@/services/orderService";

const orders = ref([]);
const search = ref("");
const statusFilter = ref("");
const currentPage = ref(1);
const pageSize = 10;
const totalPages = ref(1);

const statusModalRef = ref(null);
let statusModalInstance = null;
const selectedOrder = ref(null);
const selectedStatus = ref("");

// Danh sách trạng thái
const orderStatuses = [
  { value: "Pending", label: "Đang chờ xử lý" },
  { value: "Processing", label: "Đang xử lý" },
  { value: "Completed", label: "Hoàn tất" },
  { value: "Cancelled", label: "Đã hủy" }
];

// ======= API =======
async function loadOrders() {
  try {
    const res = await orderService.getAllOrders();
    orders.value = res;
    applyFilters();
  } catch (err) {
    console.error("❌ Lỗi khi load đơn hàng:", err);
  }
}

// ======= Helpers =======
function statusLabel(s) {
  const item = orderStatuses.find(x => x.value === s);
  return item ? item.label : s;
}

function statusClass(s) {
  switch (s) {
    case "Pending": return "badge bg-warning text-dark";
    case "Processing": return "badge bg-primary";
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

// ======= Filter & Pagination =======
const filteredOrders = computed(() => {
  let list = orders.value;
  if (search.value) {
    const kw = search.value.toLowerCase();
    list = list.filter(o =>
      (o.user?.fullName || "").toLowerCase().includes(kw) ||
      (o.user?.email || "").toLowerCase().includes(kw)
    );
  }
  if (statusFilter.value) {
    list = list.filter(o => o.status === statusFilter.value);
  }
  return list;
});

const pagedOrders = computed(() => {
  totalPages.value = Math.ceil(filteredOrders.value.length / pageSize);
  const start = (currentPage.value - 1) * pageSize;
  return filteredOrders.value.slice(start, start + pageSize);
});

function changePage(page) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

function applyFilters() {
  currentPage.value = 1;
}

// ======= Modal =======
function openStatusModal(order) {
  selectedOrder.value = order;
  selectedStatus.value = order.status;
  if (!statusModalInstance) statusModalInstance = new Modal(statusModalRef.value);
  statusModalInstance.show();
}

async function saveStatus() {
  try {
    await orderService.updateOrderStatus(selectedOrder.value.id, selectedStatus.value);
    selectedOrder.value.status = selectedStatus.value;
    statusModalInstance.hide();
    alert("Cập nhật trạng thái thành công!");
  } catch (err) {
    console.error("❌ Lỗi cập nhật trạng thái:", err);
    alert("Cập nhật thất bại!");
  }
}

function viewOrder(id) {
  window.open(`/admin/order/${id}`, "_blank");
}

// ======= Lifecycle =======
onMounted(() => {
  loadOrders();
});
</script>

<style scoped>
.order-admin-container {
  padding: 2rem;
  background: #f8fafc;
  border-radius: 1rem;
  color: #1f2937;
}

/* Nút gradient */
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

/* Badge trạng thái */
.badge {
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
}

/* Table */
.table {
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
}
.table-hover tbody tr:hover {
  background-color: rgba(37, 99, 235, 0.05);
}

/* Modal */
.modal-content {
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 0 12px rgba(0,0,0,0.25);
}
</style>
