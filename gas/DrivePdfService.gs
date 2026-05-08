function findOrderPdfFile(data) {
  const url = data.pdfDownloadUrl || data.pdfUrl || "";
  const fileId = extractDriveFileId(url);
  if (fileId) {
    try {
      return DriveApp.getFileById(fileId);
    } catch (err) {
      Logger.log("PDF lookup by URL failed for " + fileId + ": " + err.toString());
    }
  }

  const folder = DriveApp.getFolderById(PDF_FOLDER_ID);
  const exactFileName = `李伯伯糖葫蘆_訂單明細_${data.orderNumber}.pdf`;
  const exactFiles = folder.searchFiles(`title = '${escapeDriveQueryValue(exactFileName)}'`);
  if (exactFiles.hasNext()) {
    return exactFiles.next();
  }

  const orderNumber = String(data.orderNumber || "").trim();
  if (!orderNumber) {
    return null;
  }

  const fuzzyFiles = folder.searchFiles(`title contains '${escapeDriveQueryValue(orderNumber)}' and mimeType = 'application/pdf'`);
  return fuzzyFiles.hasNext() ? fuzzyFiles.next() : null;
}

function extractDriveFileId(url) {
  if (!url) return "";
  const text = String(url);
  const ucMatch = text.match(/[?&]id=([^&]+)/);
  if (ucMatch) return decodeURIComponent(ucMatch[1]);

  const fileMatch = text.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) return decodeURIComponent(fileMatch[1]);

  return "";
}

function escapeDriveQueryValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
