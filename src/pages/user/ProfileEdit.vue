<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <div class="card shadow-lg border-0 rounded-4 overflow-hidden">
          <div class="card-header bg-primary text-white text-center py-4">
            <h3 class="mb-0">
              <i class="bi bi-pencil-square me-2"></i>Chỉnh sửa hồ sơ cá nhân
            </h3>
          </div>

          <div class="card-body bg-light">
            <form @submit.prevent="handleUpdate">
              <!-- Avatar -->
              <div class="text-center mb-4">
                <img
                  :src="previewAvatar"
                  alt="Avatar"
                  class="rounded-circle shadow mb-3"
                  width="120"
                  height="120"
                />
                <div>
                  <label for="avatarInput" class="btn btn-outline-secondary btn-sm">
                    <i class="bi bi-upload me-1"></i>Chọn ảnh
                  </label>
                  <input
                    id="avatarInput"
                    type="file"
                    accept="image/*"
                    class="d-none"
                    @change="handleAvatarUpload"
                  />
                </div>
              </div>

              <!-- Thông tin cơ bản -->
              <div class="form-floating mb-3">
                <input
                  v-model.trim="form.fullName"
                  type="text"
                  class="form-control"
                  id="nameInput"
                  placeholder="Họ và tên"
                  required
                />
                <label for="nameInput">Họ và tên</label>
              </div>

              <div class="form-floating mb-3">
                <input
                  v-model.trim="form.email"
                  type="email"
                  class="form-control"
                  id="emailInput"
                  placeholder="Email"
                  required
                />
                <label for="emailInput">Email</label>
              </div>

              <div class="form-floating mb-3">
                <input
                  v-model.trim="form.phoneNumber"
                  type="text"
                  class="form-control"
                  id="phoneInput"
                  placeholder="Số điện thoại"
                />
                <label for="phoneInput">Số điện thoại</label>
              </div>

              <div class="form-floating mb-3">
                <input
                  v-model.trim="form.address"
                  type="text"
                  class="form-control"
                  id="addressInput"
                  placeholder="Địa chỉ cư trú"
                />
                <label for="addressInput">Địa chỉ</label>
              </div>

              <hr />

              <!-- 🔐 Đổi mật khẩu -->
              <div class="mb-3">
                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm"
                  @click="showPasswordForm = !showPasswordForm"
                >
                  <i class="bi bi-key me-1"></i>Đổi mật khẩu
                </button>
              </div>

              <div v-if="showPasswordForm">
                <!-- Mật khẩu hiện tại -->
                <div class="form-floating mb-3 position-relative">
                  <input
                    :type="showCurrentPassword ? 'text' : 'password'"
                    v-model="form.currentPassword"
                    class="form-control"
                    id="currentPasswordInput"
                    placeholder="Mật khẩu hiện tại"
                    required
                  />
                  <label for="currentPasswordInput">Mật khẩu hiện tại</label>
                  <i
                    class="bi"
                    :class="showCurrentPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'"
                    @click="showCurrentPassword = !showCurrentPassword"
                    style="position:absolute; top:50%; right:12px; transform:translateY(-50%); cursor:pointer;"
                  ></i>
                </div>

                <!-- Mật khẩu mới -->
                <div class="form-floating mb-3 position-relative">
                  <input
  :type="showNewPassword ? 'text' : 'password'"
  v-model="form.newPassword"
  class="form-control"
  id="passwordInput"
  placeholder="Mật khẩu mới"
  required
