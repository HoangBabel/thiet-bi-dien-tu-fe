<template>
  <div class="card p-4 mt-4">
    <h5>Áp dụng mã giảm giá</h5>

    <form @submit.prevent="apply">
      <div class="row g-3 mt-2">
        <div class="col-md-4">
          <label class="form-label">Mã Voucher</label>
          <input type="text" v-model="code" class="form-control" required />
        </div>

        <div class="col-md-4">
          <label class="form-label">Tổng tiền đơn hàng (₫)</label>
          <input type="number" v-model="amount" class="form-control" required />
        </div>

        <div class="col-md-4">
          <label class="form-label">Phí vận chuyển (₫)</label>
          <input type="number" v-model="shippingFee" class="form-control" />
        </div>
      </div>

      <button class="btn btn-primary mt-3" type="submit">Áp dụng</button>
    </form>

    <div v-if="result" class="alert alert-info mt-4">
      <strong>Kết quả:</strong>
      <pre>{{ result }}</pre>
    </div>
  </div>
</template>

<script>
import voucherService from "@/services/voucherService";

export default {
  data() {
    return {
      code: "",
      amount: 0,
      shippingFee: 0,
      result: null
    };
  },
  methods: {
    async apply() {
      try {
        const res = await voucherService.apply(this.code, this.amount, this.shippingFee);
        this.result = res.data;
      } catch (err) {
        this.result = err.response?.data || { message: "Lỗi khi áp dụng voucher" };
      }
    }
  }
};
</script>
