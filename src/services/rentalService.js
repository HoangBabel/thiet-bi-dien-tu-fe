import axios from "axios";

const API_URL = "https://localhost:44303/api/DailyRentals";

function authHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export default {
  // ============================
  //  LẤY DANH SÁCH ĐƠN NGƯỜI DÙNG (dựa trên token)
  // ============================
  async getMyRentals() {
    const res = await axios.get(`${API_URL}/user`, {
      headers: authHeader(),
    });
    // Backend trả về List<RentalDto>
    return res.data;
  },

  // ============================
  //  LẤY DANH SÁCH ĐƠN CỦA 1 USER CỤ THỂ (Admin)
  // ============================
  async getUserRentals(userId) {
    const res = await axios.get(`${API_URL}/user/${userId}`, {
      headers: authHeader(),
    });
    return res.data; 
  },

  // ============================
  //  LẤY CHI TIẾT ĐƠN THUÊ
  // ============================
  async getRentalById(rentalId) {
    const res = await axios.get(`${API_URL}/${rentalId}`, {
      headers: authHeader(),
    });
    return res.data; // trả về RentalDto
  },

  // ============================
  //  TẠO ĐƠN THUÊ
  // ============================
  async createRental(createDto) {
    const res = await axios.post(API_URL, createDto, {
      headers: authHeader(),
    });
    // trả về CreateDailyRentalResponseDto (có PaymentUrl, QrcodeUrl,…)
    return res.data;
  },

  // ===========================================================
  //  CẬP NHẬT NGÀY THUÊ
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
  //  QUYẾT TOÁN (Settle)
  // ============================
  async settleRental(rentalId, settleDto) {
    const res = await axios.post(`${API_URL}/${rentalId}/settle`, settleDto, {
      headers: authHeader(),
    });
    return res.data;
  },

  // ============================
  //  LẤY QUOTE GIÁ TẠM TÍNH
  // ============================
  async getQuote(quoteDto) {
    const res = await axios.post(`${API_URL}/quote`, quoteDto, {
      headers: authHeader(),
    });
    return res.data; // backend trả về DailyRentalQuoteDto
  },

  // ============================
  //  LẤY TẤT CẢ ĐƠN (Admin)
  // ============================
  async getAllRentals() {
    const res = await axios.get(`${API_URL}/admin/all`, {
      headers: authHeader(),
    });
    return res.data; // list RentalDto
  },
};