/>

                  <label for="passwordInput">Mật khẩu mới</label>
                  <i
                    class="bi"
                    :class="showNewPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'"
                    @click="showNewPassword = !showNewPassword"
                    style="position:absolute; top:50%; right:12px; transform:translateY(-50%); cursor:pointer;"
                  ></i>
                </div>

                <!-- Xác nhận mật khẩu -->
                <div class="form-floating mb-3 position-relative">
                  <input
                    :type="showConfirmPassword ? 'text' : 'password'"
                    v-model="form.confirmPassword"
                    class="form-control"
                    id="confirmInput"
                    placeholder="Xác nhận mật khẩu"
                    required
                  />
                  <label for="confirmInput">Xác nhận mật khẩu</label>
                  <i
                    class="bi"
                    :class="showConfirmPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'"
                    @click="showConfirmPassword = !showConfirmPassword"
                    style="position:absolute; top:50%; right:12px; transform:translateY(-50%); cursor:pointer;"
                  ></i>
                </div>
                <hr />
              </div>

              <!-- 2FA -->
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 class="mb-1 fw-semibold">Xác thực hai yếu tố (2FA)</h6>
                  <small class="text-muted">
                    Bảo vệ tài khoản bằng mã xác thực qua email.
                  </small>
                </div>

                <div>
                  <button
                    v-if="twoFAEnabled"
                    type="button"
                    class="btn btn-outline-danger btn-sm"
                    :disabled="loading2FA"
                    @click="open2FAModal(false)"
                  >
                    <i class="bi bi-shield-x me-1"></i>Tắt 2FA
                  </button>

                  <button
                    v-else
                    type="button"
                    class="btn btn-outline-success btn-sm"
                    :disabled="loading2FA"
                    @click="open2FAModal(true)"
                  >
                    <i class="bi bi-shield-check me-1"></i>Bật 2FA
                  </button>
                </div>
              </div>

              <div
                v-if="twoFAStatus"
                :class="[ 'alert text-center small mt-2', twoFAStatusType === 'success' ? 'alert-success' : 'alert-danger' ]"
              >
                {{ twoFAStatus }}
              </div>

              <hr />

              <!-- Nút -->
              <div class="d-flex justify-content-between align-items-center mt-4">
                <router-link to="/profile" class="btn btn-outline-secondary">
                  <i class="bi bi-arrow-left me-1"></i>Trở về
                </router-link>

                <button
                  type="submit"
                  class="btn btn-success px-4 fw-semibold"
                  :disabled="loading"
                >
                  <span v-if="loading">
                    <span class="spinner-border spinner-border-sm me-2"></span>Đang lưu...
                  </span>
                  <span v-else>
                    <i class="bi bi-check2-circle me-1"></i>Lưu thay đổi
                  </span>
                </button>
              </div>
            </form>

            <div
              v-if="message"
              :class="[ 'alert mt-3 text-center small', messageType === 'success' ? 'alert-success' : 'alert-danger' ]"
            >
              {{ message }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal nhập mật khẩu khi bật/tắt 2FA -->
    <div
      class="modal fade"
      id="passwordModal"
      tabindex="-1"
      aria-hidden="true"
      ref="passwordModalEl"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-3 shadow">
          <div class="modal-header">
            <h5 class="modal-title fw-semibold">
              {{ isEnabling2FA ? "Bật xác thực hai yếu tố" : "Tắt xác thực hai yếu tố" }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p class="small text-muted">
              Vui lòng nhập mật khẩu tài khoản để xác nhận hành động này.
            </p>

            <div class="position-relative">
              <input
                :type="showPassword2FA ? 'text' : 'password'"
                v-model="passwordConfirm"
                class="form-control"
                placeholder="Nhập mật khẩu của bạn"
                @keyup.enter="confirmToggle2FA"
              />
              <i
                class="bi"
                :class="showPassword2FA ? 'bi-eye-slash-fill' : 'bi-eye-fill'"
                @click="showPassword2FA = !showPassword2FA"
                style="position:absolute; top:50%; right:12px; transform:translateY(-50%); cursor:pointer;"
              ></i>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
              :disabled="loading2FA"
            >
              Hủy
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="confirmToggle2FA"
              :disabled="loading2FA || !passwordConfirm"
            >
              <span v-if="loading2FA" class="spinner-border spinner-border-sm me-2"></span>
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";
import userService from "@/services/userService.js";
import * as bootstrap from "bootstrap";

const router = useRouter();
const authStore = useAuthStore();

const user = computed(() => authStore.user || {});
const loading = ref(false);
const message = ref("");
const messageType = ref("success");

const showPassword2FA = ref(false);
const loading2FA = ref(false);
const twoFAStatus = ref("");
const twoFAStatusType = ref("success");
const twoFAEnabled = ref(false);

const showPasswordForm = ref(false);
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const form = ref({
  fullName: "",
  email: "",
  phoneNumber: "",
  address: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
const previewAvatar = ref(defaultAvatar);
let newAvatarFile = null;

onMounted(async () => {
  if (user.value) {
    form.value.fullName = user.value.fullName || "";
    form.value.email = user.value.email || "";
    form.value.phoneNumber = user.value.phoneNumber || "";
    form.value.address = user.value.address || "";
    previewAvatar.value = user.value.avatar || defaultAvatar;
  }

  try {
    const res = await userService.get2FAStatus();
    twoFAEnabled.value = !!res?.data?.isTwoFactorEnabled;
  } catch {
    twoFAEnabled.value = user.value?.isTwoFactorEnabled || false;
  }
});

watch(user, (newUser) => {
  if (newUser?.avatar) previewAvatar.value = newUser.avatar;
  if (newUser?.isTwoFactorEnabled !== undefined)
    twoFAEnabled.value = newUser.isTwoFactorEnabled;
});

function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (file) {
    newAvatarFile = file;
    previewAvatar.value = URL.createObjectURL(file);
  }
}

async function handleUpdate() {
  message.value = "";

  if (showPasswordForm.value) {
    if (!form.value.currentPassword) {
      message.value = "Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu.";
      messageType.value = "danger";
      return;
    }
if (
  !form.value.newPassword ||
  form.value.newPassword !== form.value.confirmPassword
) {
      message.value = "Mật khẩu mới và xác nhận không khớp.";
      messageType.value = "danger";
      return;
    }
  }

  try {
    loading.value = true;

    if (newAvatarFile) await authStore.updateAvatar(newAvatarFile);

    const payload = {
      fullName: form.value.fullName,
      email: form.value.email,
      phoneNumber: form.value.phoneNumber,
      address: form.value.address,
    };
    await userService.update(user.value.id, payload);

    if (showPasswordForm.value) {
await userService.changePassword(
  form.value.currentPassword,
  form.value.newPassword,
  form.value.confirmPassword
);
    }

    await authStore.fetchCurrentUser();

    message.value = "Cập nhật hồ sơ thành công!";
    messageType.value = "success";

form.value.currentPassword = "";
form.value.newPassword = "";
form.value.confirmPassword = "";
    showPasswordForm.value = false;

    setTimeout(() => router.push("/profile"), 1500);
  } catch (err) {
    console.error("❌ Lỗi cập nhật:", err);
    message.value = err.response?.data?.message || "Không thể cập nhật thông tin.";
    messageType.value = "danger";
  } finally {
    loading.value = false;
  }
}

// 2FA
const passwordModalEl = ref(null);
let passwordModal = null;
const passwordConfirm = ref("");
const isEnabling2FA = ref(true);

function open2FAModal(enable) {
  isEnabling2FA.value = enable;
  passwordConfirm.value = "";
  if (!passwordModal)
    passwordModal = new bootstrap.Modal(passwordModalEl.value, { backdrop: "static" });
  passwordModal.show();
}

async function confirmToggle2FA() {
  try {
    loading2FA.value = true;
    twoFAStatus.value = "";

    await userService.toggle2FA(passwordConfirm.value);

    twoFAStatus.value = isEnabling2FA.value
      ? "Đã bật xác thực hai yếu tố thành công!"
      : "Đã tắt xác thực hai yếu tố thành công!";
    twoFAStatusType.value = "success";

    await authStore.fetchCurrentUser();
    const res = await userService.get2FAStatus();
    twoFAEnabled.value = !!res?.data?.isTwoFactorEnabled;

    passwordModal.hide();
  } catch (err) {
    console.error("❌ Lỗi toggle 2FA:", err);
    twoFAStatus.value = err.response?.data?.message || "Thao tác thất bại.";
    twoFAStatusType.value = "danger";
  } finally {
    loading2FA.value = false;
  }
}
</script>

<style scoped>
.card { border-radius: 1rem; }
img.rounded-circle { object-fit: cover; border: 3px solid #fff; }
.btn-outline-secondary:hover { background-color: #e9ecef; }
.alert { border-radius: 0.5rem; }
.modal-content { border-radius: 0.8rem; }
</style>
