// src/routes/invoiceRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  createInvoice,
  getInvoicesByUser,
  getInvoicesByCompany,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  updateInvoiceItem,
  deleteInvoiceItem,
} = require("../controllers/invoiceController");

router.post("/", auth, createInvoice);
router.get("/user", auth, getInvoicesByUser);
router.get("/company/:companyId", auth, getInvoicesByCompany);
router.get("/:id", auth, getInvoiceById);
router.put("/:id", auth, updateInvoice);
router.delete("/:id", auth, deleteInvoice);
router.put("/:id/items/:itemId", auth, updateInvoiceItem);

// ✅ Delete a specific item from an invoice
router.delete("/:id/items/:itemId", auth, deleteInvoiceItem);

module.exports = router;