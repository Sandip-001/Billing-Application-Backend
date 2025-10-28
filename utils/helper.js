const generateInvoiceNumber = (companyName) => {
  const prefix = companyName
    .split(" ")
    .map((word) => word[0].toUpperCase())
    .join("")
    .slice(0, 3); // first 3 letters (like LTC for Leads TO Company)
  const randomNum = Math.floor(1000000000 + Math.random() * 9000000000); // 10-digit number
  return `${prefix}-${randomNum}`;
};

module.exports = {
  generateInvoiceNumber,
};