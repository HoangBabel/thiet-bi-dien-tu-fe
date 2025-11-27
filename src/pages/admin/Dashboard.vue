<template>
  <div>
    <h2 class="mb-4"> Bảng điều khiển</h2>

    <!-- Cards -->
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
          <div class="card-header fw-bold">Tỷ lệ đơn hàng</div>
          <div class="card-body">
            <canvas id="orderPie"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive } from "vue"
import { Chart, registerables } from "chart.js"
Chart.register(...registerables)

// Mock data (giả lập)
const summary = reactive([
  { title: "Doanh thu tháng này", value: 12000000, bg: "bg-primary", note: "+12% so với tháng trước" },
  { title: "Đơn hàng mới", value: 235, bg: "bg-success", note: "+8% tăng trưởng" },
  { title: "Khách hàng mới", value: 57, bg: "bg-warning", note: "Ổn định so với tháng trước" },
  { title: "Sản phẩm đang bán", value: 48, bg: "bg-danger", note: "2 sản phẩm sắp hết hàng" }
])

onMounted(() => {
  drawRevenueChart()
  drawOrderPie()
})

function drawRevenueChart() {
  const ctx = document.getElementById("revenueChart")
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6"],
      datasets: [
        {
          label: "Doanh thu (VNĐ)",
          data: [10, 20, 15, 30, 25, 40],
          backgroundColor: "rgba(54, 162, 235, 0.6)",
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => v + "tr" } },
      },
    },
  })
}

function drawOrderPie() {
  const ctx = document.getElementById("orderPie")
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Hoàn tất", "Đang giao", "Hủy"],
      datasets: [
        {
          data: [65, 25, 10],
          backgroundColor: ["#198754", "#ffc107", "#dc3545"],
        },
      ],
    },
    options: {
      responsive: true,
    },
  })
}
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
