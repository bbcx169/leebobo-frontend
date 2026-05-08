const ORDER_REPORT_HEADERS = [
  '同步時間',
  '同步狀態',
  'Firestore ID',
  '訂單編號',
  '訂單日期',
  '訂單時間',
  '活動日期',
  '活動時間',
  '活動類型',
  '配送縣市',
  '地點名稱',
  '詳細地址',
  '訂購人姓名',
  '訂購人電話',
  '訂購人 Email',
  '收貨人姓名',
  '收貨人電話',
  '品項明細',
  '糖葫蘆數量',
  '掃帚數量',
  '糖葫蘆小計',
  '掃帚租金',
  '掃帚押金',
  '運費',
  '總金額',
  'PDF 連結',
  '備註',
  '購物車 JSON',
  'Firestore 建立時間',
  '報表更新時間'
];

function upsertOrderReportRow(data, pdfDownloadUrl) {
  const spreadsheet = getOrderReportSpreadsheet();
  const sheet = ensureOrderReportSheet(spreadsheet);
  const rowValues = buildOrderReportRow(data, pdfDownloadUrl);
  let targetRow = findOrderReportRow(sheet, data);

  if (targetRow) {
    sheet.getRange(targetRow, 1, 1, ORDER_REPORT_HEADERS.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
    targetRow = sheet.getLastRow();
  }

  sheet.getRange(targetRow, 14, 1, 2).setNumberFormat('@');
  sheet.getRange(targetRow, 17, 1, 1).setNumberFormat('@');
  sheet.autoResizeColumns(1, ORDER_REPORT_HEADERS.length);

  return {
    synced: true,
    spreadsheetUrl: spreadsheet.getUrl(),
    rowNumber: targetRow
  };
}

function markOrderReportRowDeleted(data) {
  const spreadsheet = getOrderReportSpreadsheet();
  const sheet = ensureOrderReportSheet(spreadsheet);
  const targetRow = findOrderReportRow(sheet, data);

  if (!targetRow) {
    Logger.log(`Order report row not found while deleting: ${data.orderNumber || data.firestoreDocumentId || data.firestoreId || 'unknown'}`);
    return {
      sheetDeleted: false,
      rowNotFound: true,
      spreadsheetUrl: spreadsheet.getUrl(),
      rowNumber: 0
    };
  }

  const now = new Date();
  const statusColumn = ORDER_REPORT_HEADERS.indexOf('同步狀態') + 1;
  const updatedAtColumn = ORDER_REPORT_HEADERS.indexOf('報表更新時間') + 1;
  const notesColumn = ORDER_REPORT_HEADERS.indexOf('備註') + 1;
  const numericColumns = [
    '糖葫蘆數量',
    '掃帚數量',
    '糖葫蘆小計',
    '掃帚租金',
    '掃帚押金',
    '運費',
    '總金額'
  ].map(function(header) { return ORDER_REPORT_HEADERS.indexOf(header) + 1; });

  const existingNotes = String(sheet.getRange(targetRow, notesColumn).getValue() || '');
  const deleteNote = `刪除時間：${Utilities.formatDate(now, 'Asia/Taipei', 'yyyy/MM/dd HH:mm:ss')}`;

  sheet.getRange(targetRow, statusColumn).setValue('已刪除');
  sheet.getRange(targetRow, updatedAtColumn).setValue(now);
  sheet.getRange(targetRow, notesColumn).setValue(existingNotes ? `${existingNotes}\n${deleteNote}` : deleteNote);
  numericColumns.forEach(function(column) {
    sheet.getRange(targetRow, column).setValue(0);
  });
  sheet.getRange(targetRow, 1, 1, ORDER_REPORT_HEADERS.length)
    .setBackground('#F3F4F6')
    .setFontColor('#6B7280');

  return {
    sheetDeleted: true,
    spreadsheetUrl: spreadsheet.getUrl(),
    rowNumber: targetRow
  };
}

function findOrderReportRow(sheet, data) {
  const firestoreId = String(data.firestoreDocumentId || data.firestoreId || '').trim();
  const orderNumber = String(data.orderNumber || '').trim();
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const rowFirestoreId = String(rows[i][2] || '').trim();
    const rowOrderNumber = String(rows[i][3] || '').trim();
    if ((firestoreId && rowFirestoreId === firestoreId) || (orderNumber && rowOrderNumber === orderNumber)) {
      return i + 1;
    }
  }

  return 0;
}

