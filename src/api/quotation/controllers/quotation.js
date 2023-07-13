const { createCoreController } = require("@strapi/strapi").factories;
const { createPdfQuotation } = require("../../../utils/createPdfQuotation.js");
const {
  generateQuotationNumber,
} = require("../../../utils/generateQuotationNumber.js");

const { deletePdf, postPdf } = require("../services/quotation.service.js");

module.exports = createCoreController(
  "api::quotation.quotation",
  ({ strapi }) => ({
    async create(ctx) {
      try {
        const { data } = ctx.request.body;
        const quotationNumber = await generateQuotationNumber();
        const fileContent = await createPdfQuotation(data, quotationNumber);

        const fileSizeInMB = fileContent.length / (1024 * 1024);
        if (fileSizeInMB > 5) {
          throw new Error(
            "El archivo PDF excede el tamaño máximo permitido de 5 MB"
          );
        }

        const uploadedFileData = await postPdf(fileContent, quotationNumber);

        const quotationData = {
          ...data,
          pdfVoucher: [uploadedFileData],
          status_quotation: {
            data: null,
          },
          code_quotation: quotationNumber,
        };

        const quotation = await strapi
          .service("api::quotation.quotation")
          .create({ data: quotationData });
        return { quotation };
      } catch (error) {
        ctx.response.status = 500;
        console.error("Error creating quotation:", error);
        return { error };
      }
    },

    async update(ctx) {
      try {
        const { id } = ctx.params;
        const { data } = ctx.request.body;
        const quotation = await strapi
          .service("api::quotation.quotation")
          .findOne(id, { populate: "*" });

        if (data.publishedAt === null) {
          const quotationDResponse = await strapi
            .service("api::quotation.quotation")
            .update(id, {
              data: { publishedAt: data.publishedAt },
            });
          return { data: quotationDResponse };
        }

        if (quotation.pdfVoucher && quotation.pdfVoucher.length > 0) {
          const pdfVoucherId = quotation.pdfVoucher[0].id;
          await deletePdf(pdfVoucherId);
        }

        const quotationNumber = quotation.code_quotation;
        const fileContent = await createPdfQuotation(data, quotationNumber);
        const fileSizeInMB = fileContent.length / (1024 * 1024);
        if (fileSizeInMB > 5) {
          throw new Error(
            "El archivo PDF excede el tamaño máximo permitido de 5 MB"
          );
        }

        const uploadedFileData = await postPdf(fileContent, quotationNumber);

        const quotationData = {
          ...data,
          pdfVoucher: [uploadedFileData],
        };
        const quotationDResponse = await strapi
          .service("api::quotation.quotation")
          .update(id, { data: quotationData });

        const quotationResponse = await strapi
          .service("api::quotation.quotation")
          .findOne(id, { populate: "*" });

        return { data: quotationResponse };
      } catch (error) {
        ctx.response.status = 500;
        console.error("Error updating quotation:", error);
        return { error };
      }
    },

    async delete(ctx) {
      try {
        const { id } = ctx.params;

        const quotation = await strapi
          .service("api::quotation.quotation")
          .findOne(id, { populate: "*" });

        if (quotation.pdfVoucher && quotation.pdfVoucher.length > 0) {
          const pdfVoucherId = quotation.pdfVoucher[0].id;
          await deletePdf(pdfVoucherId);
        }

        await strapi.service("api::quotation.quotation").delete(id);

        return { message: "Quotation deleted successfully" };
      } catch (error) {
        ctx.response.status = 500;
        console.error("Error deleting quotation:", error);
        return { error };
      }
    },
  })
);
