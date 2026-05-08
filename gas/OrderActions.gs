function handleResendPdf(data) {
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

function handleUpdatePdf(data) {
  try {
    const pdfBlob = PdfService.generateOrderPdfBlob(data);
    const folder = DriveApp.getFolderById(PDF_FOLDER_ID);

    const oldFileName = `李伯伯糖葫蘆_訂單明細_${data.orderNumber}.pdf`;
    const oldFiles = folder.searchFiles(`title = '${oldFileName}'`);
    while (oldFiles.hasNext()) {
      oldFiles.next().setTrashed(true);
    }

    const pdfFile = folder.createFile(pdfBlob);
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const directUrl = `https://drive.google.com/uc?export=download&id=${pdfFile.getId()}`;

    if (data.ordererEmail && data.ordererEmail !== '未提供') {
      const modifyMsg = `親愛的顧客您好：\n\n您的訂單（編號：${data.orderNumber}）資訊已由管理員完成修改。\n修改內容可能包含活動日期、時間、配送地點或備註。\n附件為更新後的訂單明細 PDF，請您重新查收。如有任何疑問，歡迎聯繫 LINE 客服。\n\n李伯伯糖葫蘆 敬上`;

      MailApp.sendEmail({
        to: data.ordererEmail,
        subject: `【訂單修改】李伯伯糖葫蘆 - 訂單編號 ${data.orderNumber}`,
        body: modifyMsg,
        attachments: [pdfBlob]
      });
    }

    return jsonResponse({
      status: 'success',
      pdfDownloadUrl: directUrl
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function handleMarkOrderDeleted(data) {
  const deleteLock = LockService.getScriptLock();
  try {
    deleteLock.waitLock(10000);
    const result = markOrderReportRowDeleted(data);
    return jsonResponse({ status: 'success', ...result });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  } finally {
    try {
      deleteLock.releaseLock();
    } catch (lockErr) {
      Logger.log("Unable to release delete lock: " + lockErr.toString());
    }
  }
}

function handleCreateOrder(data) {
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
