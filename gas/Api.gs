/**
 * ==========================================
 * 李伯伯糖葫蘆 - 微服務 API (Api.gs)
 * ==========================================
 * ⚠️ 此 API 已轉型為微服務。資料庫(Firestore)的寫入由前端直接處理。
 * 本 API 僅負責接收確立的訂單資料，進行：
 * 1. 產生 PDF 明細並上傳 Google Drive。
 * 2. 發送 LINE / Telegram / Email 通知。
 * 3. 將訂單同步到 Google Sheets 營運報表。
 */

// ==========================================
// 🚀 核心 API 邏輯
// ==========================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // 1. 備用密碼驗證 API
    if (data.action === 'verify_password') {
      if (data.password === ADMIN_PASSWORD) {
        return ContentService.createTextOutput(JSON.stringify({ 'status': 'success' })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ 'status': 'error', 'message': '密碼錯誤' })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 2. 補發 PDF 至 Email
    if (data.action === 'admin_resend_pdf' || data.action === 'resendPdf') {
      const resendLock = LockService.getScriptLock();
      try {
        resendLock.waitLock(10000);

        if (!data.email) {
          return jsonResponse({ status: 'error', message: '缺少收件人 Email。' });
        }
        if (!data.orderNumber) {
          return jsonResponse({ status: 'error', message: '缺少訂單編號。' });
        }
        
        let file = findOrderPdfFile(data);
        let blob;
        let directUrl = data.pdfDownloadUrl || data.pdfUrl || "";

        if (file) {
          blob = file.getBlob().setName(`李伯伯糖葫蘆_訂單明細_${data.orderNumber}.pdf`);
          directUrl = directUrl || `https://drive.google.com/uc?export=download&id=${file.getId()}`;
        } else {
          if (!data.cart) {
            return jsonResponse({
              status: 'error',
              message: `找不到訂單 ${data.orderNumber} 的 PDF 檔案，且缺少訂單明細，無法重新產生 PDF。`
            });
          }

          blob = PdfService.generateOrderPdfBlob(data);
          const folder = DriveApp.getFolderById(PDF_FOLDER_ID);
          file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          directUrl = `https://drive.google.com/uc?export=download&id=${file.getId()}`;
        }

        const customerMsg = `親愛的顧客您好：\n\n這是「李伯伯糖葫蘆」補發的訂單明細。\n訂單編號：${data.orderNumber}\n\n附件為您的訂單 PDF 檔，請查收。\n\n李伯伯糖葫蘆 敬上`;
        MailApp.sendEmail({ 
          to: data.email, 
          subject: `【明細補發】李伯伯糖葫蘆 - 訂單編號 ${data.orderNumber}`, 
          body: customerMsg, 
          attachments: [blob] 
        });
        
        return jsonResponse({ status: 'success', pdfDownloadUrl: directUrl });
      } catch (err) { 
        return jsonResponse({ status: 'error', message: err.toString() });
      } finally {
        try {
          resendLock.releaseLock();
        } catch (lockErr) {
          Logger.log("Unable to release resend lock: " + lockErr.toString());
        }
      }
    }

    // 3. ✨ 修改訂單資料：更新 PDF 並寄送 Email 給顧客
    if (data.action === 'update_pdf') {
      try {
        const pdfBlob = PdfService.generateOrderPdfBlob(data);
        const folder = DriveApp.getFolderById(PDF_FOLDER_ID);
        
        // 刪除舊的 PDF 檔案
        const oldFileName = `李伯伯糖葫蘆_訂單明細_${data.orderNumber}.pdf`;
        const oldFiles = folder.searchFiles(`title = '${oldFileName}'`);
        while (oldFiles.hasNext()) { 
          oldFiles.next().setTrashed(true); 
        }

        // 建立新 PDF
        const pdfFile = folder.createFile(pdfBlob);
        pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        const directUrl = `https://drive.google.com/uc?export=download&id=${pdfFile.getId()}`;

        // 寄送「訂單修改」通知信給顧客
        if (data.ordererEmail && data.ordererEmail !== '未提供') {
          const modifyMsg = `親愛的顧客您好：\n\n您的訂單（編號：${data.orderNumber}）資訊已由管理員完成修改。\n修改內容可能包含活動日期、時間、配送地點或備註。\n附件為更新後的訂單明細 PDF，請您重新查收。如有任何疑問，歡迎聯繫 LINE 客服。\n\n李伯伯糖葫蘆 敬上`;
          
          MailApp.sendEmail({
            to: data.ordererEmail,
            subject: `【訂單修改】李伯伯糖葫蘆 - 訂單編號 ${data.orderNumber}`,
            body: modifyMsg,
            attachments: [pdfBlob]
          });
        }

        return ContentService.createTextOutput(JSON.stringify({ 
          'status': 'success', 
          'pdfDownloadUrl': directUrl 
        })).setMimeType(ContentService.MimeType.JSON);
      } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ 'status': 'error', 'message': err.toString() })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 4. 處理新訂單 (更新顧客收執信件內容)
    if (data.action === 'create_order') {
      const orderLock = LockService.getScriptLock();
      try {
        orderLock.waitLock(10000);

        const pdfBlob = PdfService.generateOrderPdfBlob(data);
        const folder = DriveApp.getFolderById(PDF_FOLDER_ID);
        const pdfFile = folder.createFile(pdfBlob);
        pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        const directUrl = `https://drive.google.com/uc?export=download&id=${pdfFile.getId()}`;

        let sheetSynced = false;
        let sheetError = "";
        let sheetUrl = "";
        try {
          const sheetResult = upsertOrderReportRow(data, directUrl);
          sheetSynced = sheetResult.synced;
          sheetUrl = sheetResult.spreadsheetUrl;
        } catch (sheetErr) {
          sheetError = sheetErr.toString();
          Logger.log("Order report sync failed for " + data.orderNumber + ": " + sheetError);
        }
        
        const messageContent = `🍡【新訂單通知】\n編號：${data.orderNumber}\n訂購人：${data.ordererName}\n活動日：${data.eventDate} ${data.eventTime}\n報表同步：${sheetSynced ? '成功' : '失敗'}\n[PDF連結]：\n${directUrl}`;
        sendMerchantNotification(messageContent);
        
        if (typeof NOTIFY_EMAIL !== "undefined" && NOTIFY_EMAIL) {
          MailApp.sendEmail({
            to: NOTIFY_EMAIL, subject: `【系統通知】收到新訂單 - 編號 ${data.orderNumber}`,
            body: `您好，系統已收到一筆新訂單。\n\n訂單編號：${data.orderNumber}\n訂購人：${data.ordererName}\n活動日期：${data.eventDate} ${data.eventTime}\n報表同步：${sheetSynced ? '成功' : '失敗'}${sheetError ? `\n同步錯誤：${sheetError}` : ''}\n\n詳情明細請參閱附件 PDF。`,
            attachments: [pdfBlob]
          });
        }

        // ✨ 更新：寄信給顧客 (新版內容)
        if (data.ordererEmail && data.ordererEmail !== '未提供') {
          const customerContent = `親愛的顧客您好：\n\n感謝您預約「李伯伯糖葫蘆」！我們已收到您的訂單（編號：${data.orderNumber}）。\n附件為您的訂單明細 PDF 檔，請您核對內容是否正確。\n\n請務必加入 LINE 官方帳號留言，後續我們將由專人與您聯繫確認細節。若有任何疑問，歡迎隨時聯繫 LINE 官方帳號。\n期待在您的活動現場為您服務！\n\n李伯伯糖葫蘆 敬上`;
          
          MailApp.sendEmail({ 
            to: data.ordererEmail, 
            subject: `【訂單明細】李伯伯糖葫蘆 - 訂單編號 ${data.orderNumber}`, 
            body: customerContent, 
            attachments: [pdfBlob] 
          });
        }

        return jsonResponse({
          status: 'success',
          pdfDownloadUrl: directUrl,
          sheetSynced: sheetSynced,
          sheetError: sheetError,
          sheetUrl: sheetUrl
        });
      } finally {
        try {
          orderLock.releaseLock();
        } catch (lockErr) {
          Logger.log("Unable to release order lock: " + lockErr.toString());
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ 'status': 'error', 'message': `未知的操作指令: ${data.action}` })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) { 
    return ContentService.createTextOutput(JSON.stringify({ 'status': 'error', 'message': error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  if (e.parameter && e.parameter.action === 'verify_admin') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', isAdmin: ADMIN_LINE_IDS.includes(e.parameter.userId) })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput("微服務 API 正常運作中！");
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

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

// ==========================================
// 📊 Google Sheets 訂單報表同步
// ==========================================
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
  const firestoreId = String(data.firestoreDocumentId || data.firestoreId || '').trim();
  const orderNumber = String(data.orderNumber || '').trim();
  const rows = sheet.getDataRange().getValues();
  let targetRow = 0;

  for (let i = 1; i < rows.length; i++) {
    const rowFirestoreId = String(rows[i][2] || '').trim();
    const rowOrderNumber = String(rows[i][3] || '').trim();
    if ((firestoreId && rowFirestoreId === firestoreId) || (orderNumber && rowOrderNumber === orderNumber)) {
      targetRow = i + 1;
      break;
    }
  }

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

// ==========================================
// 🚀 工具邏輯 (保留 LINE 與 Telegram 發送器)
// ==========================================
function sendLineOfficialMessage(text) {
  const messageText = text ? String(text).trim() : "⚠️ 系統測試正常。"; 
  if (!messageText) return;
  const lineAccessToken = getNotificationConfigValue("LINE_CHANNEL_ACCESS_TOKEN", typeof LINE_CHANNEL_ACCESS_TOKEN !== "undefined" ? LINE_CHANNEL_ACCESS_TOKEN : "");
  const lineAdminUserId = getNotificationConfigValue("LINE_ADMIN_USER_ID", typeof LINE_ADMIN_USER_ID !== "undefined" ? LINE_ADMIN_USER_ID : "");
  if (!lineAccessToken || !lineAdminUserId) return;

  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = { to: lineAdminUserId, messages: [{ type: 'text', text: messageText }] };
  const options = { 
    method: 'post', 
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + lineAccessToken }, 
    payload: JSON.stringify(payload), 
    muteHttpExceptions: true 
  };
  try { UrlFetchApp.fetch(url, options); } catch (e) { Logger.log(e); }
}

function sendMerchantNotification(text) {
  const messageText = text ? String(text).trim() : "";
  if (!messageText) return;
  sendLineOfficialMessage(messageText);
  sendTelegramMessage(messageText);
}

function getNotificationConfigValue(keyName, fallbackValue) {
  if (fallbackValue) return fallbackValue;
  try { return PropertiesService.getScriptProperties().getProperty(keyName) || ""; } catch (e) { return ""; }
}

function sendTelegramMessage(text) {
  const botToken = getNotificationConfigValue("TELEGRAM_BOT_TOKEN", typeof TELEGRAM_BOT_TOKEN !== "undefined" ? TELEGRAM_BOT_TOKEN : "");
  const chatId = getNotificationConfigValue("TELEGRAM_CHAT_ID", typeof TELEGRAM_CHAT_ID !== "undefined" ? TELEGRAM_CHAT_ID : "");
  const messageText = text ? String(text).trim() : "";

  if (!messageText || !botToken || !chatId) return;

  const url = "https://api.telegram.org/bot" + botToken + "/sendMessage";
  String(chatId).split(/[,\n]/).map(c => c.trim()).filter(c => c).forEach(targetChatId => {
    const payload = { chat_id: targetChatId, text: messageText, disable_web_page_preview: true };
    const options = { method: "post", contentType: "application/json", payload: JSON.stringify(payload), muteHttpExceptions: true };
    try { UrlFetchApp.fetch(url, options); } catch (e) { Logger.log(e); }
  });
}
