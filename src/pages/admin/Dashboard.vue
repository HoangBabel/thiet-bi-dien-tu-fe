<template>
  <div>
    <h2 class="mb-4">📊 Bảng điều khiển</h2>

    <!-- Summary Cards -->
    <div class="row mb-4">
      <div class="col-md-3" v-for="(item, i) in summary" :key="i">
        <div class="card text-white mb-3" :class="item.bg">
          <div class="card-body">
            <h5 class="card-title">{{ item.title }}</h5>
            <h3>{{ item.value.toLocaleString() }}</h3>
            <p class="card-text"><small>{{ item.note }}</small></p>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="row">
      <div class="col-md-8 mb-4">
        <div class="card">
          <div class="card-header fw-bold">Doanh thu theo tháng</div>
          <div class="card-body">
            <canvas id="revenueChart"></canvas>
          </div>
        </div>
      </div>

      <div class="col-md-4 mb-4">
        <div class="card">
          <div class="card-header fw-bold">Tỷ lệ trạng thái đơn</div>
          <div class="card-body">
            <canvas id="orderPie"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* =============================
    IMPORT
============================= */
import { onMounted, reactive, ref } from "vue"
import { Chart, registerables } from "chart.js"
import orderService from "@/services/orderService"
import rentalService from "@/services/dailyRentalService"
import userService from "@/services/userService"
import api from "@/services/api"

Chart.register(...registerables)

/* =============================
    SUMMARY CARDS
============================= */
const summary = reactive([
  { title: "Tổng doanh thu", value: 0, bg: "bg-primary", note: "" },
  { title: "Tổng đơn", value: 0, bg: "bg-success", note: "" },
  { title: "Khách hàng", value: 0, bg: "bg-warning", note: "" },
  { title: "Sản phẩm đang bán", value: 0, bg: "bg-danger", note: "" }
])

const chartLabels = ref([])
const chartRevenue = ref([])
const orderPieData = ref([])

/* =============================
    NORMALIZE STATUS (Order + Rental)
============================= */
function normalizeStatus(s) {
  if (!s) return "Unknown"
  const val = typeof s === "string" ? s.toLowerCase() : s

  if (val === 0 || val === "pending") return "pending"
  if (val === 1 || val === "processing" || val === "active") return "processing"
  if (val === 2 || val === "completed") return "completed"
  if (val === 3 || val === "cancelled") return "cancelled"

  return "unknown"
}

/* =============================
    LOAD DASHBOARD DATA
============================= */
async function loadDashboardData() {

  /* === USERS === */
  const userRes = await userService.getAll()
  summary[2].value = userRes.data.length

  /* === PRODUCTS === */
  const productRes = await api.get("/Product")
  summary[3].value = productRes.data.length

  /* === ORDERS === */
  const orders = await orderService.getAllOrders()

  /* === RENTALS === */
  const rentals = await rentalService.getAllRentals()

  /* ==== TỔNG DOANH THU ==== */
  const totalRevenueOrder = orders.reduce((t, o) => t + (o.totalAmount || 0), 0)
  const totalRevenueRental = rentals.reduce((t, r) => t + ((r.totalPrice || 0) + (r.depositPaid || 0)), 0)
  const totalRevenue = totalRevenueOrder + totalRevenueRental
  summary[0].value = totalRevenue

  /* === TỔNG ĐƠN === */
  summary[1].value = orders.length + rentals.length

  /* ==== PIE CHART: MERGE TRẠNG THÁI ORDER + RENTAL ==== */
  const statusCount = { pending: 0, processing: 0, completed: 0, cancelled: 0 }

  orders.forEach(o => statusCount[normalizeStatus(o.status)]++)
  rentals.forEach(r => statusCount[normalizeStatus(r.status)]++)

  orderPieData.value = [
    statusCount.completed,
    statusCount.processing,
    statusCount.pending,
    statusCount.cancelled
  ]

  /* ==== REVENUE BY MONTH ==== */
  const months = Array(12).fill(0)

  orders.forEach(o => {
    const m = new Date(o.createdDate).getMonth()
    months[m] += o.totalAmount || 0
  })

  rentals.forEach(r => {
    const m = new Date(r.startDate).getMonth()
    months[m] += (r.totalPrice || 0) + (r.depositPaid || 0)
  })

  chartLabels.value = ["1","2","3","4","5","6","7","8","9","10","11","12"]
  chartRevenue.value = months
}

/* =============================
    DRAW CHARTS
============================= */
function drawRevenueChart() {
  new Chart(document.getElementById("revenueChart"), {
    type: "bar",
    data: {
      labels: chartLabels.value,
      datasets: [
        {
          label: "Doanh thu (VNĐ)",
          data: chartRevenue.value,
          backgroundColor: "rgba(54, 162, 235, 0.6)",
        }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  })
}

function drawOrderPie() {
  new Chart(document.getElementById("orderPie"), {
    type: "pie",
    data: {
      labels: ["Hoàn tất", "Đang xử lý", "Chờ xử lý", "Đã hủy"],
      datasets: [
        {
          data: orderPieData.value,
          backgroundColor: ["#198754", "#0d6efd", "#ffc107", "#dc3545"],
        }
      ]
    },
    options: { responsive: true }
  })
}

/* =============================
    ON MOUNT
============================= */
onMounted(async () => {
  await loadDashboardData()
  drawRevenueChart()
  drawOrderPie()
})
</script>

<style scoped>
.card {
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.1);
  border: none;
}
.card-header {
  background-color: #f8f9fa;
}
</style>
