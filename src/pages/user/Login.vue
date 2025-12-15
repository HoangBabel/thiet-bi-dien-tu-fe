<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100 bg-light">
    <div class="card shadow-lg border-0 rounded-4 p-4" style="width: 380px;">
      <div class="text-center mb-4">
        <h4 class="fw-bold text-primary">Đăng nhập</h4>
        <p class="text-muted small mb-0">Chào mừng bạn quay lại!</p>
      </div>

      <!-- 🔐 FORM ĐĂNG NHẬP -->
      <form @submit.prevent="handleLogin">
        <div class="form-floating mb-3">
          <input
            type="email"
            v-model="email"
            class="form-control rounded-3"
            id="emailInput"
            placeholder="name@example.com"
            required
          />
          <label for="emailInput">Email</label>
        </div>

        <div class="form-floating mb-3 position-relative">
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            class="form-control rounded-3"
            id="passwordInput"
            placeholder="Mật khẩu"
            required
          />
          <label for="passwordInput">Mật khẩu</label>
          <i
            class="bi"
            :class="showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'"
            @click="showPassword = !showPassword"
            style="position:absolute; top:50%; right:12px; transform:translateY(-50%); cursor:pointer;"
          ></i>
        </div>

        <!-- 🔗 Quên mật khẩu -->
        <div class="text-end mb-3">
          <router-link
            to="/reset-password"
            class="small text-decoration-none text-warning"
          >
            Quên mật khẩu?
          </router-link>
        </div>

        <button
          type="submit"
          class="btn btn-primary w-100 py-2 fw-semibold rounded-3 shadow-sm"
          :disabled="loading"
        >
          <span v-if="loading">
            <span class="spinner-border spinner-border-sm me-2"></span>Đang đăng nhập...
          </span>
          <span v-else>
            <i class="bi bi-box-arrow-in-right me-2"></i>Đăng nhập
          </span>
        </button>
      </form>

      <!-- ⚠️ THÔNG BÁO LỖI -->
      <div v-if="error" class="alert alert-danger mt-3 py-2 text-center small">
        {{ error }}
      </div>

      <!-- 🔗 CHUYỂN TRANG -->
      <p class="text-center mt-4 mb-0 text-muted small">
        Chưa có tài khoản?
        <router-link to="/register" class="fw-semibold text-decoration-none">
          Đăng ký ngay
        </router-link>
      </p>
    </div>

    <!-- 🔢 MODAL XÁC NHẬN 2FA -->
    <Confirm2FAModal
      v-if="show2FAModal"
      :email="pendingEmail"
      :loading="verifying"
      @verify="handleVerify2FA"
      @close="close2FAModal"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";
import Confirm2FAModal from "@/components/Confirm2FAModal.vue";
import userService from "@/services/userService.js";

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const error = ref("");
const loading = ref(false);

const verifying = ref(false);
const show2FAModal = ref(false);
const pendingEmail = ref("");

const router = useRouter();
const authStore = useAuthStore();

async function handleLogin() {
  error.value = "";

  // ✅ Validate frontend
  if (!email.value || !password.value) {
    error.value = "Vui lòng nhập đầy đủ email và mật khẩu.";
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    error.value = "Email không đúng định dạng.";
    return;
  }

  if (password.value.length < 6) {
    error.value = "Mật khẩu phải có ít nhất 6 ký tự.";
    return;
  }

  loading.value = true;

  try {
    const res = await authStore.login(email.value, password.value);

    if (authStore.is2FARequired) {
      pendingEmail.value = authStore.pendingEmail;
      show2FAModal.value = true;
      return;
    }

    await handleRedirect();
  } catch (err) {
    console.error("❌ Lỗi đăng nhập:", err);

    // ✅ Map lỗi từ backend
    const status = err?.response?.status;
    const message = err?.response?.data?.message;

    if (status === 401) {
      error.value = "Email hoặc mật khẩu không chính xác.";
    } else if (status === 403) {
      error.value = "Tài khoản đã bị khóa hoặc chưa được kích hoạt.";
    } else if (status === 404) {
      error.value = "Tài khoản không tồn tại.";
    } else {
      error.value = message || "Email hoặc mật khẩu không chính xác.";
    }
  } finally {
    loading.value = false;
  }
}

async function handleVerify2FA(code) {
  verifying.value = true;
  error.value = "";

  if (!code || code.length !== 6) {
    error.value = "Mã xác thực phải gồm 6 chữ số.";
    verifying.value = false;
    return;
  }

  try {
    const verified = await authStore.verify2FA(code);

    if (verified && authStore.token) {
      show2FAModal.value = false;
      pendingEmail.value = "";
      await handleRedirect();
    } else {
      error.value = "Mã xác thực không chính xác.";
    }
  } catch (err) {
    console.error("❌ Verify 2FA error:", err);

    const status = err?.response?.status;
    if (status === 400) {
      error.value = "Mã xác thực không hợp lệ hoặc đã hết hạn.";
    } else {
      error.value =
        err?.response?.data?.message || "Xác thực 2FA thất bại.";
    }
  } finally {
    verifying.value = false;
  }
}

function close2FAModal() {
  show2FAModal.value = false;
  pendingEmail.value = "";
}

async function handleRedirect() {
  try {
    const userId = authStore.user?.id;
    if (!userId) throw new Error("Không thể xác định người dùng.");

    const statusRes = await userService.get2FAStatus(userId);
    authStore.user.is2FAEnabled = statusRes?.data?.is2FAEnabled ?? false;

    const name = authStore.user?.fullName || "bạn";
    alert(`Chào mừng ${name} quay lại!`);

    if (authStore.user?.role === "Admin") {
      router.push("/admin");
    } else {
      router.push("/");
    }
  } catch (err) {
    console.warn("⚠️ Không thể đồng bộ trạng thái 2FA:", err);
    router.push("/");
  }
}
</script>

<style scoped>
.form-control:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.15rem rgba(13, 110, 253, 0.25);
}

.btn-primary:hover {
  background-color: #0b5ed7;
  transition: 0.3s;
}

.card {
  background-color: #ffffff;
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-3px);
}
</style>
