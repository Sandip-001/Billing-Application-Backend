const Invoice = require("../models/invoice");
const User = require("../models/user");
const Company = require("../models/company");
const { generateInvoiceNumber } = require("../utils/helper");
const { Sequelize } = require("sequelize");
const axios = require("axios");

// 🧮 Utility: Get USD to INR exchange rate
const getUsdToInrRate = async () => {
  try {
    const res = await axios.get(
      "https://api.exchangerate-api.com/v4/latest/USD"
    );
    return res.data.rates.INR || 83; // fallback default
  } catch (err) {
    console.error("Error fetching exchange rate:", err.message);
    return 83; // fallback value if API fails
  }
};

// ✅ Create Invoice
const createInvoice = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      companyId,
      invoiceType,
      invoiceDate,
      clientName,
      clientAddress,
      clientGstNo,
      clientType,
      terms,
      notes,
      subTotal,
      total,
      items,
    } = req.body;

    //console.log("🟢 Received payload:", req.body);

    // 🔍 Validate required fields
    if (
      !companyId ||
      !invoiceType ||
      !invoiceDate ||
      !clientName ||
      !clientAddress ||
      !clientType ||
      !subTotal ||
      !total ||
      !items
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    // Check user & company
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const company = await Company.findByPk(companyId);
    if (!company || company.userId !== userId)
      return res.status(400).json({ message: "Invalid company for this user" });

    // 🌎 Handle currency conversion
    let totalAsPerIndianRupee = total;
    if (clientType === "Overseas") {
      const usdToInr = await getUsdToInrRate();
      totalAsPerIndianRupee = (parseFloat(total) * usdToInr).toFixed(2);
    }

    const invoiceNumber = generateInvoiceNumber(company.companyName);

    const invoice = await Invoice.create({
      userId,
      companyId,
      invoiceNumber,
      invoiceType,
      invoiceDate,
      clientName,
      clientAddress,
      clientGstNo,
      clientType,
      terms,
      notes,
      subTotal,
      total,
      totalAsPerIndianRupee,
      items,
      status: "pending",
    });

    res.status(201).json({ message: "Invoice created successfully", invoice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get all invoices for a user (latest first + include company details)
const getInvoicesByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const invoices = await Invoice.findAll({
      where: { userId },
      include: [
        {
          model: Company,
          as: "Company", // optional alias
          attributes: [
            "id",
            "companyName",
            "gstNumber",
            "address",
            "bankName",
            "accountType",
            "accountNumber",
            "ifscCode",
            "accountHolderName",
            "branchName",
            "logo",
          ],
        },
      ],
      order: [["createdAt", "DESC"]], // latest first
    });

    res.json(invoices);
  } catch (err) {
    console.error("Error fetching invoices:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get all invoices for a company (latest first + include company details)
const getInvoicesByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const invoices = await Invoice.findAll({
      where: { companyId },
      include: [
        {
          model: Company,
          as: "Company", // optional alias
          attributes: [
            "id",
            "companyName",
            "gstNumber",
            "address",
            "bankName",
            "accountType",
            "accountNumber",
            "ifscCode",
            "accountHolderName",
            "branchName",
            "logo",
          ],
        },
      ],
      order: [["createdAt", "DESC"]], // latest first
    });

    res.json(invoices);
  } catch (err) {
    console.error("Error fetching company invoices:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get single invoice by ID (with company details)
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findByPk(id, {
      include: [
        {
          model: Company,
          as: "Company",
          attributes: [
            "id",
            "companyName",
            "gstNumber",
            "address",
            "bankName",
            "accountType",
            "accountNumber",
            "ifscCode",
            "accountHolderName",
            "branchName",
            "logo",
          ],
        },
      ],
    });

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.userId !== req.user.id)
      return res.status(403).json({ message: "Unauthorized user" });

    res.json(invoice);
  } catch (err) {
    console.error("Error fetching invoice by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.userId !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    const {
      invoiceType,
      invoiceDate,
      clientName,
      clientAddress,
      clientGstNo,
      clientType,
      terms,
      notes,
      subTotal,
      total,
      items: newItems,
      itemIdsToDelete = [], // Array of item IDs to remove
    } = req.body;

    const existingItems = invoice.items || [];

    // 1️⃣ Merge items: update existing, add new
    let mergedItems = [...existingItems];

    if (Array.isArray(newItems)) {
      newItems.forEach((item) => {
        const index = mergedItems.findIndex((i) => i.id === item.id);
        if (index >= 0) {
          // Update existing item
          mergedItems[index] = { ...mergedItems[index], ...item };
        } else {
          // Add new item
          mergedItems.push(item);
        }
      });
    }

    // 2️⃣ Remove items by ID if requested
    if (Array.isArray(itemIdsToDelete) && itemIdsToDelete.length > 0) {
      mergedItems = mergedItems.filter((item) => !itemIdsToDelete.includes(item.id));
    }

    // 3️⃣ Compute invoice status
    const invoiceStatus =
      mergedItems.length > 0 && mergedItems.every((item) => item.status === "paid")
        ? "paid"
        : "pending";

    // 4️⃣ Recalculate totalAsPerIndianRupee if needed
    let totalAsPerIndianRupee = invoice.totalAsPerIndianRupee;
    if (clientType || total) {
      if ((clientType || invoice.clientType) === "Overseas") {
        const usdToInr = await getUsdToInrRate();
        totalAsPerIndianRupee = (parseFloat(total || invoice.total) * usdToInr).toFixed(2);
      } else {
        totalAsPerIndianRupee = parseFloat(total || invoice.total).toFixed(2);
      }
    }

    // 5️⃣ Update invoice
    await invoice.update({
      invoiceType,
      invoiceDate,
      clientName,
      clientAddress,
      clientGstNo,
      clientType,
      terms,
      notes,
      subTotal,
      total,
      totalAsPerIndianRupee,
      items: mergedItems, // updated + new items, old ones kept, deleted removed
      status: invoiceStatus,
    });

    await invoice.reload(); // reload updated invoice

    res.json({ message: "Invoice updated successfully", invoice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// ✅ Delete Invoice
const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.userId !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    await invoice.destroy();
    res.json({ message: "Invoice deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update specific item status or details in an invoice
const updateInvoiceItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { currency, description, quantity, status, price } = req.body || {};

    // Fetch the invoice
    const invoice = await Invoice.findByPk(id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.userId !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    // Parse the JSONB field safely
    let itemsArray =
      typeof invoice.items === "string"
        ? JSON.parse(invoice.items)
        : Array.isArray(invoice.items)
        ? [...invoice.items]
        : [];

    const itemIndex = itemsArray.findIndex((i) => i.id == itemId);
    if (itemIndex === -1)
      return res.status(404).json({ message: "Item not found in invoice" });

    // Update only provided fields
    if (price !== undefined) itemsArray[itemIndex].price = Number(price);
    if (currency !== undefined) itemsArray[itemIndex].currency = currency;
    if (description !== undefined)
      itemsArray[itemIndex].description = description;
    if (quantity !== undefined)
      itemsArray[itemIndex].quantity = Number(quantity);
    if (status !== undefined) itemsArray[itemIndex].status = status;

    // Auto-update invoice status (if all items are paid)
    const allPaid = itemsArray.every((i) => i.status === "paid");
    const newInvoiceStatus = allPaid ? "paid" : "pending";

    // ✅ Force raw SQL update for JSONB field
    const [result] = await Invoice.sequelize.query(
      `
      UPDATE "Invoices"
      SET items = :items,
          status = :status,
          "updatedAt" = NOW()
      WHERE id = :id
      RETURNING *;
      `,
      {
        replacements: {
          id,
          items: JSON.stringify(itemsArray),
          status: newInvoiceStatus,
        },
        type: Sequelize.QueryTypes.UPDATE,
      }
    );

    // Parse the updated invoice from the DB
    const updatedInvoice = result?.[0] || {};
    const updatedItems =
      typeof updatedInvoice.items === "string"
        ? JSON.parse(updatedInvoice.items)
        : updatedInvoice.items;

    const updatedItem = updatedItems?.find((i) => i.id == itemId);

    if (!updatedItem)
      return res.status(500).json({ message: "Item update failed" });

    return res.json({
      message: "Item updated successfully",
      updatedItem,
      invoiceStatus: updatedInvoice.status,
    });
  } catch (err) {
    console.error("🔥 Error updating invoice item:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Delete a specific item from an invoice
const deleteInvoiceItem = async (req, res) => {
  try {
    const { id, itemId } = req.params; // invoice id + item id

    const invoice = await Invoice.findByPk(id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.userId !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    let updatedItems = [...invoice.items];

    // Find index of the item to delete
    const itemIndex = updatedItems.findIndex((i) => i.id == itemId);
    if (itemIndex === -1)
      return res.status(404).json({ message: "Item not found in invoice" });

    // Remove item
    updatedItems.splice(itemIndex, 1);

    // Auto-update invoice status
    let newInvoiceStatus = "pending";
    if (
      updatedItems.length > 0 &&
      updatedItems.every((i) => i.status === "paid")
    ) {
      newInvoiceStatus = "paid";
    }

    // Update invoice
    await invoice.update({
      items: updatedItems,
      status: newInvoiceStatus,
    });

    res.json({
      message: "Item deleted successfully",
      remainingItems: updatedItems,
      invoiceStatus: newInvoiceStatus,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createInvoice,
  getInvoicesByUser,
  getInvoicesByCompany,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  updateInvoiceItem,
  deleteInvoiceItem,
};
