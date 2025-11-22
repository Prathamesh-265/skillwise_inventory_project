import React, { useEffect, useMemo, useState } from "react";
import {
  getProducts,
  updateProduct,
  deleteProduct,
  importCsv,
  exportCsv,
  getHistory
} from "./api/productsApi";
import { useToast } from "./components/useToast";
import { ProductsTable } from "./components/ProductsTable";
import { InventorySidebar } from "./components/InventorySidebar";
import { AddProductModal } from "./components/AddProductModal";

function App() {
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { showToast, ToastContainer } = useToast();

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts(searchText);
      setProducts(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ["All", ...Array.from(cats)];
  }, [products]);

  const filteredProducts =
    categoryFilter === "All"
      ? products
      : products.filter((p) => p.category === categoryFilter);

  const handleImportChange = async (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    try {
      const result = await importCsv(file);
      showToast(
        `Import complete. Added: ${result.data.added}, Skipped: ${result.data.skipped}`,
        "success"
      );
      await loadProducts();
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.error || err.message || "Import failed";
      showToast(message, "error");
    }
  };

  const handleExport = async () => {
    try {
      const res = await exportCsv();
      const blob = res.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "products.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.error || err.message || "Export failed";
      showToast(message, "error");
    }
  };

  const handleRowClick = async (product) => {
    setSelectedProduct(product);
    setHistory([]);
    setHistoryLoading(true);
    try {
      const data = await getHistory(product.id);
      setHistory(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load history", "error");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleUpdateProduct = async (id, payload) => {
    const previous = [...products];
    setProducts((items) =>
      items.map((p) => (p.id === id ? { ...p, ...payload } : p))
    );
    try {
      const updated = await updateProduct(id, payload);
      setProducts((items) => (items.map((p) => (p.id === id ? updated : p))));
      if (selectedProduct && selectedProduct.id === id) {
        setSelectedProduct(updated);
      }
    } catch (err) {
      setProducts(previous);
      throw err;
    }
  };

  const handleDeleteProduct = async (id) => {
    const previous = [...products];
    setDeletingId(id);
    setProducts((items) => items.filter((p) => p.id !== id));
    try {
      await deleteProduct(id);
      if (selectedProduct && selectedProduct.id === id) {
        setSelectedProduct(null);
        setHistory([]);
      }
      showToast("Product deleted", "success");
    } catch (err) {
      console.error(err);
      setProducts(previous);
      showToast("Failed to delete product", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const totalStock = useMemo(
    () => products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0),
    [products]
  );
  const inStockCount = useMemo(
    () => products.filter((p) => p.status === "In Stock").length,
    [products]
  );
  const outOfStockCount = useMemo(
    () => products.filter((p) => p.status === "Out of Stock").length,
    [products]
  );

  return (
    <div className="app-shell">
      <ToastContainer />
      <div className="app-container">
        <header className="app-header">
          <div className="brand-block">
            <div className="brand-title">
              <div className="brand-logo">PI</div>
              <div>
                <div className="brand-name">Product Inventory</div>
                <div className="brand-subtitle">
                  Centralized stock, CSV import/export, and audit history.
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-label">Products</div>
            <div className="kpi-value">{products.length}</div>
            <div className="kpi-subtext">
              {inStockCount} in stock • {outOfStockCount} out of stock
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Total Units</div>
            <div className="kpi-value">{totalStock}</div>
            <div className="kpi-subtext">Sum of stock across all items</div>
          </div>
        </div>

        <div className="controls-row">
          <div className="controls-left">
            <input
              type="text"
              placeholder="Search by product name…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All categories" : c}
                </option>
              ))}
            </select>
            <button onClick={() => setShowAddModal(true)}>
              + Add New Product
            </button>
          </div>
          <div className="controls-right">
            <label className="button-like">
              Import CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleImportChange}
              />
            </label>
            <button onClick={handleExport}>Export CSV</button>
          </div>
        </div>

        <div className="table-card">
          <div className="table-header-row">
            <span>Inventory</span>
            {loading && <span>Loading…</span>}
          </div>
          <div className="table-scroll">
            {loading ? (
              <div>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div className="skeleton-row" key={i}>
                    <div className="skeleton-block" />
                    <div className="skeleton-block" />
                    <div className="skeleton-block" />
                    <div className="skeleton-block" />
                    <div className="skeleton-block" />
                    <div className="skeleton-block" />
                    <div className="skeleton-block" />
                    <div className="skeleton-block" />
                  </div>
                ))}
              </div>
            ) : (
              <ProductsTable
                products={filteredProducts}
                onRowClick={handleRowClick}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                showToast={showToast}
                selectedId={selectedProduct?.id}
                deletingId={deletingId}
              />
            )}
          </div>
        </div>
      </div>

      <InventorySidebar
        product={selectedProduct}
        history={history}
        loading={historyLoading}
        onClose={() => setSelectedProduct(null)}
      />

      <AddProductModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        showToast={showToast}
      />
    </div>
  );
}

export default App;
