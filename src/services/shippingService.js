// services/shippingService.js
import axios from "axios";

const API_BASE = "https://localhost:44303/api"; // base URL backend

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const GHN_SERVICES = [
  { id: 53320, name: "GHN Express" },
  { id: 53321, name: "GHN Tiết Kiệm" },
  { id: 53322, name: "GHN Chuẩn" }
];

const shippingService = {
  /**
   * 1️⃣ Tính phí vận chuyển cho một service hoặc tất cả 3 dịch vụ
   * @param {Object} payload
   * @param {number} payload.to_district_id
   * @param {string} payload.to_ward_code
   * @param {number} [payload.service_id] - nếu không truyền, trả về cả 3 dịch vụ
   * @param {number} [payload.weight=200]
   * @param {number} [payload.length=20]
   * @param {number} [payload.width=20]
   * @param {number} [payload.height=20]
   * @param {number} [payload.from_district_id] - optional, mặc định backend
   * @param {string} [payload.from_ward_code] - optional, mặc định backend
   * @returns {Promise<Array<{service_id:number, service_type:string, shipping_fee:number}>>}
   */
  async calculateShipping(payload) {
    const servicesToCalculate = payload.service_id
      ? GHN_SERVICES.filter(s => s.id === payload.service_id)
      : GHN_SERVICES;

    const results = [];

    for (const service of servicesToCalculate) {
      try {
        const res = await axios.get(`${API_BASE}/ShipingFee/calculate`, {
          headers: authHeader(),
          params: {
            from_district_id: payload.from_district_id,
            from_ward_code: payload.from_ward_code,
            to_district_id: payload.to_district_id,
            to_ward_code: payload.to_ward_code,
            service_id: service.id,
            weight: payload.weight || 200,
            length: payload.length || 20,
            width: payload.width || 20,
            height: payload.height || 20
          }
        });

        results.push({
          service_id: service.id,
          service_type: service.name,
          shipping_fee: res.data.shipping_fee || 0
        });
      } catch (err) {
        console.error(`❌ Lỗi khi tính phí dịch vụ ${service.name}:`, err.response?.data || err.message);
        results.push({
          service_id: service.id,
          service_type: service.name,
          shipping_fee: 0
        });
      }
    }

    return results;
  },

  /**
   * 2️⃣ Lấy địa chỉ kho/shop mặc định
   */
  async getDefaultLocation() {
    try {
      const res = await axios.get(`${API_BASE}/ShipingFee/default-location`, {
        headers: authHeader()
      });
      return res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy địa chỉ kho mặc định:", err.response?.data || err.message);
      throw err;
    }
  }
};

export default shippingService;
