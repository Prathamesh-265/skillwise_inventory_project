import React, { useState } from "react";

export function ProductsTable({
  products,
  onRowClick,
  onUpdateProduct,
  onDeleteProduct,
  showToast,
  selectedId,
  deletingId
}) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  const startEdit = (product) => {
    setEditingId(product.id);
    setDraft(product);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({});
  };

  const handleChange = (field, value) => {
    setDraft((d) => ({ ...d, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...draft,
        stock: Number(draft.stock),
        status: Number(draft.stock) > 0 ? "In Stock" : "Out of Stock",
        changedBy: "admin@example.com"
      };
      await onUpdateProduct(editingId, payload);
      setEditingId(null);
      showToast("Product updated successfully", "success");
    } catch (err) {
      showToast(err.message || "Failed to update product", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!products.length) {
    return (
      <div className="empty-row">
        No products found. Try adjusting your search or import a CSV.
      </div>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          
          <th>Name</th>
          <th>Unit</th>
          <th>Category</th>
          <th>Brand</th>
          <th>Stock</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => {
          const isEditing = editingId === p.id;
          const isSelected = selectedId === p.id;
          const isDeleting = deletingId === p.id;

          return (
            <tr
              key={p.id}
              onClick={() => !isEditing && onRowClick(p)}
              style={{ cursor: isEditing ? "default" : "pointer" }}
              className={isSelected ? "row-selected" : ""}
            >
              
              <td>
                {isEditing ? (
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                ) : (
                  p.name
                )}
              </td>
              <td>
                {isEditing ? (
                  <input
                    type="text"
                    value={draft.unit}
                    onChange={(e) => handleChange("unit", e.target.value)}
                  />
                ) : (
                  p.unit
                )}
              </td>
              <td>
                {isEditing ? (
                  <input
                    type="text"
                    value={draft.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                  />
                ) : (
                  p.category
                )}
              </td>
              <td>
                {isEditing ? (
                  <input
                    type="text"
                    value={draft.brand}
                    onChange={(e) => handleChange("brand", e.target.value)}
                  />
                ) : (
                  p.brand
                )}
              </td>
              <td>
                {isEditing ? (
                  <input
                    type="number"
                    value={draft.stock}
                    onChange={(e) => handleChange("stock", e.target.value)}
                  />
                ) : (
                  p.stock
                )}
              </td>
              <td>
                {isEditing ? (
                  <select
                    value={draft.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                ) : (
                  <span
                    className={
                      "badge " + (p.status === "In Stock" ? "green" : "red")
                    }
                  >
                    <span
                      className={
                        "status-dot " +
                        (p.status === "In Stock" ? "green" : "red")
                      }
                    />
                    {p.status}
                  </span>
                )}
              </td>
              <td
                className="actions-cell"
                onClick={(e) => e.stopPropagation()}
              >
                {isEditing ? (
                  <React.Fragment>
                    <button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <>
                          Saving<span className="dots" />
                        </>
                      ) : (
                        "Save"
                      )}
                    </button>
                    <button
                      className="secondary"
                      onClick={cancelEdit}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <button
                      className="secondary"
                      onClick={() => startEdit(p)}
                      disabled={isDeleting}
                    >
                      Edit
                    </button>
                    <button
                      className="danger"
                      onClick={() => onDeleteProduct(p.id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          Deleting<span className="dots" />
                        </>
                      ) : (
                        "Delete"
                      )}
                    </button>
                  </React.Fragment>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
