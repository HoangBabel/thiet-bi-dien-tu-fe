<!-- Confirm2FAModal.vue -->
<template>
  <div class="modal fade show d-block" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content border-0 rounded-4 shadow-lg">
        <!-- 🔷 Header -->
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title text-primary fw-bold">
            <i class="bi bi-shield-lock me-2"></i>Xác thực 2FA
          </h5>
          <button
            type="button"
            class="btn-close"
            aria-label="Close"
            @click="$emit('close')"
          ></button>
        </div>

        <!-- 📩 Body -->
        <div class="modal-body">
          <p class="text-muted small mb-4">
            Nhập mã xác thực gồm 6 chữ số đã được gửi đến email
            <strong>{{ email }}</strong>.
          </p>

          <div class="form-floating mb-3">
            <input
              ref="otpInput"
              type="text"
              id="otpInput"
              class="form-control text-center fw-bold fs-5 tracking-wider rounded-3"
              placeholder="Nhập mã xác thực"
              v-model="otp"
              maxlength="6"
              autocomplete="one-time-code"
              @keyup.enter="submit"
            />
            <label for="otpInput">Mã xác thực (OTP)</label>
          </div>

          <!-- ⚙️ Nút hành động -->
          <div class="d-flex justify-content-between">
            <button
              type="button"
              class="btn btn-outline-primary w-50 me-2"
              @click="handleResend"
              :disabled="loading || cooldown > 0"
            >
              <span v-if="cooldown > 0">
                Gửi lại sau {{ cooldown }}s
              </span>
              <span v-else>Gửi lại mã</span>
            </button>

            <button
              type="button"
              class="btn btn-primary w-50"
              @click="submit"
              :disabled="loading || otp.length !== 6"
            >
              <span v-if="loading">
                <span class="spinner-border spinner-border-sm me-2"></span>
                Đang xác minh...
              </span>
              <span v-else>Xác nhận</span>
            </button>
          </div>
        </div>

        <!-- Footer nhỏ -->
        <div class="modal-footer border-0 pt-0">
          <small class="text-muted fst-italic">
            Nếu bạn không nhận được mã, hãy kiểm tra thư mục <strong>Spam</strong>.
          </small>
        </div>
      </div>
    </div>
  </div>

  <!-- Overlay mờ nền -->
  <div class="modal-backdrop fade show"></div>
</template>

<script setup>
import { ref, onUnmounted, nextTick, watch } from "vue";

const props = defineProps({
  email: { type: String, required: true },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["verify", "resend", "close"]);

const otp = ref("");
const cooldown = ref(0);
let timer = null;
const otpInput = ref(null);

/* 🕒 Gửi lại mã OTP với thời gian chờ */
function handleResend() {
  if (cooldown.value > 0) return;
  emit("resend");
  cooldown.value = 30; // 30 giây cooldown

  timer = setInterval(() => {
    cooldown.value--;
    if (cooldown.value <= 0) {
      clearInterval(timer);
      timer = null;
    }
  }, 1000);
}

/* 🟢 Gửi mã OTP để xác thực */
function submit() {
  if (!otp.value || otp.value.length !== 6) return;
  emit("verify", otp.value);
}

/* Focus input khi modal hiện */
watch(
  () => props.email,
  async () => {
    await nextTick();
    otpInput.value?.focus();
  },
  { immediate: true }
);

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.modal-content {
  animation: fadeIn 0.25s ease-in-out;
}
#otpInput {
  letter-spacing: 0.3em;
  text-align: center;
}
@keyframes fadeIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
