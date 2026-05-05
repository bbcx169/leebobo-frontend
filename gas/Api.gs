/**
 * ==========================================
 * 李伯伯糖葫蘆 - 微服務 API (Api.gs)
 * ==========================================
 * ⚠️ 此 API 已轉型為微服務。資料庫(Firestore)的寫入由前端直接處理。
 * 本 API 僅負責接收確立的訂單資料，進行：
 * 1. 產生 PDF 明細並上傳 Google Drive。
 * 2. 發送 LINE / Telegram / Email 通知。
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
      const pdfBlob = PdfService.generateOrderPdfBlob(data);
      const folder = DriveApp.getFolderById(PDF_FOLDER_ID);
      const pdfFile = folder.createFile(pdfBlob);
      pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      const directUrl = `https://drive.google.com/uc?export=download&id=${pdfFile.getId()}`;
      
      const messageContent = `🍡【新訂單通知】\n編號：${data.orderNumber}\n訂購人：${data.ordererName}\n活動日：${data.eventDate} ${data.eventTime}\n[PDF連結]：\n${directUrl}`;
      sendMerchantNotification(messageContent);
      
      if (typeof NOTIFY_EMAIL !== "undefined" && NOTIFY_EMAIL) {
        MailApp.sendEmail({
          to: NOTIFY_EMAIL, subject: `【系統通知】收到新訂單 - 編號 ${data.orderNumber}`,
          body: `您好，系統已收到一筆新訂單。\n\n訂單編號：${data.orderNumber}\n訂購人：${data.ordererName}\n活動日期：${data.eventDate} ${data.eventTime}\n\n詳情明細請參閱附件 PDF。`,
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

      return ContentService.createTextOutput(JSON.stringify({ 'status': 'success', 'pdfDownloadUrl': directUrl })).setMimeType(ContentService.MimeType.JSON);
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
