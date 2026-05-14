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

function createOrderPdfFile(pdfBlob) {
  const fileName = pdfBlob.getName() || '李伯伯糖葫蘆_訂單明細.pdf';
  const file = Drive.Files.insert(
    {
      title: fileName,
      mimeType: 'application/pdf',
      parents: [{ id: PDF_FOLDER_ID }]
    },
    pdfBlob,
    {
      supportsAllDrives: true
    }
  );

  Drive.Permissions.insert(
    {
      role: 'reader',
      type: 'anyone',
      value: ''
    },
    file.id,
    {
      supportsAllDrives: true
    }
  );

  return {
    id: file.id,
    url: `https://drive.google.com/uc?export=download&id=${file.id}`
  };
}

function trashOrderPdfFiles(orderNumber) {
  const escapedOrderNumber = escapeDriveQueryValue(orderNumber);
  const response = Drive.Files.list({
    q: `'${PDF_FOLDER_ID}' in parents and title contains '${escapedOrderNumber}' and mimeType = 'application/pdf' and trashed = false`,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true
  });

  (response.items || []).forEach(function(file) {
    Drive.Files.trash(file.id, { supportsAllDrives: true });
  });
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
