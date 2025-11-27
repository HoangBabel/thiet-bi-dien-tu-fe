import axios from "axios";

const API_URL = "https://localhost:5001/api/product"; // ⚙️ đổi theo backend thực tế

// 🟢 Lấy danh sách sản phẩm (có thể search, lọc theo danh mục)
export const getProducts = async (search = "", categoryId = 0) => {
  const params = {};
  if (search) params.search = search;
  if (categoryId > 0) params.categoryId = categoryId;

  const res = await axios.get(API_URL, { params });
  return res.data;
};

// 🟢 Lấy chi tiết sản phẩm theo ID
export const getProductById = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
};

// 🟠 Thêm sản phẩm mới (kèm ảnh)
export const addProduct = async (formData) => {
  // formData phải là FormData (multipart/form-data)
  const res = await axios.post(`${API_URL}/post`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// 🟣 Cập nhật sản phẩm (có thể đổi ảnh)
export const updateProduct = async (id, formData) => {
  const res = await axios.put(`${API_URL}/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.status === 204;
};

// 🔴 Xóa sản phẩm
export const deleteProduct = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.status === 204;
};
