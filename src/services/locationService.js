import axios from "axios";

const API_BASE = "http://localhost:5126/api";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const locationService = {
  async getProvinces() {
    try {
      const res = await axios.get(`${API_BASE}/location/province`, {
        headers: authHeader(),
      });
      return res.data.data || res.data; // GHN trả về { data: [...] } hoặc string
    } catch (err) {
      console.error("❌ Lỗi khi lấy provinces:", err.response?.data || err.message);
      throw err;
    }
  },

  async getDistricts(provinceId) {
    if (!provinceId) return [];
    try {
      const res = await axios.get(`${API_BASE}/location/districts`, {
        headers: authHeader(),
        params: { province_id: provinceId },
      });
      return res.data.data || res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy districts:", err.response?.data || err.message);
      throw err;
    }
  },

  async getWards(districtId) {
    if (!districtId) return [];
    try {
      const res = await axios.get(`${API_BASE}/location/wards`, {
        headers: authHeader(),
        params: { district_id: districtId },
      });
      return res.data.data || res.data;
    } catch (err) {
      console.error("❌ Lỗi khi lấy wards:", err.response?.data || err.message);
      throw err;
    }
  }
};

export default locationService;
