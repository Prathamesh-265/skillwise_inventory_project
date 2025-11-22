const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const db = require("./db");
const productRoutes = require("./routes/productRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

// ------------------------------
// API ROUTES MUST COME FIRST
// ------------------------------
app.use("/api/products", productRoutes);

// ------------------------------
// STATIC FRONTEND ROUTES
// ------------------------------
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// SPA fallback — but block /api/*
// so it does NOT override upload routes
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }
  res.sendFile(path.join(publicPath, "index.html"));
});

// ------------------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
