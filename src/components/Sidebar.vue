<template>
  <div
    id="sidebar"
    :class="{ collapsed: !isOpen }"
    class="bg-dark text-white d-flex flex-column justify-content-between shadow-lg"
  >
    <!-- Top -->
    <div>
      <div class="sidebar-header text-center py-3 border-bottom">
        <h5 class="m-0 fw-bold">
          <i class="bi bi-cpu me-2 text-primary"></i> Trang Quản Trị
        </h5>
      </div>

      <ul class="nav flex-column mt-3">
        <li class="nav-item">
          <router-link to="/admin" class="nav-link text-white" active-class="active-link">
            <i class="bi bi-speedometer2 me-2"></i> Trang chủ
          </router-link>
        </li>

        <li class="nav-item">
          <router-link to="/admin/users" class="nav-link text-white" active-class="active-link">
            <i class="bi bi-people me-2"></i> Quản lý người dùng
          </router-link>
        </li>

        <li class="nav-item">
          <router-link to="/admin/products" class="nav-link text-white" active-class="active-link">
            <i class="bi bi-box-seam me-2"></i> Quản lý sản phẩm
          </router-link>
        </li>

        <li class="nav-item">
          <router-link to="/admin/vouchers" class="nav-link text-white" active-class="active-link">
            <i class="bi bi-ticket-perforated me-2"></i> Phiếu giảm giá
          </router-link>
        </li>

        <li class="nav-item">
          <router-link to="/admin/orders" class="nav-link text-white" active-class="active-link">
            <i class="bi bi-receipt-cutoff me-2"></i> Quản lý đơn mua
          </router-link>
        </li>

        <li class="nav-item">
          <router-link to="/admin/rentals" class="nav-link text-white" active-class="active-link">
            <i class="bi bi-receipt-cutoff me-2"></i> Quản lý đơn thuê
          </router-link>
        </li>
      </ul>
    </div>

    <!-- Bottom: User -->
    <div class="border-top py-3 text-center small">
      <div v-if="isLoggedIn" class="d-flex flex-column align-items-center">

        <!-- Avatar -->
        <img
          :src="resolvedAvatar"
          alt="avatar"
          class="rounded-circle shadow avatar-sidebar mb-2"
          v-if="resolvedAvatar"
        />

        <!-- User info -->
        <div class="mb-2 d-flex flex-column align-items-center">
          <span class="fw-semibold">{{ userDisplayName }}</span>

          <small class="text-secondary" style="font-size: 0.8rem;">
            <i
              :class="String(userRole).toLowerCase() === 'admin'
                ? 'bi bi-shield-lock text-warning'
                : 'bi bi-person-circle text-light'"
            ></i>
            {{ userRole }}
          </small>
        </div>

        <!-- Buttons -->
        <div class="mt-1">
          <router-link to="/profile" class="btn btn-outline-light btn-sm me-2">
            <i class="bi bi-person"></i> Hồ sơ
          </router-link>
          <button @click="logout" class="btn btn-outline-danger btn-sm">
            <i class="bi bi-box-arrow-right"></i> Đăng xuất
          </button>
        </div>
      </div>

      <div v-else>
        <router-link to="/login" class="btn btn-outline-light btn-sm me-2">
          Đăng nhập
        </router-link>
        <router-link to="/register" class="btn btn-outline-primary btn-sm">
          Đăng ký
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

defineProps({
  isOpen: { type: Boolean, default: true },
});

const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  authStore.loadFromStorage();
});

// Avatar xử lý giống Navbar
const resolvedAvatar = computed(() => {
  const avatar = authStore.user?.avatarUrl || authStore.user?.avatar;
  if (!avatar) return "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  if (avatar.startsWith("/")) return `http://localhost:5126${avatar}`;
  return avatar;
});

const isLoggedIn = computed(() => authStore.isLoggedIn);
const userDisplayName = computed(
  () => authStore.user?.fullName || authStore.user?.username || "Người dùng"
);

const userRole = computed(() => {
  const role = authStore.user?.role;
  return typeof role === "string" ? role : String(role ?? "");
});

function logout() {
  authStore.logout();
  router.push("/login");
}
</script>

<style scoped>
#sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 240px;
  min-height: 100vh;
  transition: all 0.3s ease;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 1050;
}

#sidebar.collapsed {
  width: 0;
  opacity: 0;
  pointer-events: none;
}

.nav-link {
  padding: 12px 20px;
  font-size: 15px;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.active-link {
  background-color: #0d6efd;
  border-radius: 4px;
  font-weight: 600;
}

/* Avatar */
.avatar-sidebar {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border: 2px solid #fff;
}

.border-top {
  border-color: rgba(255, 255, 255, 0.15) !important;
}

small {
  color: rgba(255, 255, 255, 0.8);
}
</style>
