<template>
  <div class="container py-4">
    <h2 class="mb-3 fw-bold">👤 Quản lý người dùng</h2>

    <!-- 🔍 Thanh tìm kiếm và lọc role -->
    <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
      <div class="input-group" style="max-width: 400px;">
        <input
          v-model="search"
          @keyup.enter="applyFilters"
          type="text"
          class="form-control"
          placeholder="Tìm theo tên đăng nhập, họ tên hoặc email..."
        />
        <button class="btn btn-primary" @click="applyFilters">Tìm</button>
      </div>

      <div class="ms-auto">
        <select v-model="roleFilter" class="form-select shadow-sm" style="width: 200px;" @change="applyFilters">
          <option value="">Tất cả quyền</option>
          <option v-for="r in roles" :key="r.value" :value="r.value">{{ r.label }}</option>
        </select>
      </div>

      <button class="btn btn-success ms-2" @click="openForm()">+ Thêm người dùng</button>
    </div>

    <!-- 📋 Bảng người dùng -->
    <div class="table-responsive">
      <table class="table table-striped table-bordered align-middle text-center">
        <thead class="table-dark">
          <tr>
            <th>#</th>
            <th>Ảnh</th>
            <th>Tên đăng nhập</th>
            <th>Họ tên</th>
            <th>Email</th>
            <th>Địa chỉ</th>
            <th>Quyền</th>
            <th>2FA</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(u, i) in pagedUsers" :key="u.id">
            <td>{{ (currentPage - 1) * pageSize + i + 1 }}</td>

            <td>
              <img
                :src="u.avatarUrl || defaultAvatar"
                alt="avatar"
                class="rounded-circle border"
                width="50"
                height="50"
              />
            </td>

            <td>{{ u.username }}</td>
            <td>{{ u.fullName }}</td>
            <td>{{ u.email }}</td>
            <td class="text-truncate" style="max-width: 160px;" :title="u.address">
              {{ u.address || "—" }}
            </td>
            <td>
              <span
                class="badge"
                :class="roleClass(u.role)"
              >
                {{ roleText(u.role) }}
              </span>
            </td>

            <td>
              <span :class="u.isTwoFactorEnabled ? 'text-success fw-semibold' : 'text-muted'">
                {{ u.isTwoFactorEnabled ? 'Bật' : 'Tắt' }}
              </span>
            </td>

            <td>
              <span :class="u.isActive ? 'text-success' : 'text-danger'">
                {{ u.isActive ? 'Hoạt động' : 'Đã khóa' }}
              </span>
            </td>

            <td>
              <button class="btn btn-sm btn-warning me-2" @click="openForm(u)">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-danger" @click="deleteUser(u.id)">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>

          <tr v-if="pagedUsers.length === 0">
            <td colspan="10" class="text-center text-muted py-3">Không tìm thấy người dùng phù hợp.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Phân trang -->
    <nav v-if="totalPages > 1" class="mt-3 d-flex justify-content-center">
      <ul class="pagination shadow-sm">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link" @click="changePage(currentPage - 1)">Trước</button>
        </li>
        <li
          class="page-item"
          v-for="page in totalPages"
          :key="page"
          :class="{ active: currentPage === page }"
        >
          <button class="page-link" @click="changePage(page)">{{ page }}</button>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button class="page-link" @click="changePage(currentPage + 1)">Sau</button>
        </li>
      </ul>
    </nav>

    <!-- 🧩 Modal thêm/sửa vẫn giữ nguyên -->
    <div class="modal fade" id="userModal" tabindex="-1" ref="modalRef">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title">{{ form.id ? "Cập nhật người dùng" : "Thêm người dùng" }}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>

          <form @submit.prevent="saveUser">
            <div class="modal-body">
              <!-- Nội dung form giữ nguyên -->
              <!-- ... -->
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
              <button type="submit" class="btn btn-success">
                <i class="bi bi-check2-circle me-1"></i>Lưu
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { Modal } from "bootstrap";
import userService from "@/services/userService.js";

