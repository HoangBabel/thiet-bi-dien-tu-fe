<template>
  <div class="modal-backdrop-custom">
    <div class="modal-content-custom bg-white p-4 rounded shadow-lg">
      <h5 class="fw-bold text-primary mb-3">Viết đánh giá</h5>

      <div v-if="alert" class="alert alert-danger small py-2">
        {{ alert }}
      </div>

      <!-- RATING -->
      <div class="mb-3">
        <span
          v-for="i in 5"
          :key="i"
          @click="rating = i"
          style="cursor:pointer"
        >
          <i
            class="bi fs-4"
            :class="i <= rating
              ? 'bi-star-fill text-warning'
              : 'bi-star text-muted'"
          ></i>
        </span>
      </div>

      <textarea
        v-model="comment"
        class="form-control mb-3"
        rows="3"
        placeholder="Chia sẻ cảm nhận..."
      ></textarea>

      <div class="text-end">
        <button class="btn btn-secondary me-2" @click="$emit('close')">
          Hủy
        </button>
        <button class="btn btn-primary" @click="submit">
          Gửi đánh giá
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import reviewService from "@/services/reviewService";

const props = defineProps({
  productId: { type: Number, required: true }
});

const emit = defineEmits(["close", "submitted"]);

const rating = ref(0);
const comment = ref("");
const alert = ref("");

async function submit() {
  alert.value = "";

  if (rating.value < 1) {
    alert.value = "Bạn phải chọn số sao!";
    return;
  }

  if (comment.value.length < 10) {
    alert.value = "Nội dung phải từ 10 ký tự!";
    return;
  }

  try {
    await reviewService.createReview({
      productId: props.productId,
      rating: rating.value,
      comment: comment.value
    });

    emit("submitted");
  } catch (err) {
    alert.value = err?.error || "Gửi đánh giá thất bại!";
  }
}
</script>
