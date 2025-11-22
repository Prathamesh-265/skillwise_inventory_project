import axios from "axios";

const api = axios.create({
  baseURL: window.location.origin   // FIXED 🔥
});

export const getProducts = (searchText) => {
  if (searchText) {
    return api
      .get("/api/products/search", { params: { name: searchText } })
      .then((res) => res.data);
  }
  return api.get("/api/products").then((res) => res.data);
};

export const updateProduct = (id, data) =>
  api.put(`/api/products/${id}`, data).then((res) => res.data);

export const deleteProduct = (id) =>
  api.delete(`/api/products/${id}`).then((res) => res.data);

export const importCsv = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/api/products/import", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const exportCsv = () =>
  api.get("/api/products/export", { responseType: "blob" });

export const getHistory = (id) =>
  api.get(`/api/products/${id}/history`).then((res) => res.data);
