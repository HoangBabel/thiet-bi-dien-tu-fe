<template>
  <div class="cart-page container py-5">
    <h2 class="text-center mb-5 fw-bold text-dark">
      🛒 Giỏ thuê của bạn
    </h2>

    <!-- Loading -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary"></div>
      <p class="text-muted mt-3">Đang tải giỏ thuê...</p>
    </div>

    <!-- Giỏ thuê trống -->
    <div
      v-else-if="!rentals.length"
      class="empty-cart text-center p-5 rounded-4 shadow-sm bg-gradient"
    >
      <i class="bi bi-cart-x display-4 text-secondary"></i>
      <p class="mt-3 fs-5 text-muted">Chưa có đơn thuê nào trong giỏ.</p>
      <router-link to="/products" class="btn btn-primary mt-3 shadow-sm">
        <i class="bi bi-shop me-1"></i> Quay lại cửa hàng
      </router-link>
    </div>

    <!-- Danh sách đơn thuê -->
    <div v-else>
      <div
        v-for="rental in rentals"
        :key="rental.id"
        class="cart-card card border-0 shadow-sm rounded-4 p-4 mb-4"
      >
        <!-- Table -->
        <div class="table-responsive mb-3" v-if="rental.items?.length">
          <h5 class="fw-semibold text-dark mb-1">
                🧾 Đơn thuê #{{ rental.id }}
              </h5>
          <table class="table align-middle text-center mb-0">
            <thead class="table-header text-secondary">
              <tr>
                <th class="text-start ps-3">Sản phẩm</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Số lượng</th>
                <th>Số ngày</th>
                <th>Đơn giá</th>
                <th>Tổng tiền</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="item in rental.items" :key="item.id">
                <td class="text-start">
                  {{ item.productName || `Mã ${item.productId}` }}
                </td>
                <td>{{ formatDate(rental.startDate) }}</td>
                <td>{{ formatDate(rental.endDate) }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ computeRentalDays(rental) }}</td>
                <td>{{ formatCurrency(item.pricePerUnitAtBooking) }}</td>
                <td>{{ formatCurrency(item.subTotal) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary -->
        <div
          class="cart-summary d-flex flex-column flex-md-row justify-content-between align-items-center mt-4 px-3"
        >
          <div class="text-start mb-3 mb-md-0">
            <p class="mb-1 fw-semibold">
              Tổng tiền:
              <span class="text-danger">{{
                formatCurrency(rental.totalPrice)
              }}</span>
            </p>
            <p v-if="rental.depositPaid" class="mb-0 fw-semibold">
              Cọc đã thanh toán:
              <span class="text-warning">{{
                formatCurrency(rental.depositPaid)
              }}</span>
            </p>
          </div>

          <!-- Buttons -->
          <div class="d-flex flex-wrap gap-2 justify-content-md-end mt-2">
            <button
              class="btn btn-outline-danger px-4"
              @click="deleteRental(rental.id)"
            >
              <i class="bi bi-trash3 me-1"></i> Xóa đơn
            </button>

            <button
              class="btn btn-outline-primary px-4 shadow-sm"
              @click="openEditRentalModal(rental)"
            >
              <i class="bi bi-pencil-square me-1"></i> Chỉnh sửa ngày thuê
            </button>

            <button
              class="btn btn-success px-4 shadow-sm"
              @click="proceedToCheckout(rental)"
            >
              <i class="bi bi-cash-stack me-1"></i> Thanh toán đơn
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal chỉnh sửa ngày thuê -->
    <div
      class="modal fade"
      tabindex="-1"
      :class="{ show: showEditModal }"
      style="display: block;"
      v-if="showEditModal"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">✏️ Chỉnh sửa ngày thuê</h5>
            <button type="button" class="btn-close" @click="closeEditModal"></button>
          </div>

          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-semibold">Ngày bắt đầu</label>
                <input type="date" v-model="editStartDate" class="form-control" />
              </div>

              <div class="col-md-6">
                <label class="form-label fw-semibold">Ngày kết thúc</label>
                <input type="date" v-model="editEndDate" class="form-control" />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeEditModal">
              Hủy
            </button>
            <button class="btn btn-primary" @click="saveEditDates">
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showEditModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import rentalService from "@/services/dailyRentalService"

const rentals = ref([])
const loading = ref(true)
const router = useRouter()

const editingRental = ref(null)
const editStartDate = ref("")
const editEndDate = ref("")
const showEditModal = ref(false)

/* FORMATTERS */
function formatDate(d) {
  return d ? new Date(d).toLocaleDateString("vi-VN") : "Không xác định"
}

function formatCurrency(value) {
  return (
    value?.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) ||
    "0₫"
  )
}

function formatDateForInput(dateStr) {
  if (!dateStr) return ""
  return new Date(dateStr).toISOString().split("T")[0]
}

/* TÍNH SỐ NGÀY */
function computeRentalDays(rental) {
  const start = new Date(rental.startDate)
  const end = new Date(rental.endDate)
  const diff = Math.ceil((end - start) / 86400000)
  return diff > 0 ? diff : 1
}

/* LOAD RENTALS */
async function loadRentals() {
  loading.value = true
  try {
    const data = await rentalService.getMyRentals()
    rentals.value = (data || []).filter(r => r.paymentStatus === "UNPAID")
  } finally {
    loading.value = false
  }
}

/* OPEN / CLOSE MODAL */
function openEditRentalModal(rental) {
  editingRental.value = rental
  editStartDate.value = formatDateForInput(rental.startDate)
  editEndDate.value = formatDateForInput(rental.endDate)
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingRental.value = null
}

/* SAVE EDIT DATES */
async function saveEditDates() {
  if (!editingRental.value) return

  try {
    await rentalService.updateRentalDates(
      editingRental.value.id,
      editStartDate.value,
      editEndDate.value
    )
    alert("Đã cập nhật ngày thuê.")
    await loadRentals()
    closeEditModal()
  } catch (err) {
    alert("Lỗi cập nhật: " + (err.response?.data?.message || err.message))
  }
}

/* DELETE RENTAL */
async function deleteRental(rentalId) {
  if (!confirm("Bạn có chắc muốn xóa đơn thuê này?")) return

  try {
    await rentalService.deleteRental(rentalId)
    alert("Đã xóa đơn thuê.")
    await loadRentals()
  } catch (err) {
    alert("Lỗi khi xóa: " + (err.response?.data?.message || err.message))
  }
}

/* CHECKOUT */
function proceedToCheckout(rental) {
  router.push({ path: "/rentalCheckout", query: { rentalId: rental.id } })
}

onMounted(loadRentals)
</script>

<style scoped>
.cart-page {
  max-width: 1100px;
}
.table {
  border-collapse: separate;
  border-spacing: 0 8px;
}
.table-header {
  background-color: #f8f9fb;
  font-weight: 600;
}
.table tbody tr {
  background: #fff;
  transition: 0.25s;
  border-radius: 12px;
}
.table tbody tr:hover {
  background-color: #f2f7ff;
  transform: translateY(-2px);
}
.empty-cart {
  background: linear-gradient(145deg, #ffffff, #f4f6f8);
  border: 1px solid #e6e9ee;
}
.btn {
  border-radius: 0.6rem;
  transition: all 0.2s ease;
}
.btn:hover {
  transform: translateY(-1px);
}
.btn-success:hover {
  background-color: #157347;
}
.btn-outline-primary:hover {
  background-color: #0d6efd;
  color: #fff;
}
.cart-summary {
  border-top: 1px solid #dee2e6;
  padding-top: 1.2rem;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: #000;
  opacity: 0.5;
  z-index: 1040;
}
.modal.show {
  display: block;
  z-index: 1050;
}
</style>
