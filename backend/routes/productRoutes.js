const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const db = require("../db");

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, "..", "uploads")
});

// Get all products
router.get("/", (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

// Search products by name
router.get("/search", (req, res) => {
  const { name } = req.query;
  const query = `%${(name || "").toLowerCase()}%`;

  db.all(
    "SELECT * FROM products WHERE LOWER(name) LIKE ?",
    [query],
    (err, rows) => {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(rows);
    }
  );
});

// Update product and log inventory changes
router.put("/:id", (req, res) => {
  const id = req.params.id;
  const { name, unit, category, brand, stock, status, changedBy } = req.body;

  if (
    !name ||
    !unit ||
    !category ||
    !brand ||
    stock === undefined ||
    stock === null ||
    !status
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const numericStock = Number(stock);
  if (isNaN(numericStock) || numericStock < 0) {
    return res
      .status(400)
      .json({ error: "Stock must be a non-negative number" });
  }

  // Check unique name (excluding current product)
  db.get(
    "SELECT id FROM products WHERE LOWER(name) = LOWER(?) AND id != ?",
    [name, id],
    (err, row) => {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      if (row) {
        return res
          .status(400)
          .json({ error: "Product name must be unique" });
      }

      db.get("SELECT * FROM products WHERE id = ?", [id], (err2, oldProduct) => {
        if (err2) {
          console.error("DB error:", err2);
          return res.status(500).json({ error: "Database error" });
        }
        if (!oldProduct) {
          return res.status(404).json({ error: "Product not found" });
        }

        const oldStock = Number(oldProduct.stock);

        db.run(
          `UPDATE products
           SET name = ?, unit = ?, category = ?, brand = ?, stock = ?, status = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [name, unit, category, brand, numericStock, status, id],
          function (err3) {
            if (err3) {
              console.error("DB error:", err3);
              return res.status(500).json({ error: "Database error" });
            }

            if (oldStock !== numericStock) {
              db.run(
                `INSERT INTO inventory_logs (productId, oldStock, newStock, changedBy)
                 VALUES (?, ?, ?, ?)`,
                [id, oldStock, numericStock, changedBy || "admin"],
                (err4) => {
                  if (err4) {
                    console.error("DB error (log insert):", err4);
                  }
                }
              );
            }

            db.get("SELECT * FROM products WHERE id = ?", [id], (err5, updated) => {
              if (err5) {
                console.error("DB error:", err5);
                return res.status(500).json({ error: "Database error" });
              }
              res.json(updated);
            });
          }
        );
      });
    }
  );
});

// Get inventory history for a product
router.get("/:id/history", (req, res) => {
  const id = req.params.id;
  db.all(
    "SELECT * FROM inventory_logs WHERE productId = ? ORDER BY timestamp DESC",
    [id],
    (err, rows) => {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(rows);
    }
  );
});

// CSV Import (no image column)
router.post("/import", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "CSV file is required" });
  }

  const filePath = req.file.path;
  const products = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      products.push(row);
    })
    .on("end", () => {
      let added = 0;
      let skipped = 0;
      const duplicates = [];

      const processNext = (index) => {
        if (index >= products.length) {
          fs.unlink(filePath, () => {});
          return res.json({ added, skipped, duplicates });
        }

        const { name, unit, category, brand, stock, status } = products[index];

        if (!name) {
          skipped++;
          return processNext(index + 1);
        }

        db.get(
          "SELECT id FROM products WHERE LOWER(name) = LOWER(?)",
          [name],
          (err, existing) => {
            if (err) {
              console.error("DB error:", err);
              fs.unlink(filePath, () => {});
              return res.status(500).json({ error: "Database error" });
            }

            if (existing) {
              skipped++;
              duplicates.push({ name, existingId: existing.id });
              return processNext(index + 1);
            }

            const numericStock = Number(stock) || 0;
            const finalStatus =
              status || (numericStock > 0 ? "In Stock" : "Out of Stock");

            db.run(
              `INSERT INTO products (name, unit, category, brand, stock, status)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                name,
                unit || "",
                category || "",
                brand || "",
                numericStock,
                finalStatus
              ],
              function (err2) {
                if (err2) {
                  console.error("DB error (insert):", err2);
                  skipped++;
                } else {
                  added++;
                }
                processNext(index + 1);
              }
            );
          }
        );
      };

      processNext(0);
    })
    .on("error", (err) => {
      console.error("CSV parse error:", err);
      fs.unlink(filePath, () => {});
      return res.status(500).json({ error: "CSV parse error" });
    });
});

// CSV Export (no image column)
router.get("/export", (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const header =
      "id,name,unit,category,brand,stock,status,created_at,updated_at\n";
    const csvLines = rows.map((p) => {
      const escape = (value) => {
        if (value === null || value === undefined) return "";
        const str = String(value).replace(/"/g, '""');
        return `"${str}"`;
      };
      return [
        p.id,
        escape(p.name),
        escape(p.unit),
        escape(p.category),
        escape(p.brand),
        p.stock,
        escape(p.status),
        escape(p.created_at),
        escape(p.updated_at)
      ].join(",");
    });

    const csvContent = header + csvLines.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="products.csv"'
    );
    res.send(csvContent);
  });
});

// Delete product
router.delete("/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM products WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    return res.json({ success: true });
  });
});

module.exports = router;
