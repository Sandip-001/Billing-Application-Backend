const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  createCompany,
  getUserCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} = require("../controllers/companyController");
const authMiddleware = require("../middleware/authMiddleware");

// 📁 File upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/logos");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ Routes
router.post("/", authMiddleware, upload.single("logo"), createCompany);
router.get("/", authMiddleware, getUserCompanies);
router.get("/:id", authMiddleware, getCompanyById);
router.put("/:id", authMiddleware, upload.single("logo"), updateCompany);
router.delete("/:id", authMiddleware, deleteCompany);

module.exports = router;