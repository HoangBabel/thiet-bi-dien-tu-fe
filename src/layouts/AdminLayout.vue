<template>
  <div id="wrapper" class="d-flex">
    <!-- Sidebar -->
    <Sidebar :isOpen="isSidebarOpen" />

    <!-- Content -->
    <div id="content" class="flex-grow-1" :class="{ 'ms-0': !isSidebarOpen, 'ms-240': isSidebarOpen }">
      <nav class="navbar navbar-expand-lg navbar-light bg-light border-bottom">
        <div class="container-fluid d-flex justify-content-between align-items-center">
          <!-- Nút Toggle Sidebar -->
          <button class="btn btn-outline-dark" @click="toggleSidebar">☰</button>

          <!-- Nút về Trang Chủ -->
          <button class="btn btn-primary" @click="goHome">
             Trang Chủ
          </button>
        </div>
      </nav>

      <div class="container-fluid p-4">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '../components/Sidebar.vue'

const isSidebarOpen = ref(true)
const router = useRouter()

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

function goHome() {
  router.push('/')
}
</script>

<style scoped>
#wrapper {
  height: 100vh;
}
#content {
  flex-grow: 1;
  transition: margin-left 0.3s ease;
}
.ms-240 {
  margin-left: 240px; /* Khi sidebar mở */
}
.ms-0 {
  margin-left: 0; /* Khi sidebar đóng */
}
</style>
