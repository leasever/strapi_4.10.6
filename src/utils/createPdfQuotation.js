const PDFDocument = require("pdfkit");

const currentDate = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

let totalBalance = 0;
let totalProductsNoSize = 0;
let totalProductsNoSizeUnit = 0;
let totalSizes = 0;
let totalSizesUnit = 0;
let totalProducts = 0;

async function createPdfQuotation(data, quotationNumber) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      generateHeader(doc);
      generateCustomerInformation(doc, data, quotationNumber);
      generateQuotationTable(doc, data);
      generateSummaryPage(doc, data);
      generateFooter(doc);
      const chunks = [];
      doc.on("data", (chunk) => {
        chunks.push(chunk);
      });
      doc.on("end", () => {
        const fileContent = Buffer.concat(chunks);
        resolve(fileContent);
      });
      doc.on("error", (error) => {
        console.error("Error creating quotation:", error);
        reject(error);
      });
      doc.end();
    } catch (error) {
      console.error("Error creating quotation:", error);
      reject(error);
    }
  });
}

function generateHeader(doc) {
  doc
    .image("public/logo.jpg", 50, 45, { width: 150 })
    .fillColor("#444444")
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("RUC:     20603425627", 330, 62)
    .text("Cel:       948125398", 330, 78)
    .text("Correo: consorcio.electrica.sac@gmail.com", 330, 94)
    .moveDown();
}

