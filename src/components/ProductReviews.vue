<template>
  <div class="mt-5" v-if="reviews">
    <!-- HEADER -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="fw-semibold text-primary">
        ⭐ Đánh giá & Nhận xét ({{ reviews.total }})
      </h4>

      <button
        class="btn btn-outline-primary"
        v-if="isLoggedIn && !isReviewBanned"
        @click="openReviewModal"
      >
        <i class="bi bi-pencil-square me-1"></i> Viết đánh giá
      </button>

      <button
        class="btn btn-outline-danger"
        disabled
        v-else-if="isReviewBanned"
      >
        🚫 Bạn đang bị cấm đánh giá
      </button>

      <button class="btn btn-outline-secondary" disabled v-else>
        🔒 Đăng nhập để đánh giá
      </button>
    </div>

    <!-- AVERAGE -->
    <div class="mb-3" v-if="reviews.averageRating">
      <span class="fw-bold fs-5 text-warning">
        {{ reviews.averageRating.toFixed(1) }} / 5 ⭐
      </span>
      <p class="text-muted small mb-0">
        Dựa trên {{ reviews.total }} lượt đánh giá
      </p>
    </div>

    <!-- LIST -->
    <div v-if="reviews.data.length">
      <div
        v-for="rv in reviews.data"
        :key="rv.id"
        class="p-3 border rounded mb-3 bg-white shadow-sm"
      >
        <!-- REVIEW HEADER -->
        <div class="d-flex align-items-center mb-1">
          <strong class="me-2">{{ rv.userName || "Người dùng" }}</strong>

          <span v-for="i in 5" :key="i">
            <i
              class="bi"
              :class="i <= rv.rating
                ? 'bi-star-fill text-warning'
                : 'bi-star text-muted'"
            ></i>
          </span>

          <span class="text-muted small ms-2">
            {{ formatDate(rv.createdAt) }}
          </span>
        </div>

        <!-- COMMENT / EDIT -->
        <div v-if="editingReviewId !== rv.id">
          <p class="mb-1">{{ rv.comment }}</p>
        </div>

        <div v-else class="mt-2">
          <!-- EDIT RATING -->
          <div class="mb-1">
            <span
              v-for="i in 5"
              :key="i"
              @click="editContent.rating = i"
              style="cursor:pointer"
            >
              <i
                class="bi"
                :class="i <= editContent.rating
                  ? 'bi-star-fill text-warning'
                  : 'bi-star text-muted'"
              ></i>
            </span>
          </div>

          <textarea
            v-model="editContent.comment"
            class="form-control form-control-sm mb-2"
            rows="2"
          ></textarea>

          <div v-if="editError" class="text-danger small mb-1">
            {{ editError }}
          </div>

          <div class="text-end">
            <button class="btn btn-sm btn-secondary me-2" @click="cancelEdit">
              Hủy
            </button>
            <button class="btn btn-sm btn-primary" @click="submitEdit(rv.id)">
              Lưu
            </button>
          </div>
        </div>

        <!-- IMAGES -->
        <div v-if="rv.imageUrls?.length" class="d-flex gap-2 flex-wrap mt-2">
          <img
            v-for="(img, idx) in rv.imageUrls"
            :key="idx"
            :src="img"
            class="rounded border"
            style="width:70px;height:70px;object-fit:cover;cursor:pointer"
            @click="$emit('zoom', img)"
          />
        </div>

        <!-- ACTIONS -->
        <div class="mt-2 d-flex gap-3 small">
          <button
            v-if="isLoggedIn"
            class="btn btn-sm btn-link px-0"
            @click="toggleReply(rv.id)"
          >
            💬 Phản hồi
          </button>

          <template v-if="isAdmin">
            <button
              class="btn btn-sm btn-link text-primary px-0"
              @click="startEdit(rv)"
            >
              ✏️ Sửa
            </button>
            <button
              class="btn btn-sm btn-link text-danger px-0"
              @click="deleteReview(rv.id)"
            >
              🗑️ Xóa
            </button>
          </template>
        </div>

        <!-- REPLY FORM -->
        <div v-if="replyingTo === rv.id" class="mt-2">
          <textarea
            v-model="replyContent[rv.id]"
            class="form-control form-control-sm mb-2"
            rows="2"
            placeholder="Viết phản hồi..."
          ></textarea>

          <div v-if="replyError" class="text-danger small mb-1">
            {{ replyError }}
          </div>

          <div class="text-end">
            <button class="btn btn-sm btn-secondary me-2" @click="cancelReply">
              Hủy
            </button>
            <button class="btn btn-sm btn-primary" @click="submitReply(rv.id)">
              Gửi
            </button>
          </div>
        </div>

        <!-- REPLIES -->
        <div v-if="rv.replies?.length" class="mt-3 ps-3 border-start">
          <div v-for="rp in rv.replies" :key="rp.id" class="small mb-2">
            <strong>{{ rp.userName || "Người dùng" }}:</strong>
            <span class="ms-1">{{ rp.comment }}</span>
            <div class="text-muted small">
              {{ formatDate(rp.createdAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <p v-else class="text-muted fst-italic">
      Hiện chưa có đánh giá nào.
    </p>

    <!-- REVIEW MODAL -->
    <ReviewModal
      v-if="showReviewModal"
      :productId="productId"
      @close="closeReviewModal"
      @submitted="handleReviewSubmitted"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import reviewService from "@/services/reviewService";
import ReviewModal from "./ReviewModal.vue";

const props = defineProps({
  productId: { type: Number, required: true }
});

defineEmits(["zoom"]);

const isLoggedIn = !!localStorage.getItem("token");
const isAdmin = ref(localStorage.getItem("role") === "Admin");

const reviews = ref({
  data: [],
  total: 0,
  averageRating: 0
});

const showReviewModal = ref(false);
const isReviewBanned = ref(false);

/* REPLY STATE */
const replyingTo = ref(null);
const replyContent = reactive({});
const replyError = ref("");

/* EDIT STATE */
const editingReviewId = ref(null);
const editContent = reactive({ rating: 0, comment: "" });
const editError = ref("");

/* HELPERS */
function formatDate(d) {
  return new Date(d).toLocaleDateString("vi-VN");
}

/* LOAD */
async function loadReviews() {
  reviews.value = await reviewService.getProductReviews(props.productId);
}

async function checkBan() {
  if (!isLoggedIn) return;
  const res = await reviewService.getBanStatus();
  isReviewBanned.value = res.data.isBanned;
}

/* MODAL */
function openReviewModal() {
  showReviewModal.value = true;
}
function closeReviewModal() {
  showReviewModal.value = false;
}
async function handleReviewSubmitted() {
  await loadReviews();
  showReviewModal.value = false;
}

/* REPLY */
function toggleReply(id) {
  replyError.value = "";
  replyingTo.value = replyingTo.value === id ? null : id;
}
function cancelReply() {
  replyingTo.value = null;
  replyError.value = "";
}
async function submitReply(id) {
  const c = replyContent[id]?.trim();
  if (!c || c.length < 3) {
    replyError.value = "Nội dung phản hồi quá ngắn";
    return;
  }
  await reviewService.replyReview(id, { comment: c });
  replyContent[id] = "";
  replyingTo.value = null;
  await loadReviews();
}

/* EDIT */
function startEdit(rv) {
  editingReviewId.value = rv.id;
  editContent.rating = rv.rating;
  editContent.comment = rv.comment;
  editError.value = "";
}
function cancelEdit() {
  editingReviewId.value = null;
  editError.value = "";
}
async function submitEdit(id) {
  if (editContent.rating < 1 || editContent.comment.length < 5) {
    editError.value = "Dữ liệu không hợp lệ";
    return;
  }
  await reviewService.updateReview(id, editContent);
  editingReviewId.value = null;
  await loadReviews();
}
async function deleteReview(id) {
  if (!confirm("Xóa đánh giá này?")) return;
  await reviewService.deleteReview(id);
  await loadReviews();
}

onMounted(async () => {
  await loadReviews();
  await checkBan();
});
</script>
