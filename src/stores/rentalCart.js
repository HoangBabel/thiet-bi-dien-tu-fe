// src/stores/rentalCart.js
import { defineStore } from "pinia";
import rentalService from "@/services/rentalService";
import rentalCheckoutService from "@/services/rentalCheckoutService";

export const useRentalCartStore = defineStore("rentalCart", {
  state: () => ({
    items: [],          // Thiết bị thuê
    startDate: null,    // Ngày bắt đầu thuê
    endDate: null,      // Ngày kết thúc thuê
    locationId: null,   // Chi nhánh nhận hàng
    rentalId: null,     // RentalId sau bước 1
    subtotal: 0,        // Tổng tạm tính
    loading: false,     // Loading chung
    creatingDraft: false // trạng thái tạo draft ngay khi add item
  }),

  getters: {
    durationDays: (state) => {
      if (!state.startDate || !state.endDate) return 0;
      const s = new Date(state.startDate);
      const e = new Date(state.endDate);
      return Math.ceil((e - s) / (1000 * 60 * 60 * 24));
    },

    isReadyForCheckout: (state) => {
      return (
        state.items.length > 0 &&
        state.startDate &&
        state.endDate &&
        state.locationId
      );
    },

    itemCount: (state) => state.items.reduce((sum, i) => sum + i.quantity, 0),
  },

  actions: {
    // ===== UserId & key riêng trong localStorage =====
    getUserId() {
      return localStorage.getItem("userId"); 
    },
    getStorageKey() {
      const userId = this.getUserId();
      return userId ? `rentalCart_${userId}` : null;
    },

    persistCart() {
      const key = this.getStorageKey();
      if (!key) return;
      localStorage.setItem(key, JSON.stringify({
        items: this.items,
        startDate: this.startDate,
        endDate: this.endDate,
        locationId: this.locationId,
        rentalId: this.rentalId
      }));
    },

    async addItem(item) {
  // ===== Validate item =====
  if (!item || !item.productId || item.quantity <= 0) {
    console.warn("❌ Item không hợp lệ:", item);
    return;
  }

  // Chuyển productId về number
  const productId = Number(item.productId);
  if (isNaN(productId)) {
    console.warn("❌ productId không hợp lệ:", item.productId);
    return;
  }

  // Kiểm tra tồn tại trong giỏ
  const exist = this.items.find(x => Number(x.productId) === productId);
  if (exist) {
    exist.quantity += item.quantity || 1; // tăng số lượng
  } else {
    this.items.push({
      productId,
      quantity: item.quantity || 1,
      price: item.price || item.unitPrice || 0,
      productName: item.productName || "",
      isRental: true
    });
  }

  // ===== Mặc định startDate = hôm nay, endDate = hôm nay + 14 =====
  const today = new Date();
  if (!this.startDate) this.startDate = today.toISOString().split("T")[0];
  if (!this.endDate) {
    const d = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    this.endDate = d.toISOString().split("T")[0];
  }

  this.computeSubtotal();
  this.persistCart();

  // ===== Đồng bộ backend ngay lập tức nếu chưa có rentalId =====
  if (!this.rentalId && !this.creatingDraft) {
    this.creatingDraft = true;
    try {
      // Chuyển dates về ISO string chuẩn YYYY-MM-DD
      const startDate = new Date(this.startDate).toISOString().split("T")[0];
      const endDate = new Date(this.endDate).toISOString().split("T")[0];

      const payload = {
        StartDate: startDate,
        EndDate: endDate,
        LocationId: Number(this.locationId) || 1, // default branch
        Items: this.items.map(i => ({
          ProductId: Number(i.productId),
          Quantity: Number(i.quantity) || 1
        }))
      };

      console.log("📤 Payload createRental:", payload);

      const res = await rentalService.createRental(payload);

      // Cập nhật rentalId và items theo backend trả về
      this.rentalId = res.RentalId;

      if (res.items && Array.isArray(res.items)) {
        this.items = res.items.map(i => ({
          productId: Number(i.ProductId),
          quantity: Number(i.Quantity),
          price: Number(i.UnitPrice) || 0,
          productName: i.ProductName || "",
          isRental: true
        }));
        this.computeSubtotal();
      }

      this.persistCart();
    } catch (err) {
      console.error("❌ Lỗi tạo Rental Draft khi thêm item:", err);
    } finally {
      this.creatingDraft = false;
    }
  }
}
,

    // ===== Thêm / Cập nhật / Xóa Item =====
    async addItem(item) {
      const exist = this.items.find(x => x.productId === item.productId);
      if (exist) {
        exist.quantity += 1; // mặc định tăng 1
      } else {
        this.items.push({
          ...item,
          quantity: 1,        // mặc định 1
          price: item.price || item.unitPrice || 0
        });
      }

      // Mặc định startDate = hôm nay, endDate = hôm nay + 14
      if (!this.startDate) this.startDate = new Date().toISOString().split("T")[0];
      if (!this.endDate) {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        this.endDate = d.toISOString().split("T")[0];
      }

      this.computeSubtotal();
      this.persistCart();

      // ===== Đồng bộ backend ngay lập tức =====
      if (!this.rentalId) {
        this.creatingDraft = true;
        try {
          const payload = {
            StartDate: this.startDate,
            EndDate: this.endDate,
            LocationId: this.locationId || 1, // chọn mặc định chi nhánh nếu chưa có
            Items: this.items.map(i => ({
              ProductId: i.productId,
              Quantity: i.quantity
            }))
          };
          const res = await rentalService.createRental(payload);
          this.rentalId = res.RentalId;

          if (res.items) {
            this.items = res.items.map(i => ({
              productId: i.ProductId,
              quantity: i.Quantity,
              price: i.UnitPrice || 0
            }));
            this.computeSubtotal();
          }

          this.persistCart();
        } catch (err) {
          console.error("❌ Lỗi tạo Rental Draft khi thêm item:", err);
        } finally {
          this.creatingDraft = false;
        }
      }
    },

    updateQuantity(productId, quantity) {
      const idx = this.items.findIndex(x => x.productId === productId);
      if (idx >= 0) {
        this.items[idx].quantity = quantity;
        this.computeSubtotal();
        this.persistCart();
      }
    },

    removeItem(productId) {
      this.items = this.items.filter(x => x.productId !== productId);
      this.computeSubtotal();
      this.persistCart();
    },

    clearCart() {
      this.items = [];
      this.startDate = null;
      this.endDate = null;
      this.locationId = null;
      this.rentalId = null;
      this.subtotal = 0;

      const key = this.getStorageKey();
      if (key) localStorage.removeItem(key);
    },

    clearAfterSuccess() {
      this.clearCart();
    },

    computeSubtotal() {
      this.subtotal = this.items.reduce(
        (acc, x) => acc + (x.price || 0) * (x.quantity || 0),
        0
      );
    },

    // ===== Bước 1: Tạo hoặc cập nhật Rental Draft =====
    async createRentalDraft() {
      if (!this.isReadyForCheckout) {
        throw new Error("Chưa chọn ngày hoặc chi nhánh, hoặc giỏ rỗng.");
      }

      this.loading = true;
      try {
        const payload = {
          StartDate: this.startDate,
          EndDate: this.endDate,
          LocationId: this.locationId,
          Items: this.items.map(i => ({
            ProductId: i.productId,
            Quantity: i.quantity
          }))
        };

        const res = await rentalService.createRental(payload);
        this.rentalId = res.RentalId;

        if (res.items) {
          this.items = res.items.map(i => ({
            productId: i.ProductId,
            quantity: i.Quantity,
            price: i.UnitPrice || 0
          }));
          this.computeSubtotal();
        }

        this.persistCart();
        return res;
      } finally {
        this.loading = false;
      }
    },

    // ===== Bước 2: Checkout Rental =====
    async checkoutRental(paymentMethod = "COD") {
      if (!this.rentalId) throw new Error("Chưa tạo Rental Draft.");

      this.loading = true;
      try {
        const payload = {
          RentalId: this.rentalId,
          StartDate: this.startDate,
          EndDate: this.endDate,
          LocationId: this.locationId,
          Items: this.items.map(i => ({
            ProductId: i.productId,
            Quantity: i.quantity
          })),
          PaymentMethod: paymentMethod
        };

        const res = await rentalCheckoutService.checkoutRental(payload);
        return res;
      } finally {
        this.loading = false;
      }
    }
  },
});