function generateCustomerInformation(doc, data, quotationNumber) {
  const { name, email, phone } = data;
  const customerInformationTop = 180;

  doc.fillColor("#444444").fontSize(20).text("Cotización", 50, 140);
  generateHr(doc, 165);

  doc
    .fontSize(10)
    .text("Número:", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text(quotationNumber, 120, customerInformationTop)
    .font("Helvetica")
    .text("Fecha:", 50, customerInformationTop + 15)
    .text(currentDate, 120, customerInformationTop + 15)
    .font("Helvetica-Bold")
    .text(name, 300, customerInformationTop)
    .font("Helvetica")
    .text(email, 300, customerInformationTop + 15)
    .text(phone, 300, customerInformationTop + 30)
    .moveDown();

  generateHr(doc, 232);
}

function generateQuotationTable(doc, data) {
  const QuotationTableTop = 280;
  const columnWidths = [258, 80, 43, 50, 56.28];
  const padding = 0;
  const maxTableHeight = 720;
  let y = QuotationTableTop + 25;
  let total = 0;

  generateHeaderTable(doc, QuotationTableTop, 0);
  generateHr(doc, QuotationTableTop + 15);
  doc.font("Helvetica");
  doc.fontSize(10);
  const lineHeight = doc.heightOfString("A", { lineBreak: false });

  for (const product of data.products) {
    const { name, quantity, size, quotation_price } = product;
    const productNameHeight = doc.heightOfString(name, {
      width: columnWidths[0],
    });
    const productNameRows = Math.ceil(productNameHeight / lineHeight);

    if (size && size.length > 0) {
      let isFirstSize = true;
      const sizeCount = size.length;

      for (const sizeItem of size) {
        const { val, quantity: sizeQuantity, quotation_price } = sizeItem;
        const productName = isFirstSize ? name : "";
        const priceUnit = quotation_price || 0;
        const subtotal = sizeQuantity * priceUnit;

        if (y + padding + lineHeight > maxTableHeight) {
          doc.addPage();
          generateHeaderTable(doc, QuotationTableTop, -225);
          generateHr(doc, QuotationTableTop - 210);
          y = QuotationTableTop - 205;
        }

        generateTableRow(
          doc,
          y,
          productName,
          val,
          sizeQuantity,
          priceUnit,
          subtotal
        );
        if (sizeCount < 2) {
          y += lineHeight * productNameRows;
        } else {
          y += lineHeight;
        }

        isFirstSize = false;
        total += subtotal;
        totalSizesUnit += sizeQuantity;
      }

      totalSizes += sizeCount;
    } else {
      const quotationPrice = quotation_price || 0;
      const subtotal = quantity * quotationPrice;

      generateTableRow(doc, y, name, "", quantity, quotationPrice, subtotal);

      y += lineHeight * productNameRows;
      total += subtotal;
      totalProductsNoSize++;
      totalProductsNoSizeUnit += quantity;
    }

    totalProducts++;
    y += lineHeight;
    generateHr(doc, y - lineHeight / 2);
    y += lineHeight / 2;
  }

  totalBalance = total;
  return total;
}

function generateTableRow(doc, y, item, size, quantity, unitPrice, subtotal) {
  const columnPositions = [50, 310, 394, 440, 489];
  const columnWidths = [258, 80, 43, 50, 56.28];
  const fontSize = 9;

  doc
    .fontSize(fontSize)
    .text(item, columnPositions[0], y, {
      width: columnWidths[0],
      align: "left",
    })
    .text(size, columnPositions[1], y, {
      width: columnWidths[1],
      align: "right",
    })
    .text(quantity.toString(), columnPositions[2], y, {
      width: columnWidths[2],
      align: "right",
    });

  if (typeof unitPrice === "number") {
    doc.text(unitPrice.toFixed(2), columnPositions[3], y, {
      width: columnWidths[3],
      align: "right",
    });
  } else {
    doc.text(unitPrice, columnPositions[3], y, {
      width: columnWidths[3],
      align: "right",
    });
  }

  if (typeof subtotal === "number") {
    doc.text(subtotal.toFixed(2), columnPositions[4], y, {
      width: columnWidths[4],
      align: "right",
    });
  } else {
    doc.text(subtotal, columnPositions[4], y, {
      width: columnWidths[4],
      align: "right",
    });
  }
}

function generateSummaryPage(doc, data) {
  doc.addPage();
  doc.fillColor("#444444").fontSize(15).text("Resumen", 50, 50);
  const totalProducts = data.products.length;
  const totalProductWithSizes = data.products.filter(
    (product) => product.size && product.size.length > 0
  ).length;
  const totalProductNoSize = data.products.filter(
    (product) => product.size && product.size.length <= 0
  ).length;
  let totalUnitProducts = totalSizesUnit + totalProductsNoSizeUnit;
  const startY = 80;
  const lineSpacing = 20;

  doc
    .fontSize(12)
    .text("Marcas:", 50, startY)
    .text(totalProducts.toString(), 202, startY);

  generateHr(doc, startY + 15);

  doc
    .text("Marcas con Medidas:", 50, startY + lineSpacing)
    .text(totalProductWithSizes.toString(), 202, startY + lineSpacing)
    .text("Total de Medidas:", 257, startY + lineSpacing)
    .text(totalSizes.toString(), 360, startY + lineSpacing)
    .text("Total de Unidades:", 400, startY + lineSpacing)
    .text(totalSizesUnit.toString(), 505, startY + lineSpacing);

  generateHr(doc, startY + lineSpacing + 15);

  doc
    .text("Marcas sin Medidas:", 50, startY + 2 * lineSpacing)
    .text(totalProductNoSize.toString(), 202, startY + 2 * lineSpacing)
    .text("Total de Unidades:", 257, startY + 2 * lineSpacing)
    .text(totalProductsNoSizeUnit.toString(), 360, startY + 2 * lineSpacing);

  generateHr(doc, startY + 2 * lineSpacing + 15);

  doc
    .text("Balance Total de Unidades:", 50, startY + 3 * lineSpacing)
    .text(totalUnitProducts.toString(), 202, startY + 3 * lineSpacing);

  generateHr(doc, startY + 3 * lineSpacing + 15);

  doc
    .text("Balance Total:", 50, startY + 4 * lineSpacing)
    .text("$" + totalBalance.toFixed(2), 202, startY + 4 * lineSpacing);

  totalSizes = 0;
  totalSizesUnit = 0;
  totalUnitProducts = 0;
  totalProductsNoSizeUnit = 0;
  totalBalance = 0;
}

function generateFooter(doc) {
  doc
    .fontSize(10)
    .text(
      "Consorcio Electrica SAC | C .José Manuel Pereyra 536 Urb.: Panamericana Norte | Lima, Lima - Los Olivos",
      50,
      780,
      { align: "center", width: 500 }
    );
}

function generateHr(doc, y) {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(545.28, y)
    .stroke();
}

function generateHeaderTable(doc, QuotationTableTop, sep) {
  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    QuotationTableTop + sep,
    "Producto",
    "Tamaño",
    "Cantidad",
    "Unit Price",
    "Subtotal"
  );
  doc.font("Helvetica");
  doc.fillColor("#444444");
}

module.exports = {
  createPdfQuotation,
};
