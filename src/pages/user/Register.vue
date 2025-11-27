<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100 bg-light">
    <div class="card shadow-lg border-0 rounded-4 p-4" style="width: 400px;">
      <div class="text-center mb-4">
        <h4 class="fw-bold text-success">Đăng ký tài khoản</h4>
        <p class="text-muted small mb-0">Tạo tài khoản mới để bắt đầu</p>
      </div>

      <form @submit.prevent="handleRegister">
        <div class="form-floating mb-3">
          <input
            v-model.trim="username"
            type="text"
            class="form-control rounded-3"
            id="usernameInput"
            placeholder="Tên đăng nhập"
            required
          />
          <label for="usernameInput">Tên đăng nhập</label>
        </div>

        <div class="form-floating mb-3">
          <input
            v-model.trim="fullName"
            type="text"
            class="form-control rounded-3"
            id="fullNameInput"
            placeholder="Họ và tên"
            required
          />
          <label for="fullNameInput">Họ và tên</label>
        </div>

        <div class="form-floating mb-3">
          <input
            v-model.trim="email"
            type="email"
            class="form-control rounded-3"
            id="emailInput"
            placeholder="Email"
            required
          />
          <label for="emailInput">Email</label>
        </div>

        <div class="form-floating mb-3">
          <input
            v-model.trim="phoneNumber"
            type="text"
            class="form-control rounded-3"
            id="phoneInput"
            placeholder="Số điện thoại"
          />
          <label for="phoneInput">Số điện thoại (tuỳ chọn)</label>
        </div>

        <div class="form-floating mb-3">
          <input
            v-model.trim="address"
            type="text"
            class="form-control rounded-3"
            id="addressInput"
            placeholder="Địa chỉ"
          />
          <label for="addressInput">Địa chỉ (tuỳ chọn)</label>
        </div>

        <div class="form-floating mb-3">
          <input
            v-model="password"
            type="password"
            class="form-control rounded-3"
            id="passwordInput"
            placeholder="Mật khẩu"
            minlength="6"
            required
          />
          <label for="passwordInput">Mật khẩu</label>
        </div>

        <div class="form-floating mb-3">
          <input
            v-model="confirmPassword"
            type="password"
            class="form-control rounded-3"
            id="confirmInput"
            placeholder="Xác nhận mật khẩu"
            required
          />
          <label for="confirmInput">Xác nhận mật khẩu</label>
        </div>

        <button
          type="submit"
          class="btn btn-success w-100 py-2 fw-semibold rounded-3 shadow-sm"
          :disabled="loading"
        >
          <span v-if="loading">
            <span class="spinner-border spinner-border-sm me-2"></span>Đang đăng ký...
          </span>
          <span v-else>
            <i class="bi bi-person-plus me-2"></i>Đăng ký
          </span>
        </button>
      </form>

      <div v-if="error" class="alert alert-danger mt-3 py-2 text-center small">
        {{ error }}
      </div>

      <p class="text-center mt-4 mb-0 text-muted small">
        Đã có tài khoản?
        <router-link to="/login" class="fw-semibold text-decoration-none">Đăng nhập</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";

const username = ref("");
const fullName = ref("");
const email = ref("");
const phoneNumber = ref("");
const address = ref("");
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const error = ref("");

const router = useRouter();
const authStore = useAuthStore();

async function handleRegister() {
  error.value = "";

  // ⚠️ Kiểm tra đơn giản
  if (!username.value || !fullName.value || !email.value || !password.value) {
    error.value = "Vui lòng điền đầy đủ thông tin bắt buộc.";
    return;
  }
  if (password.value.length < 6) {
    error.value = "Mật khẩu phải có ít nhất 6 ký tự.";
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = "Mật khẩu xác nhận không khớp.";
    return;
  }

  loading.value = true;

  try {
    // 🟢 Gọi API đăng ký
    await authStore.register({
      username: username.value,
      fullName: fullName.value,
      email: email.value,
      password: password.value,
      phoneNumber: phoneNumber.value || null,
      address: address.value || null,
    });

    // 🟢 Tự động đăng nhập sau khi đăng ký
    await authStore.login(email.value, password.value);

    alert(`Đăng ký thành công! Chào mừng ${fullName.value || username.value}`);
    router.push("/");
  } catch (err) {
    console.error("Register error:", err);

    if (err.response?.status === 400)
      error.value = err.response.data || "Thông tin đăng ký không hợp lệ.";
    else if (err.response?.status === 409)
      error.value = "Email hoặc tên đăng nhập đã tồn tại.";
    else if (err.response?.data?.errors)
      error.value = Object.values(err.response.data.errors).flat().join(" ");
    else error.value = "Không thể kết nối đến máy chủ.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.form-control:focus {
  border-color: #198754;
  box-shadow: 0 0 0 0.15rem rgba(25, 135, 84, 0.25);
}

.btn-success:hover {
  background-color: #157347;
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