function getOrderReportSpreadsheet() {
  const configuredId = typeof ORDER_REPORT_SPREADSHEET_ID !== 'undefined' ? String(ORDER_REPORT_SPREADSHEET_ID || '').trim() : '';
  const props = PropertiesService.getScriptProperties();
  let spreadsheetId = configuredId || props.getProperty('ORDER_REPORT_SPREADSHEET_ID') || '';

  if (spreadsheetId) {
    return SpreadsheetApp.openById(spreadsheetId);
  }

  const spreadsheet = SpreadsheetApp.create('李伯伯糖葫蘆訂單報表');
  props.setProperty('ORDER_REPORT_SPREADSHEET_ID', spreadsheet.getId());

  try {
    const reportFile = DriveApp.getFileById(spreadsheet.getId());
    const folder = DriveApp.getFolderById(PDF_FOLDER_ID);
    folder.addFile(reportFile);
    DriveApp.getRootFolder().removeFile(reportFile);
  } catch (moveErr) {
    Logger.log('Unable to move report spreadsheet into PDF folder: ' + moveErr.toString());
  }

  return spreadsheet;
}

function ensureOrderReportSheet(spreadsheet) {
  const sheetName = typeof ORDER_REPORT_SHEET_NAME !== 'undefined' ? ORDER_REPORT_SHEET_NAME : '訂單報表';
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  const defaultSheet = spreadsheet.getSheetByName('工作表1') || spreadsheet.getSheetByName('Sheet1');
  if (defaultSheet && defaultSheet.getSheetId() !== sheet.getSheetId() && defaultSheet.getLastRow() === 0) {
    try {
      spreadsheet.deleteSheet(defaultSheet);
    } catch (deleteErr) {
      Logger.log('Unable to delete empty default sheet: ' + deleteErr.toString());
    }
  }

  if (sheet.getMaxColumns() < ORDER_REPORT_HEADERS.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), ORDER_REPORT_HEADERS.length - sheet.getMaxColumns());
  }

  sheet.getRange(1, 1, 1, ORDER_REPORT_HEADERS.length).setValues([ORDER_REPORT_HEADERS]);
  sheet.getRange(1, 1, 1, ORDER_REPORT_HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#FCE8E6')
    .setFontColor('#5F2120');
  sheet.setFrozenRows(1);
  return sheet;
}

function buildOrderReportRow(data, pdfDownloadUrl) {
  const cart = data.cart || {};
  const candyQty = getCartQuantity(cart, false);
  const broomQty = getCartQuantity(cart, true);
  const itemDetails = formatCartItemsForSheet(cart, data.itemsList);
  const now = new Date();

  return [
    now,
    '已同步',
    data.firestoreDocumentId || data.firestoreId || '',
    data.orderNumber || '',
    data.orderDate || '',
    data.orderTime || '',
    data.eventDate || '',
    data.eventTime || '',
    data.eventType || '',
    data.deliveryCity || '',
    data.locationName || data.eventLocation || '',
    data.specificDetails || '',
    data.ordererName || '',
    toPlainTextPhone(data.ordererPhone),
    data.ordererEmail || '',
    data.recipientName || '',
    toPlainTextPhone(data.recipientPhone),
    itemDetails,
    candyQty,
    broomQty,
    Number(data.candyTotal) || 0,
    Number(data.broomRent) || 0,
    Number(data.broomDeposit) || 0,
    Number(data.shippingFee) || 0,
    Number(data.totalAmount) || 0,
    pdfDownloadUrl || data.pdfDownloadUrl || '',
    data.notes || '',
    JSON.stringify(cart),
    data.createdAt || '',
    now
  ];
}

function getCartQuantity(cart, broomOnly) {
  let quantity = 0;
  Object.keys(cart || {}).forEach(function(id) {
    const isBroom = String(id) === '5';
    if (broomOnly !== isBroom) return;
    quantity += Number(cart[id]) || 0;
  });
  return quantity;
}

function formatCartItemsForSheet(cart, fallbackItemsList) {
  const ids = Object.keys(cart || {}).sort(function(a, b) { return Number(a) - Number(b); });
  if (!ids.length && fallbackItemsList) {
    return String(fallbackItemsList);
  }

  return ids
    .filter(function(id) { return Number(cart[id]) > 0; })
    .map(function(id) {
      const product = PRODUCTS[id] || { name: '商品 ' + id };
      return product.name + ' x' + cart[id];
    })
    .join('\n');
}

function toPlainTextPhone(value) {
  if (!value) return '';
  return "'" + String(value).replace(/^'/, '');
}
