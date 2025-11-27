<template>
  <div>
    <h2 class="mb-3">👨‍💼 Quản lý Shipper</h2>
    <button class="btn btn-primary mb-3" @click="showForm = true">+ Thêm Shipper</button>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>#</th>
          <th>Tên</th>
          <th>Email</th>
          <th>Vai trò</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(s, index) in staffs" :key="s.id">
          <td>{{ index + 1 }}</td>
          <td>{{ s.name }}</td>
          <td>{{ s.email }}</td>
          <td><span class="badge bg-info">{{ s.role }}</span></td>
          <td>
            <button class="btn btn-sm btn-warning me-2" @click="edit(s)">Sửa</button>
            <button class="btn btn-sm btn-danger" @click="remove(s.id)">Xóa</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Form thêm/sửa -->
    <div v-if="showForm" class="card p-3 mt-3">
      <h5>{{ form.id ? "Cập nhật Shipper" : "Thêm Shipper" }}</h5>
      <form @submit.prevent="save">
        <div class="mb-2">
          <label>Tên</label>
          <input v-model="form.name" class="form-control" required>
        </div>
        <div class="mb-2">
          <label>Email</label>
          <input type="email" v-model="form.email" class="form-control" required>
        </div>
        <div class="mb-2">
          <label>Vai trò</label>
          <select v-model="form.role" class="form-select">
            <option>Shipper</option>
            <option>Quản trị</option>
          </select>
        </div>
        <button class="btn btn-success me-2">Lưu</button>
        <button type="button" class="btn btn-secondary" @click="cancel">Hủy</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'

const showForm = ref(false)
const staffs = ref([
  { id: 1, name: "Nguyễn Văn Admin", email: "admin@gmail.com", role: "Quản trị" },
  { id: 2, name: "Lê Văn Nhân", email: "staff@gmail.com", role: "Shipper" }
])

const form = reactive({ id: null, name: "", email: "", role: "Shipper" })

function save() {
  if (form.id) {
    const idx = staffs.value.findIndex(s => s.id === form.id)
    staffs.value[idx] = { ...form }
  } else {
    form.id = Date.now()
    staffs.value.push({ ...form })
  }
  resetForm()
}

function edit(s) {
  Object.assign(form, s)
  showForm.value = true
}

function remove(id) {
  staffs.value = staffs.value.filter(s => s.id !== id)
}

function resetForm() {
  Object.assign(form, { id: null, name: "", email: "", role: "Shipper" })
  showForm.value = false
}

function cancel() {
  resetForm()
}
</script>
