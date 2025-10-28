const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const sequelize = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const companyRoutes = require("./routes/companyRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000", // or wherever your frontend is hosted
    credentials: true,
  })
);

// 👇 Add this line
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Middlewares
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/invoices", invoiceRoutes);

// Sync DB
sequelize
  .sync({ alter: true })
  .then(() => console.log("✅ Models synced"))
  .catch((err) => console.error("❌ Sync error:", err));

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));