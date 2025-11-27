// =============================
// 📁 src/router/index.js
// =============================
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";

// 🧩 Layouts
import AdminLayout from "@/layouts/AdminLayout.vue";
import UserLayout from "@/layouts/UserLayout.vue";

// 🧭 Admin Pages
import Dashboard from "@/pages/admin/Dashboard.vue";
import AdminProduct from "@/pages/admin/AdminProduct.vue";
import AdminVoucher from "@/pages/admin/AdminVoucher.vue";
import AdminOrder from "@/pages/admin/AdminOrder.vue";
import AdminRental from "@/pages/admin/AdminRental.vue";
import AdminUser from "@/pages/admin/AdminUser.vue";

// 👥 User Pages
import Home from "@/pages/user/Home.vue";
import Login from "@/pages/user/Login.vue";
import Register from "@/pages/user/Register.vue";
import ProductsPage from "@/pages/user/Products.vue";
import ProductDetail from "@/pages/user/ProductDetail.vue";
import Cart from "@/pages/user/Cart.vue";
import Checkout from "@/pages/user/Checkout.vue";
import Order from "@/pages/user/Order.vue";
import RentalCart from "@/pages/user/RentalCart.vue";
import RentalCheckout from "@/pages/user/RentalCheckout.vue";
import RentalOrder from "@/pages/user/RentalOrder.vue";
import Profile from "@/pages/user/Profile.vue";
import ProfileEdit from "@/pages/user/ProfileEdit.vue";
import PaymentResult from "@/pages/user/PaymentResult.vue";
import RentalPaymentResult from "@/pages/user/RentalPaymentResult.vue";

// ⚠️ 404 Page
import NotFound from "@/pages/NotFound.vue";

// =============================
// ⚙️ ROUTE DEFINITIONS
// =============================
const routes = [
  // 🌐 USER AREA
  {
    path: "/",
    component: UserLayout,
    children: [
      { path: "", component: Home },
      { path: "login", component: Login },
      { path: "register", component: Register },
      { path: "products", component: ProductsPage },
      { path: "products/:id", component: ProductDetail, props: true },
      { path: "cart", component: Cart },
      { path: "checkout", component: Checkout, meta: { requiresAuth: true } },
      { path: "rentalCheckout", name: "RentalCheckout", component: RentalCheckout, meta: { requiresAuth: true }, props: true},
      { path: "rentalCart", component: RentalCart},
      { path: "rentalOrder", component: RentalOrder, meta: { requiresAuth: true } },
      { path: "order", component: Order, meta: { requiresAuth: true } },
      { path: "profile", component: Profile, meta: { requiresAuth: true } },
      { path: "edit", component: ProfileEdit, meta: { requiresAuth: true } },
      { path: "payment-result", component: PaymentResult, meta: { requiresAuth: true } },
      { path: "rental-payment-result", component: RentalPaymentResult, meta: { requiresAuth: true } },
    ],
  },

  // 🛠️ ADMIN AREA
  {
    path: "/admin",
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: "", component: Dashboard },
      { path: "products", component: AdminProduct },
      { path: "orders", component: AdminOrder },
      { path: "rentals", component: AdminRental },
      { path: "users", component: AdminUser },
      { path: "vouchers", component: AdminVoucher },
    ],
  },

  // ❌ 404 Not Found
  { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound },
];

// =============================
// 🧭 CREATE ROUTER
// =============================
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    // Cuộn lên đầu mỗi khi đổi trang
    return { top: 0 };
  },
});

// =============================
// 🔐 ROUTE GUARD
// =============================
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore();

  // Tự load lại thông tin người dùng nếu reload
  if (!auth.user && localStorage.getItem("user")) {
    try {
      auth.loadFromStorage();
    } catch {
      auth.logout();
    }
  }

  const isLoggedIn = auth.isLoggedIn;
  const role = auth.user?.role || "";
  const roleString = typeof role === "string" ? role.toLowerCase() : String(role).toLowerCase();
  const isAdmin = roleString === "admin";

  // ⛔ Trang cần đăng nhập
  if (to.meta.requiresAuth && !isLoggedIn) {
    return next("/login");
  }

  // ⛔ Trang admin yêu cầu quyền admin
  if (to.meta.requiresAdmin && !isAdmin) {
    return next("/");
  }

  // 🚫 Đã đăng nhập thì chặn truy cập login/register
  if (isLoggedIn && ["/login", "/register"].includes(to.path)) {
    return next("/");
  }

  next();
});

export default router;
