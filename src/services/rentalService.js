import axios from "axios";

const API_URL = "https://localhost:44303/api/DailyRentals";

function authHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export default {
  // ===========================================================
  //  LẤY DANH SÁCH ĐƠN CỦA NGƯỜI ĐANG ĐĂNG NHẬP (GET /user)
  // ===========================================================
  async getMyRentals() {
    const res = await axios.get(`${API_URL}/user`, {
      headers: authHeader(),
    });
    return res.data; // List<RentalDto>
  },

  // ===========================================================
  //  ADMIN: LẤY DANH SÁCH ĐƠN CỦA 1 USER CỤ THỂ
  //  GET /api/DailyRentals/user/{userId}
  // ===========================================================
  async getUserRentals(userId) {
    const res = await axios.get(`${API_URL}/user/${userId}`, {
      headers: authHeader(),
    });
    return res.data; // List<RentalDto>
  },

  // ===========================================================
  //  LẤY CHI TIẾT ĐƠN THUÊ (GET /{id})
  // ===========================================================
  async getRentalById(rentalId) {
    const res = await axios.get(`${API_URL}/${rentalId}`, {
      headers: authHeader(),
    });
    return res.data; // RentalDto
  },

  // ===========================================================
  //  TẠO ĐƠN THUÊ (POST /)
  // ===========================================================
  async createRental(createDto) {
    const res = await axios.post(API_URL, createDto, {
      headers: authHeader(),
    });
    return res.data; // CreateDailyRentalResponseDto
  },

  // ===========================================================
  //  CẬP NHẬT NGÀY THUÊ (PUT /{id}/dates)
  // ===========================================================
  async updateRentalDates(rentalId, startDate, endDate) {
    const formatDate = (d) => {
      if (!d) return null;
      const dateObj = new Date(d);
      return dateObj.toISOString().split("T")[0]; // yyyy-MM-dd
    };

    const payload = {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    };

    const res = await axios.put(`${API_URL}/${rentalId}/dates`, payload, {
      headers: authHeader(),
    });

    return res.data; // trả về object { RentalId, NewStartDate, ... }
  },

  // ===========================================================
  //  KÍCH HOẠT ĐƠN (POST /{id}/activate)
  // ===========================================================
  async activateRental(rentalId) {
    await axios.post(`${API_URL}/${rentalId}/activate`, null, {
      headers: authHeader(),
    });
  },

  // ===========================================================
  //  QUYẾT TOÁN (POST /{id}/settle)
  // ===========================================================
  async settleRental(rentalId, settleDto) {
    const res = await axios.post(`${API_URL}/${rentalId}/settle`, settleDto, {
      headers: authHeader(),
    });
    return res.data; // object quyết toán trả về
  },

  // ===========================================================
  //  LẤY QUOTE TẠM TÍNH (POST /quote)
  // ===========================================================
  async getQuote(quoteDto) {
    const res = await axios.post(`${API_URL}/quote`, quoteDto, {
      headers: authHeader(),
    });
    return res.data; // QuoteDailyResponseDto
  },

  // ===========================================================
  //  ADMIN: LẤY TẤT CẢ ĐƠN (GET /admin/all)
  // ===========================================================
  async getAllRentals() {
    const res = await axios.get(`${API_URL}/admin/all`, {
      headers: authHeader(),
    });
    return res.data; // List<Rental>
  },
};
