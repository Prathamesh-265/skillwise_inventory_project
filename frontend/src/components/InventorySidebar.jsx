import React, { useEffect } from "react";

export function InventorySidebar({ product, history, onClose, loading }) {
  if (!product) return null;

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="sidebar-overlay" onClick={onClose}>
      <div className="sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="sidebar-header">
          <h3>Inventory History</h3>
          <button className="secondary" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="sidebar-body">
          <div className="sidebar-meta">
            <div style={{ fontWeight: 600 }}>{product.name}</div>
            <div className="sidebar-meta-line">
              {product.brand} • {product.category || "Uncategorized"}
            </div>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                gap: 6,
                flexWrap: "wrap"
              }}
            >
              <span className="badge-pill">Unit: {product.unit}</span>
              <span className="badge-pill">Current stock: {product.stock}</span>
            </div>
          </div>
          {loading ? (
            <div>
              <div className="sidebar-skeleton-block" style={{ width: "70%" }} />
              <div className="sidebar-skeleton-block" style={{ width: "50%" }} />
              <div className="sidebar-skeleton-block" style={{ width: "90%" }} />
              <div className="sidebar-skeleton-block" style={{ width: "60%" }} />
            </div>
          ) : history.length === 0 ? (
            <div className="loading-text">No inventory changes logged yet.</div>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Old</th>
                  <th>New</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>{new Date(h.timestamp).toLocaleDateString()}</td>
                    <td>{h.oldStock}</td>
                    <td>{h.newStock}</td>
                    <td>{h.changedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
