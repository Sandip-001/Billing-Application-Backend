const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./user");
const Company = require("./company");

const Invoice = sequelize.define("Invoice", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  invoiceType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  invoiceDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  clientName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  clientAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  clientGstNo: {
    type: DataTypes.STRING,
  },
  clientType:{
    type: DataTypes.ENUM("Indian","Overseas"),
    allowNull: false,
  },
  terms: {
    type: DataTypes.TEXT,
  },
  notes: {
    type: DataTypes.TEXT,
  },
  subTotal:{
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
  },
  total:{
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
  },
  totalAsPerIndianRupee:{
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "paid"),
    defaultValue: "pending",
  },
  items: {
    type: DataTypes.JSONB, // store array of items
    allowNull: false,
  },
});

User.hasMany(Invoice, { foreignKey: "userId" });
Company.hasMany(Invoice, { foreignKey: "companyId" });
Invoice.belongsTo(User, { foreignKey: "userId" });
Invoice.belongsTo(Company, { foreignKey: "companyId" });

module.exports = Invoice;