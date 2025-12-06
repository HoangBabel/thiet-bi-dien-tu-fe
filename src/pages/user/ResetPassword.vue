<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100 bg-light">
    <div class="card shadow-lg border-0 rounded-4 p-4" style="width: 400px;">
      <div class="text-center mb-4">
        <h4 class="fw-bold text-warning">Quên mật khẩu</h4>
        <p class="text-muted small mb-0" v-if="!codeSent">
          Nhập email để nhận mã xác thực
        </p>
        <p class="text-muted small mb-0" v-else>
          Nhập mã xác thực và mật khẩu mới
        </p>
      </div>

      <!-- Form gửi mã -->
      <form @submit.prevent="handleSendCode" v-if="!codeSent">
        <div class="form-floating mb-3">
          <input
            type="email"
            v-model="email"
            class="form-control rounded-3"
            id="emailInput"
            placeholder="Email"
            required
          />
          <label for="emailInput">Email</label>
        </div>

        <button
          type="submit"
          class="btn btn-warning w-100 py-2 fw-semibold rounded-3 shadow-sm"
          :disabled="loading"
        >
          <span v-if="loading">
            <span class="spinner-border spinner-border-sm me-2"></span>Đang gửi mã...
          </span>
          <span v-else>
            <i class="bi bi-envelope me-2"></i>Gửi mã xác thực
          </span>
        </button>
      </form>

      <!-- Form reset mật khẩu -->
      <form @submit.prevent="handleResetPassword" v-else>
        <div class="form-floating mb-3">
          <input
            type="text"
            v-model="code"
            class="form-control rounded-3"
            id="codeInput"
            placeholder="Mã xác thực"
            required
          />
          <label for="codeInput">Mã xác thực</label>
        </div>

        <div class="form-floating mb-3 position-relative">
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="newPassword"
            class="form-control rounded-3"
            id="newPasswordInput"
            placeholder="Mật khẩu mới"
            minlength="8"
            required
          />
          <label for="newPasswordInput">Mật khẩu mới</label>

          <!-- eye icon (fixed: single class attribute via :class array) -->
          <i
            role="button"
            tabindex="0"
            :class="['bi', showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill', 'toggle-eye']"
            @click="toggleShowPassword"
            @keyup.enter="toggleShowPassword"
            aria-label="Toggle password visibility"
          ></i>
        </div>

        <div class="form-floating mb-3 position-relative">
          <input
            :type="showConfirmPassword ? 'text' : 'password'"
            v-model="confirmPassword"
            class="form-control rounded-3"
            id="confirmPasswordInput"
            placeholder="Xác nhận mật khẩu mới"
            minlength="8"
            required
          />
          <label for="confirmPasswordInput">Xác nhận mật khẩu mới</label>

          <i
            role="button"
            tabindex="0"
            :class="['bi', showConfirmPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill', 'toggle-eye']"
            @click="toggleShowConfirm"
            @keyup.enter="toggleShowConfirm"
            aria-label="Toggle confirm password visibility"
          ></i>
        </div>

        <button
          type="submit"
          class="btn btn-success w-100 py-2 fw-semibold rounded-3 shadow-sm"
          :disabled="loading"
        >
          <span v-if="loading">
            <span class="spinner-border spinner-border-sm me-2"></span>Đang reset...
          </span>
          <span v-else>
            <i class="bi bi-key me-2"></i>Đặt lại mật khẩu
          </span>
        </button>

        <button
          type="button"
          class="btn btn-outline-secondary w-100 mt-2"
          @click="() => { codeSent = false; resetInputs(); }"
          :disabled="loading"
        >
          <i class="bi bi-arrow-left me-2"></i>Quay lại nhập email
        </button>

        <button
          type="button"
          class="btn btn-outline-warning w-100 mt-2"
          @click="handleResendCode"
          :disabled="loading"
        >
          <i class="bi bi-arrow-repeat me-2"></i>Gửi lại mã
        </button>
      </form>

      <!-- Thông báo -->
      <div v-if="error" class="alert alert-danger mt-3 py-2 text-center small">
        {{ error }}
      </div>

      <div v-if="success" class="alert alert-success mt-3 py-2 text-center small">
        {{ success }}
      </div>

      <p class="text-center mt-4 mb-0 text-muted small">
        Đã nhớ mật khẩu?
        <router-link to="/login" class="fw-semibold text-decoration-none">Đăng nhập</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import userService from "@/services/userService.js";
