// services/voucherService.js
import axios from "axios";

const API_URL = "https://localhost:44303/api/voucher";

export const getVouchers = () => axios.get(API_URL);
export const getVoucherById = (id) => axios.get(`${API_URL}/${id}`);
export const createVoucher = (data) => axios.post(API_URL, data);
export const updateVoucher = (id, data) => axios.put(`${API_URL}/${id}`, data);
export const deleteVoucher = (id) => axios.delete(`${API_URL}/${id}`);

export const applyVoucher = (code, amount, shippingFee = 0) =>
  axios.post(`${API_URL}/apply`, null, {
    params: { code, amount, shippingFee },
  });