const users = ref([]);
const search = ref("");
const roleFilter = ref("");
const currentPage = ref(1);
const pageSize = 10;
const totalPages = ref(1);

const modalRef = ref(null);
let modalInstance = null;
const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
let selectedFile = null;
const previewAvatar = ref("");

// Form
const form = reactive({
  id: null,
  username: "",
  password: "",
  fullName: "",
  email: "",
  phoneNumber: "",
  address: "",
  role: "Customer",
  isActive: true,
  avatarUrl: "",
  isTwoFactorEnabled: false,
});

// Danh sách role
const roles = [
  { value: "Admin", label: "Admin" },
  { value: "Staff", label: "Nhân viên" },
  { value: "Customer", label: "Khách hàng" },
  { value: "Shipper", label: "Shipper" }
];

// ===== Helpers =====
function roleText(role) {
  const r = roles.find(x => x.value === role);
  return r ? r.label : "Không xác định";
}

function roleClass(role) {
  switch (role) {
    case "Admin": return "bg-danger";
    case "Staff": return "bg-info text-dark";
    case "Customer": return "bg-secondary";
    case "Shipper": return "bg-success";
    default: return "bg-light";
  }
}

// Lọc & phân trang
const filteredUsers = computed(() => {
  let list = users.value;
  const q = search.value.trim().toLowerCase();
  if (q) {
    list = list.filter(u =>
      u.username?.toLowerCase().includes(q) ||
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }
  if (roleFilter.value) {
    list = list.filter(u => u.role === roleFilter.value);
  }
  return list;
});

const pagedUsers = computed(() => {
  totalPages.value = Math.ceil(filteredUsers.value.length / pageSize);
  const start = (currentPage.value - 1) * pageSize;
  return filteredUsers.value.slice(start, start + pageSize);
});

function changePage(page) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

function applyFilters() {
  currentPage.value = 1;
}

// Load users
async function loadUsers() {
  try {
    const res = await userService.getAll();
    users.value = res.data || [];
    applyFilters();
  } catch (err) {
    console.error("❌ Lỗi tải người dùng:", err);
  }
}

// Mở form
function openForm(u = null) {
  if (u) {
    Object.assign(form, u, { password: "" });
    previewAvatar.value = u.avatarUrl || "";
  } else {
    Object.assign(form, {
      id: null,
      username: "",
      password: "",
      fullName: "",
      email: "",
      phoneNumber: "",
      address: "",
      role: "Customer",
      isActive: true,
      avatarUrl: "",
      isTwoFactorEnabled: false,
    });
    previewAvatar.value = "";
  }
  if (!modalInstance) modalInstance = new Modal(modalRef.value);
  modalInstance.show();
}

// Upload avatar
function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  selectedFile = file;
  previewAvatar.value = URL.createObjectURL(file);
}

// Save user
async function saveUser() {
  try {
    if (form.id) {
      await userService.update(form.id, form);
      if (selectedFile) await userService.uploadAvatar(form.id, selectedFile);
    } else {
      const res = await userService.register(form);
      if (selectedFile && res.data?.id)
        await userService.uploadAvatar(res.data.id, selectedFile);
    }
    await loadUsers();
    modalInstance.hide();
    selectedFile = null;
  } catch (err) {
    console.error("❌ Lỗi lưu:", err);
    alert("Không thể lưu: " + (err.response?.data || err.message));
  }
}

// Delete user
async function deleteUser(id) {
  if (!confirm("Bạn có chắc muốn xóa người dùng này?")) return;
  try {
    await userService.delete(id);
    await loadUsers();
  } catch (err) {
    alert("Xóa thất bại: " + (err.response?.data || err.message));
  }
}

onMounted(loadUsers);
</script>

<style scoped>
.table img {
  object-fit: cover;
}
.modal-content {
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.25);
}
</style>
