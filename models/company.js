const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./user");

const Company = sequelize.define("Company", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gstNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  bankName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  accountType: {
    type: DataTypes.ENUM("savings", "current"),
    allowNull: false,
  },
  accountNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ifscCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  accountHolderName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  branchName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
},{
    timestamps: true,
});

// 🔗 Relation
User.hasMany(Company, { foreignKey: "userId", onDelete: "CASCADE" });
Company.belongsTo(User, { foreignKey: "userId" });

module.exports = Company;