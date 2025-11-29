import axios from "axios";

const API_URL = "https://localhost:44303/api/voucher"; // đổi theo backend thực tế

// Lấy JWT token từ localStorage
function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const VoucherService = {
  // Lấy danh sách voucher còn hiệu lực
  async getAll() {
    const res = await axios.get(API_URL, { headers: authHeader() });
    return res.data;
  },

  // Lấy chi tiết voucher theo ID
  async getById(id) {
    const res = await axios.get(`${API_URL}/${id}`, { headers: authHeader() });
    return res.data;
  },

  // Tạo voucher mới
  async create(voucherDto) {
    const res = await axios.post(API_URL, voucherDto, { headers: authHeader() });
    return res.data;
  },

  // Cập nhật voucher
  async update(id, voucherDto) {
    const res = await axios.put(`${API_URL}/${id}`, voucherDto, { headers: authHeader() });
    return res.data;
  },

  // Xóa voucher
  async delete(id) {
    const res = await axios.delete(`${API_URL}/${id}`, { headers: authHeader() });
    return res.data;
  },

  // Validate voucher (preview)
  async validate(code, subtotalAmount, shippingFee) {
    const res = await axios.post(
      `${API_URL}/validate`,
      { code, subtotalAmount, shippingFee },
      { headers: authHeader() }
    );
    return res.data;
  },

  // Apply voucher (checkout)
  async apply(code, subtotalAmount, shippingFee) {
    const res = await axios.post(
      `${API_URL}/apply`,
      { code, subtotalAmount, shippingFee },
      { headers: authHeader() }
    );
    return res.data;
  }
};

export default VoucherService;
