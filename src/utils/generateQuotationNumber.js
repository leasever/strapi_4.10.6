async function generateQuotationNumber() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const day = currentDate.getDate().toString().padStart(2, "0");
  const randomNum = Math.floor(Math.random() * 1000);

  return `${year}${month}${day}-${randomNum}`;
}

module.exports = {
  generateQuotationNumber,
};
