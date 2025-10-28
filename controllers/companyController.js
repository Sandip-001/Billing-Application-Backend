const Company = require("../models/company");
const User = require("../models/user");
const path = require("path");
const fs = require("fs");

// ✅ Create a new company
const createCompany = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware

    // 🧩 1️⃣ Check if user exists in DB
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🧩 2️⃣ Extract fields
    const {
      companyName,
      gstNumber,
      address,
      bankName,
      accountType,
      accountNumber,
      ifscCode,
      accountHolderName,
      branchName,
    } = req.body;

    // 🧩 3️⃣ Validation for required fields
    if (
      !companyName ||
      !address ||
      !bankName ||
      !accountType ||
      !accountNumber ||
      !ifscCode ||
      !accountHolderName ||
      !branchName
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled" });
    }

    // 🧩 4️⃣ Handle logo upload
    let logoPath = null;
    if (req.file) {
      logoPath = `/uploads/logos/${req.file.filename}`;
    }

    // 🧩 5️⃣ Create the company
    const company = await Company.create({
      userId,
      companyName,
      gstNumber,
      address,
      bankName,
      accountType,
      accountNumber,
      ifscCode,
      accountHolderName,
      branchName,
      logo: logoPath,
    });

    res.status(201).json({ message: "Company created successfully", company });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get all companies for a particular user
const getUserCompanies = async (req, res) => {
  try {
    const userId = req.user.id;

    // 🧩 Check user existence
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const companies = await Company.findAll({ where: { userId } });
    res.json(companies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get single company by ID
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findByPk(id);

    if (!company) return res.status(404).json({ message: "Company not found" });
    if (company.userId !== req.user.id)
      return res.status(403).json({ message: "Unauthorized access" });

    res.json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update company
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findByPk(id);

    if (!company) return res.status(404).json({ message: "Company not found" });
    if (company.userId !== req.user.id)
      return res.status(403).json({ message: "Unauthorized access" });

    const updatedData = req.body;

    if (req.file) {
      if (company.logo) {
        const oldPath = path.join(__dirname, "../../", company.logo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updatedData.logo = `/uploads/logos/${req.file.filename}`;
    }

    if (req.file) {
      console.log("✅ Uploaded file:", req.file);
    } else {
      console.log("❌ No file received");
    }

    await company.update(updatedData);
    res.json({ message: "Company updated successfully", company });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Delete company
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findByPk(id);

    if (!company) return res.status(404).json({ message: "Company not found" });
    if (company.userId !== req.user.id)
      return res.status(403).json({ message: "Unauthorized access" });

    if (company.logo) {
      const logoPath = path.join(__dirname, "../../", company.logo);
      if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
    }

    await company.destroy();
    res.json({ message: "Company deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createCompany,
  getUserCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
};
