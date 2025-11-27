import axios from "axios";

const API_URL = "https://localhost:44303/api/DailyRentals";

function authHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export default {
  // ============================
  //  LẤY DANH SÁCH ĐƠN NGƯỜI DÙNG
  // ============================
  async getUserRentals(userId) {
    const res = await axios.get(`${API_URL}/user/${userId}`, {
      headers: authHeader(),
    });
    // Trả về array RentalDto
    return res.data; 
  },

  // ============================
  //  LẤY CHI TIẾT ĐƠN
  // ============================
  async getRentalById(rentalId) {
    const res = await axios.get(`${API_URL}/${rentalId}`, {
      headers: authHeader(),
    });
    // Trả về RentalDto
    return res.data;
  },

  // ============================
  //  TẠO ĐƠN THUÊ
  // ============================
  async createRental(createDto) {
    const res = await axios.post(API_URL, createDto, {
      headers: authHeader(),
    });
    // Trả về CreateDailyRentalResponseDto
    return res.data;
  },

  // ===========================================================
  //  🔄 CẬP NHẬT NGÀY THUÊ — PUT /api/DailyRentals/{id}/dates
  // ===========================================================
  async updateRentalDates(rentalId, startDate, endDate) {
    const formatDate = (d) => {
      if (!d) return null;
      const dateObj = new Date(d);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dd = String(dateObj.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const payload = {
      StartDate: formatDate(startDate),
      EndDate: formatDate(endDate),
    };

    const res = await axios.put(`${API_URL}/${rentalId}/dates`, payload, {
      headers: authHeader(),
    });

    return res.data;
  },

  // ============================
  //  KÍCH HOẠT ĐƠN
  // ============================
  async activateRental(rentalId) {
    await axios.post(`${API_URL}/${rentalId}/activate`, null, {
      headers: authHeader(),
    });
  },

  // ============================
  //  QUYẾT TOÁN
  // ============================
  async settleRental(rentalId, settleDto) {
    const res = await axios.post(`${API_URL}/${rentalId}/settle`, settleDto, {
      headers: authHeader(),
    });
    return res.data;
  },

  // ============================
  //  QUOTE GIÁ TRƯỚC
  // ============================
  async getQuote(quoteDto) {
    const res = await axios.post(`${API_URL}/quote`, quoteDto, {
      headers: authHeader(),
    });
    return res.data;
  },

  // ============================
  //  LẤY TẤT CẢ ĐƠN ADMIN
  // ============================
  async getAllRentals() {
    const res = await axios.get(`${API_URL}/admin/all`, {
      headers: authHeader(),
    });
    return res.data; // array RentalDto
  },
};
