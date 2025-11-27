<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm fixed-top">
    <div class="container-fluid">
      <!-- Brand -->
      <router-link to="/" class="navbar-brand fw-bold d-flex align-items-center">
        <i class="bi bi-cpu me-2"></i> Thiết Bị Điện Gia Dụng
      </router-link>

      <!-- Toggle -->
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNavbar"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Menu -->
      <div class="collapse navbar-collapse" id="mainNavbar">
        <!-- Search -->
        <form class="d-flex mx-auto" style="max-width: 400px;" @submit.prevent="goSearch">
          <input
            v-model="search"
            class="form-control me-2"
            type="search"
            placeholder="Tìm kiếm sản phẩm..."
            aria-label="Search"
            @keyup.enter="goSearch"
          />
          <button class="btn btn-outline-light" type="submit">
            <i class="bi bi-search"></i>
          </button>
        </form>

        <!-- Right -->
        <ul class="navbar-nav ms-auto align-items-center">
          <!-- Home -->
          <li class="nav-item">
            <router-link to="/" class="nav-link" active-class="active">
              <i class="bi bi-house-door me-1"></i> Trang Chủ
            </router-link>
          </li>

          <!-- Products -->
          <li class="nav-item">
            <router-link to="/products" class="nav-link" active-class="active">
              <i class="bi bi-box me-1"></i> Sản Phẩm
            </router-link>
          </li>

          <!-- Cart -->
          <li class="nav-item position-relative">
            <router-link to="/cart" class="nav-link" active-class="active">
              <i class="bi bi-cart4 me-1"></i> Giỏ Hàng
              <span
                v-if="cartCount > 0"
                class="badge bg-danger rounded-pill position-absolute top-0 start-100 translate-middle"
              >
                {{ cartCount }}
              </span>
            </router-link>
          </li>

          <!-- Rental Cart -->
          <li class="nav-item position-relative">
            <router-link to="/rentalcart" class="nav-link" active-class="active">
              <i class="bi bi-cart4 me-1"></i> Giỏ Thuê
              <span
                v-if="cartCount > 0"
                class="badge bg-danger rounded-pill position-absolute top-0 start-100 translate-middle"
              >
                {{ cartCount }}
              </span>
            </router-link>
          </li>

          <!-- Orders -->
          <li v-if="isLoggedIn" class="nav-item">
            <router-link to="/order" class="nav-link" active-class="active">
              <i class="bi bi-bag-check me-1"></i> Đơn Mua
            </router-link>
          </li>

          <!-- Rental Orders -->
          <li v-if="isLoggedIn" class="nav-item">
            <router-link to="/rentalOrder" class="nav-link" active-class="active">
              <i class="bi bi-journal-text me-1"></i> Đơn Thuê
            </router-link>
          </li>

          <!-- User dropdown -->
          <li
            class="nav-item dropdown"
            @mouseenter="showDropdown = true"
            @mouseleave="showDropdown = false"
          >
            <a
              class="nav-link dropdown-toggle d-flex align-items-center"
              href="#"
              id="userDropdown"
              role="button"
            >
              <img
                v-if="isLoggedIn"
                :src="resolvedAvatar"
                alt="avatar"
                class="rounded-circle me-2 shadow-sm avatar-navbar"
              />

              <i
                v-else
                :class="String(userRole).toLowerCase() === 'admin'
                  ? 'bi bi-shield-lock me-1 text-warning'
                  : 'bi bi-person-circle me-1'"
              ></i>

              <span>{{ isLoggedIn ? userDisplayName : "Tài khoản" }}</span>
            </a>

            <ul
              class="dropdown-menu dropdown-menu-end shadow"
              aria-labelledby="userDropdown"
              :class="{ show: showDropdown }"
            >
              <!-- Not logged in -->
              <template v-if="!isLoggedIn">
                <li><router-link to="/login" class="dropdown-item">Đăng nhập</router-link></li>
                <li><router-link to="/register" class="dropdown-item">Đăng ký</router-link></li>
              </template>

              <!-- Logged in -->
              <template v-else>
                <li>
                  <router-link to="/profile" class="dropdown-item">
                    Hồ sơ
                  </router-link>
                </li>

                <li v-if="String(userRole).toLowerCase() === 'admin'">
                  <router-link to="/admin" class="dropdown-item">
                    Quản trị
                  </router-link>
                </li>

                <li>
                  <button class="dropdown-item text-danger" @click="logout">
                    Đăng xuất
                  </button>
                </li>
              </template>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const search = ref("");
const cartCount = ref(0);
const showDropdown = ref(false);

onMounted(() => {
  authStore.loadFromStorage();
});

// Avatar xử lý như Profile.vue
const resolvedAvatar = computed(() => {
  const avatar = authStore.user?.avatarUrl || authStore.user?.avatar;
  if (!avatar) return "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  if (avatar.startsWith("/")) return `https://localhost:44303${avatar}`;
  return avatar;
});

const isLoggedIn = computed(() => authStore.isLoggedIn);
const userDisplayName = computed(
  () => authStore.user?.fullName || authStore.user?.username || "Tài khoản"
);

const userRole = computed(() => {
  const role = authStore.user?.role;
  return typeof role === "string" ? role : String(role ?? "");
});

function goSearch() {
  if (!search.value.trim()) return;
  router.push({ path: "/products", query: { search: search.value.trim() } });
}

function logout() {
  authStore.logout();
  router.push("/login");
}
</script>

<style scoped>
.nav-item.dropdown:hover .dropdown-menu {
  display: block;
  margin-top: 0;
}
.dropdown-menu.show {
  display: block;
}
.dropdown-item:hover {
  background-color: #0d6efd;
  color: white;
}
.avatar-navbar {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border: 2px solid #fff;
}
.nav-link.active {
  color: #0d6efd !important;
  font-weight: 600;
}
body {
  padding-top: 70px;
}
</style>
