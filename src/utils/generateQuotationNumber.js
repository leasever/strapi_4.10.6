async function generateQuotationNumber() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const lastTwoDigits = year.toString().slice(-2);
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const day = currentDate.getDate().toString().padStart(2, "0");
  const randomNum = Math.floor(Math.random() * 1500);

  return `${day}${month}${lastTwoDigits}-${randomNum}`;
}

module.exports = {
  generateQuotationNumber,
};
