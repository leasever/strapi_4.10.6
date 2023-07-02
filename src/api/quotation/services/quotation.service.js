"use strict";
const axios = require("axios");
const FormData = require("form-data");

async function deletePdf(pdfVoucherId) {
  const requestPdfCloudinary = {
    method: "DELETE",
    url: `${process.env.API_URL}/api/upload/files/${pdfVoucherId}`,
    headers: {
      Authorization: `Bearer ${process.env.CLIENT_API_TOKEN}`,
    },
  };

  try {
    const uploadDeleteResponse = await axios(requestPdfCloudinary);
    if (uploadDeleteResponse.status !== 200) {
      throw new Error("Error al eliminar el archivo");
    }
    return uploadDeleteResponse;
  } catch (error) {
    throw new Error("Error al eliminar el archivo");
  }
}

async function postPdf(fileContent, quotationNumber) {
  const formdata = new FormData();
  formdata.append("files", fileContent, `${quotationNumber}.pdf`);
  const requestOptions = {
    method: "post",
    url: `${process.env.API_URL}/api/upload`,
    headers: {
      Authorization: `Bearer ${process.env.CLIENT_API_TOKEN}`,
      ...formdata.getHeaders(),
    },
    data: formdata,
  };

  const uploadResponse = await axios(requestOptions);

  if (uploadResponse.status !== 200) {
    throw new Error("Error al subir el archivo");
  }
  return uploadResponse.data[0];
}

module.exports = { deletePdf, postPdf };