import api, { USER_API } from "@/services/api.js";

const email = ref("");
const code = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);
const error = ref("");
const success = ref("");
const codeSent = ref(false);
const router = useRouter();

function resetInputs() {
  code.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  showPassword.value = false;
  showConfirmPassword.value = false;
  error.value = "";
  success.value = "";
}

/* Gửi mã reset password */
async function handleSendCode() {
  error.value = "";
  success.value = "";
  if (!email.value) {
    error.value = "Vui lòng nhập email.";
    return;
  }

  loading.value = true;
  try {
    await userService.sendResetCode(email.value);
    success.value = "Mã xác thực đã được gửi vào email của bạn.";
    codeSent.value = true;
  } catch (err) {
    console.error("Send reset code error:", err);
    error.value = err?.response?.data || err?.response?.data?.message || "Không thể gửi mã xác thực.";
  } finally {
    loading.value = false;
  }
}

/* Gửi lại mã */
async function handleResendCode() {
  error.value = "";
  success.value = "";
  if (!email.value) {
    error.value = "Vui lòng nhập email trước.";
    return;
  }

  loading.value = true;
  try {
    await userService.resendResetCode(email.value);
    success.value = "Mã xác thực mới đã được gửi vào email của bạn.";
  } catch (err) {
    console.error("Resend reset code error:", err);
    error.value = err?.response?.data || err?.response?.data?.message || "Không thể gửi lại mã xác thực.";
  } finally {
    loading.value = false;
  }
}

/* Reset mật khẩu */
async function handleResetPassword() {
  error.value = "";
  success.value = "";

  // Backend expects at least 8 chars + complexity — enforce min length here
  if (!code.value) {
    error.value = "Vui lòng nhập mã xác thực.";
    return;
  }
  if (newPassword.value.length < 8) {
    error.value = "Mật khẩu phải có ít nhất 8 ký tự.";
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = "Mật khẩu xác nhận không khớp.";
    return;
  }

  loading.value = true;
  try {
    // send full DTO matching backend: Email, Code, NewPassword, ConfirmPassword
    await api.post(USER_API.RESET_PASSWORD, {
      Email: email.value,
      Code: code.value,
      NewPassword: newPassword.value,
      ConfirmPassword: confirmPassword.value,
    });

    success.value = "Đặt lại mật khẩu thành công! Bạn sẽ được chuyển đến trang đăng nhập.";
    setTimeout(() => router.push("/login"), 1500);
  } catch (err) {
    console.error("Reset password error:", err);
    // Try to show useful message
    const resp = err?.response;
    if (resp?.data) {
      // ModelState validation in ASP.NET sometimes returns object or empty string
      if (typeof resp.data === "string" && resp.data) error.value = resp.data;
      else if (resp.data?.message) error.value = resp.data.message;
      else if (resp.data?.errors) {
        // flatten validation errors
        const vals = Object.values(resp.data.errors).flat();
        error.value = vals.join(" ") || "Lỗi xác thực dữ liệu.";
      } else error.value = JSON.stringify(resp.data);
    } else {
      error.value = err?.message || "Không thể đặt lại mật khẩu.";
    }
  } finally {
    loading.value = false;
  }
}

function toggleShowPassword() {
  showPassword.value = !showPassword.value;
}
function toggleShowConfirm() {
  showConfirmPassword.value = !showConfirmPassword.value;
}
</script>

<style scoped>
.form-control:focus {
  border-color: #ffc107;
  box-shadow: 0 0 0 0.15rem rgba(255, 193, 7, 0.25);
}

.toggle-eye {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  cursor: pointer;
}

.card {
  background-color: #ffffff;
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-3px);
}
</style>
