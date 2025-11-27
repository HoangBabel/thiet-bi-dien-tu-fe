<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <!-- 🧍 Hồ sơ cá nhân -->
        <div class="card shadow-lg border-0 rounded-4 overflow-hidden">
          <div class="card-header bg-primary text-white text-center py-4">
            <h3 class="mb-0">
              <i class="bi bi-person-circle me-2"></i> Hồ sơ cá nhân
            </h3>
          </div>

          <div class="card-body bg-light" v-if="!loading">
            <div class="row mb-4 align-items-center">
              <div class="col-md-3 text-center">
                <img
                  :src="resolvedAvatar"
                  alt="Avatar"
                  class="rounded-circle shadow"
                  width="120"
                  height="120"
                />
              </div>

              <div class="col-md-9">
                <h4 class="mb-1">{{ user.fullName || user.username }}</h4>
                <p class="text-muted mb-1">
                  <i class="bi bi-envelope me-1"></i>{{ user.email }}
                </p>
                <p v-if="user.phoneNumber" class="text-muted mb-2">
                  <i class="bi bi-telephone me-1"></i>{{ user.phoneNumber }}
                </p>

                <span class="badge bg-success" v-if="user.role === 'Admin'">
                  <i class="bi bi-shield-lock me-1"></i> Quản trị viên
                </span>
                <span class="badge bg-info text-dark" v-else-if="user.role === 'Shipper'">
                  <i class="bi bi-truck me-1"></i> Shipper
                </span>
                <span class="badge bg-secondary" v-else>
                  <i class="bi bi-person me-1"></i> Người dùng
                </span>
              </div>
            </div>

            <hr />

            <!-- 📄 Thông tin chi tiết -->
            <div class="row mb-3">
              <div class="col-sm-4 fw-semibold text-secondary">Tên tài khoản:</div>
              <div class="col-sm-8">{{ user.username }}</div>
            </div>

            <div class="row mb-3">
              <div class="col-sm-4 fw-semibold text-secondary">Email:</div>
              <div class="col-sm-8">{{ user.email }}</div>
            </div>

            <div class="row mb-3" v-if="user.phoneNumber">
              <div class="col-sm-4 fw-semibold text-secondary">Số điện thoại:</div>
              <div class="col-sm-8">{{ user.phoneNumber }}</div>
            </div>

            <!-- 🏠 Địa chỉ -->
            <div class="row mb-3">
              <div class="col-sm-4 fw-semibold text-secondary">Địa chỉ:</div>
              <div class="col-sm-8">
                <span v-if="user.address && user.address.trim().length > 0">
                  {{ user.address }}
                </span>
                <span v-else class="text-muted fst-italic">Chưa cập nhật</span>
              </div>
            </div>

            <!-- 🔐 Trạng thái bảo mật hai lớp -->
            <div class="row mb-3">
              <div class="col-sm-4 fw-semibold text-secondary">Bảo mật 2 lớp (2FA):</div>
              <div class="col-sm-8">
                <span v-if="twoFAEnabled" class="text-success fw-semibold">
                  <i class="bi bi-shield-check me-1"></i> Đang bật
                </span>
                <span v-else class="text-muted">
                  <i class="bi bi-shield-exclamation me-1"></i> Chưa bật
                </span>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-sm-4 fw-semibold text-secondary">Ngày tạo:</div>
              <div class="col-sm-8">{{ formatDate(user.createdAt) }}</div>
            </div>

            <div class="row mb-3" v-if="user.updatedAt">
              <div class="col-sm-4 fw-semibold text-secondary">Cập nhật gần nhất:</div>
              <div class="col-sm-8">{{ formatDate(user.updatedAt) }}</div>
            </div>

            <div class="row mb-3" v-if="user.lastLogin">
              <div class="col-sm-4 fw-semibold text-secondary">Đăng nhập cuối:</div>
              <div class="col-sm-8">{{ formatDateTime(user.lastLogin) }}</div>
            </div>

            <div class="row mb-3">
              <div class="col-sm-4 fw-semibold text-secondary">Trạng thái:</div>
              <div class="col-sm-8">
                <span class="badge bg-success" v-if="user.isActive">Đang hoạt động</span>
                <span class="badge bg-danger" v-else>Tạm khóa</span>
              </div>
            </div>
          </div>

          <!-- ⏳ Loading -->
          <div v-else class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-3 text-muted">Đang tải dữ liệu...</p>
          </div>

          <!-- ⚙️ Hành động -->
          <div class="card-footer bg-white text-center py-3">
            <router-link to="/edit" class="btn btn-primary me-2">
              <i class="bi bi-pencil-square me-1"></i> Chỉnh sửa hồ sơ
            </router-link>
            <button @click="logout" class="btn btn-outline-danger">
              <i class="bi bi-box-arrow-right me-1"></i> Đăng xuất
            </button>
          </div>
        </div>

        <!-- 🕓 Lịch sử hoạt động -->
        <div v-if="activityLog.length" class="card mt-4 border-0 shadow-sm rounded-4">
          <div class="card-header bg-secondary text-white py-3">
            <h5 class="mb-0">
              <i class="bi bi-clock-history me-2"></i>Lịch sử hoạt động
            </h5>
          </div>
          <ul class="list-group list-group-flush">
            <li v-for="(item, index) in activityLog" :key="index" class="list-group-item">
              <i class="bi bi-dot text-primary me-2"></i>{{ item }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import userService from "@/services/userService";

const router = useRouter();
const authStore = useAuthStore();

const user = ref({});
const loading = ref(true);
const activityLog = ref([]);
const twoFAEnabled = ref(false);

// 🖼️ Avatar hiển thị chính xác sau khi đổi ảnh
const resolvedAvatar = computed(() => {
  const avatar = user.value.avatarUrl || user.value.avatar;
  if (!avatar) {
    return "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  }
  if (avatar.startsWith("/")) {
    return `https://localhost:44303${avatar}`;
  }
  return avatar;
});

// 📅 Định dạng ngày
function formatDate(date) {
  if (!date) return "Không xác định";
  return new Date(date).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTime(date) {
  if (!date) return "Không xác định";
  return new Date(date).toLocaleString("vi-VN");
}

// 📡 Tải thông tin người dùng + 2FA
onMounted(async () => {
  try {
    const userId = authStore.user?.id;
    if (!userId) {
      router.push("/login");
      return;
    }

    const [userRes, twoFARes] = await Promise.all([
      userService.getById(userId),
      userService.get2FAStatus(),
    ]);

    user.value = userRes.data;
    twoFAEnabled.value = !!twoFARes.data?.isTwoFactorEnabled;

    // 🧾 Gán tạm activity giả lập
    activityLog.value = [
      `Đăng nhập lần cuối: ${formatDateTime(user.value.lastLogin)}`,
      "Xem thông tin cá nhân",
      "Cập nhật hồ sơ",
    ];
  } catch (err) {
    console.error("❌ Lỗi tải thông tin người dùng:", err);
  } finally {
    loading.value = false;
  }
});

// 🚪 Đăng xuất
function logout() {
  authStore.logout();
  router.push("/login");
}
</script>

<style scoped>
.card {
  border-radius: 1rem;
}
.card-header h3,
.card-header h5 {
  font-weight: 600;
}
img.rounded-circle {
  object-fit: cover;
  border: 3px solid #fff;
}
.badge {
  font-size: 0.9rem;
  padding: 0.4em 0.8em;
}
.list-group-item {
  font-size: 0.95rem;
}
</style>
