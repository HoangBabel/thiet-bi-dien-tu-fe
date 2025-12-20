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

      <button v-else-if="isReviewBanned" class="btn btn-outline-danger" disabled>
        🚫 Bạn đang bị cấm đánh giá
      </button>

      <button class="btn btn-outline-secondary" disabled v-else>
        🔒 Đăng nhập để đánh giá
      </button>
    </div>

    <!-- BAN WARNING -->
    <div v-if="banMessage" class="alert alert-warning small py-2">
      ⚠️ {{ banMessage }}
    </div>

    <!-- GLOBAL ERROR -->
    <div v-if="globalError" class="alert alert-danger small py-2">
      ❌ {{ globalError }}
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

    <!-- REVIEW MODAL -->
    <ReviewModal
      v-if="showReviewModal"
      :productId="productId"
      @close="closeReviewModal"
      @submitted="handleReviewSubmitted"
    />

    <!-- LIST -->
    <div v-if="reviews.data.length">
      <div
        v-for="rv in reviews.data"
        :key="rv.id"
        class="p-3 border rounded mb-3 bg-white shadow-sm"
      >
        <!-- HEADER -->
        <div class="d-flex align-items-center mb-1">
          <strong class="me-2">{{ rv.userName }}</strong>

          <span v-for="i in 5" :key="i">
            <i
              class="bi"
              :class="i <= rv.rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'"
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
          <div class="mb-1">
            <span
              v-for="i in 5"
              :key="i"
              @click="editContent.rating = i"
              style="cursor:pointer"
            >
              <i
                class="bi"
                :class="i <= editContent.rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'"
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

        <!-- ACTIONS -->
        <div
          class="mt-2 small d-flex gap-3"
          v-if="canShowActions(rv)"
        >
          <button
            class="btn btn-link btn-sm px-0"
            v-if="isLoggedIn && !isReviewBanned"
            @click="toggleReply(rv.id)"
          >
            💬 Phản hồi
          </button>

          <button
            class="btn btn-link btn-sm px-0 text-primary"
            v-if="canEdit(rv)"
            @click="startEdit(rv)"
          >
            ✏️ Sửa
          </button>

          <button
            class="btn btn-link btn-sm px-0 text-danger"
            v-if="canDelete(rv)"
            @click="deleteReview(rv.id)"
          >
            🗑️ Xóa
          </button>
        </div>

        <!-- REPLY FORM -->
        <div v-if="replyingTo === rv.id" class="mt-2">
          <textarea
            v-model="replyContent[rv.id]"
            class="form-control form-control-sm mb-2"
            rows="2"
            placeholder="Viết phản hồi..."
          ></textarea>

          <div v-if="replyErrors[rv.id]" class="text-danger small mb-1">
            {{ replyErrors[rv.id] }}
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
        <div v-if="rv.replies?.length" class="mt-3">
          <div
            v-for="rp in rv.replies"
            :key="rp.id"
            class="reply-item ps-3 ms-3 border-start mb-2"
          >
            <div class="d-flex justify-content-between">
              <div>
                <strong>{{ rp.userName }}:</strong>
                <span class="ms-1">{{ rp.comment }}</span>
              </div>

              <button
                v-if="canDeleteReply(rp)"
                class="btn btn-link btn-sm text-danger px-1"
                @click="deleteReply(rp.id)"
              >
                🗑️
              </button>
            </div>

            <div class="text-muted small">
              {{ formatDate(rp.createdAt) }}
              <button
                class="btn btn-link btn-sm px-1"
                v-if="isLoggedIn && !isReviewBanned"
                @click="toggleReplyToReply(rv.id, rp.userName)"
              >
                Trả lời
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p v-else class="text-muted fst-italic">
      Hiện chưa có đánh giá nào.
    </p>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import reviewService from "@/services/reviewService";
import ReviewModal from "./ReviewModal.vue";

const props = defineProps({ productId: Number });

const isLoggedIn = !!localStorage.getItem("token");

const rawUserId = localStorage.getItem("userId");
const currentUserId = rawUserId ? Number(rawUserId) : null;

const isAdmin = localStorage.getItem("role") === "Admin";

const reviews = ref({ data: [], total: 0, averageRating: 0 });

const showReviewModal = ref(false);
const isReviewBanned = ref(false);
const banMessage = ref("");
const globalError = ref("");

/* REPLY */
const replyingTo = ref(null);
const replyContent = reactive({});
const replyErrors = reactive({});

/* EDIT */
const editingReviewId = ref(null);
const editContent = reactive({ rating: 0, comment: "" });
const editError = ref("");

function formatDate(d) {
  return new Date(d).toLocaleDateString("vi-VN");
}

/* ===== PERMISSION (SIẾT HOÀN TOÀN Ở UI) ===== */
function isOwner(userId) {
  return isLoggedIn && currentUserId !== null && userId === currentUserId;
}

function canEdit(rv) {
  return isOwner(rv.userId) || isAdmin;
}

function canDelete(rv) {
  return isOwner(rv.userId) || isAdmin;
}

function canDeleteReply(rp) {
  return isOwner(rp.userId) || isAdmin;
}

function canShowActions(rv) {
  return (
    (isLoggedIn && !isReviewBanned) ||
    canEdit(rv) ||
    canDelete(rv)
  );
}

/* LOAD */
async function loadReviews() {
  try {
    reviews.value = await reviewService.getProductReviews(props.productId);
  } catch {
    globalError.value = "Không thể tải đánh giá";
  }
}

async function checkBanStatus() {
  if (!isLoggedIn) return;
  try {
    const res = await reviewService.getBanStatus();
    isReviewBanned.value = res.isBanned;
    banMessage.value = res.isBanned
      ? `Bạn bị cấm đánh giá trong ${res.remainingSeconds} giây`
      : "";
  } catch {}
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
  replyErrors[id] = "";
  replyingTo.value = replyingTo.value === id ? null : id;
}
function toggleReplyToReply(reviewId, userName) {
  replyingTo.value = reviewId;
  replyContent[reviewId] = `@${userName} `;
}
function cancelReply() {
  replyingTo.value = null;
}
async function submitReply(id) {
  try {
    await reviewService.replyReview(id, { comment: replyContent[id] });
    replyContent[id] = "";
    replyingTo.value = null;
    await loadReviews();
  } catch (e) {
    replyErrors[id] = e?.detail || "Không thể gửi phản hồi";
  }
}
async function deleteReply(id) {
  if (!confirm("Xóa phản hồi này?")) return;
  try {
    await reviewService.deleteReply(id);
    await loadReviews();
  } catch {
    globalError.value = "Xóa phản hồi thất bại";
  }
}

/* EDIT (CHỐNG GỌI TRỰC TIẾP BẰNG DEVTOOLS) */
function startEdit(rv) {
  if (!canEdit(rv)) return;

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
  try {
    await reviewService.updateReview(id, editContent);
    editingReviewId.value = null;
    await loadReviews();
  } catch (e) {
    editError.value = e?.detail || "Không thể cập nhật đánh giá";
  }
}

async function deleteReview(id) {
  const rv = reviews.value.data.find(r => r.id === id);
  if (!rv || !canDelete(rv)) return;

  if (!confirm("Xóa đánh giá này?")) return;

  try {
    await reviewService.deleteReview(id);
    await loadReviews();
  } catch {
    globalError.value = "Xóa đánh giá thất bại";
  }
}

onMounted(async () => {
  await loadReviews();
  await checkBanStatus();
});
</script>

<style scoped>
.reply-item {
  background: #fafafa;
  border-radius: 4px;
}
</style>
