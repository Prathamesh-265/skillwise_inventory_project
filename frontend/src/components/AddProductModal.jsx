import React, { useState, useEffect } from "react";

export function AddProductModal({ open, onClose, showToast }) {
  const initial = {
    name: "",
    unit: "",
    category: "",
    brand: "",
    stock: 0,
    image: ""
  };
  const [form, setForm] = useState(initial);

  useEffect(() => {
    if (open) setForm(initial);
  }, [open]);

  if (!open) return null;

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast("Add product endpoint not implemented (UI only).", "error");
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add New Product</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>Unit *</label>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => handleChange("unit", e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>Category *</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>Brand *</label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => handleChange("brand", e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>Stock</label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => handleChange("stock", e.target.value)}
            />
          </div>
          
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 12
            }}
          >
            <button
              type="button"
              className="secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
