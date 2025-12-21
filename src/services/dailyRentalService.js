import axios from "axios";

const API_URL = "http://localhost:5126/api/DailyRentals";

// ===========================================================
//  AUTH HEADER
// ===========================================================
function authHeader() {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
  };
}

export default {
  // ===========================================================
  //  USER: LẤY DANH SÁCH ĐƠN CỦA NGƯỜI ĐANG ĐĂNG NHẬP
  //  GET /api/DailyRentals/user
  // ===========================================================
  async getMyRentals() {
    const res = await axios.get(`${API_URL}/user`, {
      headers: authHeader(),
    });
    return res.data; // List<RentalDto>
  },

  // ===========================================================
  //  ADMIN: LẤY DANH SÁCH ĐƠN THEO USER ID
  //  GET /api/DailyRentals/user/{userId}
  // ===========================================================
  async getUserRentals(userId) {
    const res = await axios.get(`${API_URL}/user/${userId}`, {
      headers: authHeader(),
    });
    return res.data; // List<RentalDto>
  },

  // ===========================================================
  //  LẤY CHI TIẾT ĐƠN THUÊ
  //  GET /api/DailyRentals/{id}
  // ===========================================================
  async getRentalById(rentalId) {
    const res = await axios.get(`${API_URL}/${rentalId}`, {
      headers: authHeader(),
    });
    return res.data; // RentalDto
  },

  // ===========================================================
  //  TẠO ĐƠN THUÊ
  //  POST /api/DailyRentals
  // ===========================================================
  async createRental(createDto) {
    const res = await axios.post(API_URL, createDto, {
      headers: authHeader(),
    });
    return res.data; // CreateDailyRentalResponseDto
  },

  // ===========================================================
  //  CẬP NHẬT NGÀY THUÊ
  //  PUT /api/DailyRentals/{id}/dates
  // ===========================================================
  async updateRentalDates(rentalId, startDate, endDate) {
    const toIso = (d) => (d ? new Date(d).toISOString() : null);

    const payload = {
      startDate: toIso(startDate),
      endDate: toIso(endDate),
    };

    const res = await axios.put(
      `${API_URL}/${rentalId}/dates`,
      payload,
      { headers: authHeader() }
    );

    return res.data; 
    // { RentalId, NewStartDate, NewEndDate, NewTotal, NewDeposit }
  },

  // ===========================================================
  //  ADMIN: KÍCH HOẠT ĐƠN THUÊ
  //  POST /api/DailyRentals/{id}/activate
  // ===========================================================
  async activateRental(rentalId) {
    await axios.post(
      `${API_URL}/${rentalId}/activate`,
      null,
      { headers: authHeader() }
    );
  },

  // ===========================================================
  //  ADMIN: CẬP NHẬT TRẠNG THÁI ĐƠN THUÊ ⭐
  //  PUT /api/DailyRentals/admin/{id}/status
  // ===========================================================
  async updateRentalStatus(rentalId, status) {
    const payload = {
      status, // Pending | Paid | Active | Completed | Cancelled
    };

    const res = await axios.put(
      `${API_URL}/admin/${rentalId}/status`,
      payload,
      { headers: authHeader() }
    );

    return res.data; 
    // { RentalId, OldStatus, NewStatus }
  },

  // ===========================================================
  //  ADMIN: QUYẾT TOÁN ĐƠN THUÊ
  //  POST /api/DailyRentals/{id}/settle
  // ===========================================================
  async settleRental(rentalId, settleDto) {
    const res = await axios.post(
      `${API_URL}/${rentalId}/settle`,
      settleDto,
      { headers: authHeader() }
    );
    return res.data;
  },

  // ===========================================================
  //  LẤY QUOTE TẠM TÍNH
  //  POST /api/DailyRentals/quote
  // ===========================================================
  async getQuote(quoteDto) {
    const res = await axios.post(
      `${API_URL}/quote`,
      quoteDto,
      { headers: authHeader() }
    );
    return res.data; // QuoteDailyResponseDto
  },

  // ===========================================================
  //  ADMIN: LẤY TẤT CẢ ĐƠN THUÊ (FULL + USER INFO)
  //  GET /api/DailyRentals/admin/all
  // ===========================================================
  async getAllRentals() {
    const res = await axios.get(`${API_URL}/admin/all`, {
      headers: authHeader(),
    });
    return res.data; // List<AdminRentalDto>
  },

  // ===========================================================
  //  XÓA ĐƠN THUÊ (CHỈ USER SỞ HỮU)
  //  DELETE /api/DailyRentals/{id}
  // ===========================================================
  async deleteRental(rentalId) {
    const res = await axios.delete(
      `${API_URL}/${rentalId}`,
      { headers: authHeader() }
    );
    return res.data;
  },
};
