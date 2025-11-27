import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

// 📦 Bootstrap & Bootstrap Icons
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import "bootstrap-icons/font/bootstrap-icons.css";

// 📍 Router
import router from "./router/index.js";

// 🔧 Tạo app Vue
const app = createApp(App);

// 🧩 Khởi tạo Pinia trước khi dùng store
const pinia = createPinia();
app.use(pinia);

// ⚙️ Nạp store sau khi pinia đã được đăng ký
import { useAuthStore } from "@/stores/auth";
const authStore = useAuthStore();

// 🧠 Khôi phục session từ localStorage
authStore.loadFromStorage();

// 🚦 Gắn router sau khi khởi tạo store (đảm bảo guard hoạt động đúng)
app.use(router);

// 🖥️ Mount app
app.mount("#app");
