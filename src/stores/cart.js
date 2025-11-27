// src/stores/cart.js
import { defineStore } from "pinia";
import cartApi from "@/services/cartService";

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: [],
    subtotal: 0,
    loading: false,
  }),

  getters: {
    totalAmount: (state) => state.subtotal,
    itemCount: (state) => state.items.reduce((sum, i) => sum + i.quantity, 0),
  },

  actions: {
    async loadCart() {
      this.loading = true;
      try {
        const data = await cartApi.getCart();
        this.items = data.items || [];
        this.subtotal = data.subtotal || 0;
      } catch (err) {
        console.error("Lỗi tải giỏ hàng:", err);
      } finally {
        this.loading = false;
      }
    },

    async addItem(productId, quantity = 1) {
      await cartApi.addItem(productId, quantity);
      await this.loadCart();
    },

    async updateQuantity(productId, quantity) {
      await cartApi.updateQuantity(productId, quantity);
      await this.loadCart();
    },

    async removeItem(productId) {
      await cartApi.removeItem(productId);
      await this.loadCart();
    },

    async clearCart() {
      await cartApi.clearCart();
      this.items = [];
      this.subtotal = 0;
    },
  },
});
