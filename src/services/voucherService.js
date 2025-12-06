import axios from "axios";

const API_URL = "https://localhost:44303/api/voucher";

// Lấy JWT token từ localStorage
function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const VoucherService = {
  /** ----------------------------------------
   * GET: api/voucher
   * Lấy danh sách voucher đang còn hạn
   * -----------------------------------------*/
  async getAll() {
    const response = await axios.get(API_URL, {
      headers: authHeader(),
    });
    return response.data;
  },

  /** ----------------------------------------
   * GET: api/voucher/{id}
   * Lấy chi tiết một voucher
   * -----------------------------------------*/
  async getById(id) {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: authHeader(),
    });
    return response.data;
  },

  /** ----------------------------------------
   * POST: api/voucher
   * Tạo một voucher mới (CreateVoucherDto)
   * -----------------------------------------*/
  async create(voucherDto) {
    const response = await axios.post(API_URL, voucherDto, {
      headers: authHeader(),
    });
    return response.data;
  },

  /** ----------------------------------------
   * PUT: api/voucher/{id}
   * Cập nhật voucher (UpdateVoucherDto)
   * -----------------------------------------*/
  async update(id, voucherDto) {
    const response = await axios.put(`${API_URL}/${id}`, voucherDto, {
      headers: authHeader(),
    });
    return response.data; // NoContent -> sẽ trả empty
  },

  /** ----------------------------------------
   * DELETE: api/voucher/{id}
   * Xóa voucher
   * -----------------------------------------*/
  async delete(id) {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: authHeader(),
    });
    return response.data; // NoContent -> empty
  },

  /** ----------------------------------------
   * POST: api/voucher/validate
   * Validate voucher (preview đơn hàng)
   * Body: { code, subtotalAmount, shippingFee }
   * -----------------------------------------*/
  async validate(code, subtotalAmount, shippingFee) {
    const body = {
      code,
      subtotalAmount,
      shippingFee,
    };

    const response = await axios.post(`${API_URL}/validate`, body, {
      headers: authHeader(),
    });

    return response.data; // VoucherValidationResponse
  },

  /** ----------------------------------------
   * POST: api/voucher/apply
   * Áp dụng voucher (checkout thực tế)
   * Body: { code, subtotalAmount, shippingFee }
   * -----------------------------------------*/
  async apply(code, subtotalAmount, shippingFee) {
    const body = {
      code,
      subtotalAmount,
      shippingFee,
    };

    const response = await axios.post(`${API_URL}/apply`, body, {
      headers: authHeader(),
    });

    return response.data; // VoucherApplicationResponse
  }
};

export default VoucherService;
