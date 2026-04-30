/**
 * ==========================================
 * 李伯伯糖葫蘆 - API 入口與路由 (Api.gs)
 * ==========================================
 * 此檔案負責處理所有前端的 doPost 與 doGet 請求，
 * 並將任務分派給 DatabaseService 與 PdfService 處理。
 * 亦包含 LINE 與 Email 通知、定時排程提醒功能。
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // 1. 備用密碼驗證 API (繞過 LINE)
    if (data.action === 'verify_password') {
      if (data.password === ADMIN_PASSWORD) {
        return ContentService.createTextOutput(JSON.stringify({ 'status': 'success' })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ 'status': 'error', 'message': '密碼錯誤' })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 2. 儲存系統設定
    if (data.action === 'save_settings') {
      const props = PropertiesService.getScriptProperties();
      props.setProperty('reminderEnabled', String(data.reminderEnabled));
      props.setProperty('reminderTime', data.reminderTime);
      manageReminderTrigger(data.reminderEnabled, data.reminderTime);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. 補發 PDF 至 Email
    if (data.action === 'admin_resend_pdf' || data.action === 'resendPdf') {
      try {
        const folder = DriveApp.getFolderById(PDF_FOLDER_ID);
        const fileName = `李伯伯糖葫蘆_訂單明細_${data.orderNumber}.pdf`;
        const files = folder.searchFiles(`title = '${fileName}'`);
        if (!files.hasNext()) {
          return ContentService.createTextOutput(JSON.stringify({ 'status': 'error', 'message': '找不到該筆訂單的 PDF 檔案。' })).setMimeType(ContentService.MimeType.JSON);
        }
        
        const file = files.next();
        const blob = file.getBlob();
        const customerMsg = `親愛的顧客您好：\n\n這是「李伯伯糖葫蘆」補發的訂單明細。\n訂單編號：${data.orderNumber}\n\n附件為您的訂單 PDF 檔，請查收。\n\n李伯伯糖葫蘆 敬上`;
        MailApp.sendEmail({ to: data.email, subject: `【明細補發】李伯伯糖葫蘆 - 訂單編號 ${data.orderNumber}`, body: customerMsg, attachments: [blob] });
        
        return ContentService.createTextOutput(JSON.stringify({ 'status': 'success' })).setMimeType(ContentService.MimeType.JSON);
      } catch (err) { 
        return ContentService.createTextOutput(JSON.stringify({ 'status': 'error', 'message': err.toString() })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 4. 修改訂單交貨時間與日期
    if (data.action === 'update_order_time') {
      const lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000); 
        
        // 呼叫 DatabaseService 更新資料，取得完整訂單資料
        const fullOrderData = DatabaseService.updateOrder(data.orderNumber, data.newDate, data.newTime, data.newDetails, data.newNotes, null);
        
        if (fullOrderData) {
          const folder = DriveApp.getFolderById(PDF_FOLDER_ID);
          const fileName = `李伯伯糖葫蘆_訂單明細_${data.orderNumber}.pdf`;
          
          // 刪除舊 PDF
          const oldFiles = folder.searchFiles(`title = '${fileName}'`);
          while (oldFiles.hasNext()) { oldFiles.next().setTrashed(true); }

          // 使用 PdfService 產出新 PDF Blob
          const newPdfBlob = PdfService.generateOrderPdfBlob(fullOrderData);
          const newPdfFile = folder.createFile(newPdfBlob);
          newPdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          const newUrl = `https://drive.google.com/uc?export=download&id=${newPdfFile.getId()}`;
          
          // 再次更新新 PDF 的網址到資料庫
          DatabaseService.updateOrder(data.orderNumber, data.newDate, data.newTime, data.newDetails, data.newNotes, newUrl);

          return ContentService.createTextOutput(JSON.stringify({ 'status': 'success', 'newPdfUrl': newUrl })).setMimeType(ContentService.MimeType.JSON);
        } else { 
          return ContentService.createTextOutput(JSON.stringify({ 'status': 'error', 'message': '找不到訂單編號' })).setMimeType(ContentService.MimeType.JSON);
        }
      } catch (err) { 
        return ContentService.createTextOutput(JSON.stringify({ 'status': 'error', 'message': err.toString() })).setMimeType(ContentService.MimeType.JSON);
      } finally { 
        lock.releaseLock();
      }
    }

    // 5. 營收報表自動生成與回傳
    if (data.action === 'generate_monthly_report') {
      const lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000);
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const mainSheet = DatabaseService.getMainSheet();
        const dataRows = mainSheet.getDataRange().getValues();

        let targetYYYYMM = data.targetMonth;
        if (!targetYYYYMM) {
          let d = new Date();
          d.setMonth(d.getMonth() - 1);
          targetYYYYMM = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        }

        let actualRevenue = 0;
        let totalDeposit = 0;
        let flavorCounts = {};
        let matchedOrdersCount = 0;

        for (let i = 1; i < dataRows.length; i++) {
          let row = dataRows[i];
          let rDate = row[9]; 
          let rDateStr = "";
          if (rDate instanceof Date) { rDateStr = Utilities.formatDate(rDate, "GMT+8", "yyyy-MM"); } 
          else if (rDate) { rDateStr = String(rDate).replace(/\//g, '-').substring(0, 7); }

          if (rDateStr === targetYYYYMM) {
            matchedOrdersCount++;
            let candySub = Number(row[13]) || 0; 
            let bRent = Number(row[14]) || 0;    
            let bDep = Number(row[15]) || 0;
            let ship = Number(row[16]) || 0;

            actualRevenue += (candySub + bRent + ship);
            totalDeposit += bDep;

            let cartStr = row[20];
            if (cartStr) {
              try {
                let cartObj = JSON.parse(cartStr);
                for (let id in cartObj) {
                  if (id !== '5' && cartObj[id] > 0) { 
                    let flavorName = PRODUCTS[id] ? PRODUCTS[id].name : `口味_${id}`;
                    flavorCounts[flavorName] = (flavorCounts[flavorName] || 0) + cartObj[id];
                  }
                }
              } catch(e) {}
            } else {
              let itemsList = String(row[12] || "");
              let items = itemsList.split('\n');
              items.forEach(item => {
                if (item.includes('x') && !item.includes('掃帚')) {
                  let parts = item.split('x');
                  let fName = parts[0].replace('-', '').trim();
                  let qty = parseInt(parts[1].trim(), 10);
                  if (fName && !isNaN(qty)) { flavorCounts[fName] = (flavorCounts[fName] || 0) + qty; }
                }
              });
            }
          }
        }

        let reportSheetName = '月報表';
        let reportSheet = ss.getSheetByName(reportSheetName);
        if (!reportSheet) { reportSheet = ss.insertSheet(reportSheetName); }
        
        reportSheet.clear();
        reportSheet.appendRow(['李伯伯糖葫蘆 - 營收報表', '統計月份：' + targetYYYYMM]);
        reportSheet.getRange('A1:B1').setFontWeight('bold').setFontSize(14).setBackground('#FFF2CC');
        reportSheet.getRange('A1:B1').setBorder(true, true, true, true, null, null);
        
        reportSheet.appendRow(['']);
        reportSheet.appendRow(['一、財務摘要 (依活動日認列)', '金額 (NT$)']);
        reportSheet.getRange('A3:B3').setFontWeight('bold').setBackground('#E2EFDA').setBorder(true, true, true, true, null, null);
        
        reportSheet.appendRow(['實際營收 (含糖葫蘆、租金、運費)', actualRevenue]);
        reportSheet.appendRow(['代收押金 (負債需退還，不計入營收)', totalDeposit]);
        reportSheet.appendRow(['總收付金額 (實際營收 + 押金)', actualRevenue + totalDeposit]);
        reportSheet.appendRow(['該月有效完成訂單數', matchedOrdersCount + ' 筆']);
        reportSheet.getRange('A4:B7').setBorder(true, true, true, true, null, null);

        reportSheet.appendRow(['']);
        reportSheet.appendRow(['二、商品熱銷排行', '銷售數量 (支)']);
        reportSheet.getRange('A9:B9').setFontWeight('bold').setBackground('#D9E1F2').setBorder(true, true, true, true, null, null);
        
        let sortedFlavors = Object.keys(flavorCounts).sort((a, b) => flavorCounts[b] - flavorCounts[a]);
        let currentRow = 10;
        for (let i = 0; i < sortedFlavors.length; i++) {
          reportSheet.appendRow([sortedFlavors[i], flavorCounts[sortedFlavors[i]]]);
          currentRow++;
        }
        
        if (sortedFlavors.length > 0) { reportSheet.getRange(`A10:B${currentRow - 1}`).setBorder(true, true, true, true, null, null); } 
        else { reportSheet.appendRow(['無銷售紀錄', '0']); reportSheet.getRange('A10:B10').setBorder(true, true, true, true, null, null); }

        reportSheet.autoResizeColumns(1, 2);
        const responseData = { targetMonth: targetYYYYMM, actualRevenue: actualRevenue, totalDeposit: totalDeposit, orderCount: matchedOrdersCount, flavorStats: sortedFlavors.map(f => ({ name: f, count: flavorCounts[f] })) };
        return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: '報表產生成功', data: responseData })).setMimeType(ContentService.MimeType.JSON);
      } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
      } finally {
        lock.releaseLock();
      }
    }

    // 🛑 邏輯安全防護牆 (防呆)
    if (data.action && data.action !== 'create_order') {
      return ContentService.createTextOutput(JSON.stringify({ 'status': 'error', 'message': `未知的操作指令 (Unknown action): ${data.action}` })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // 6. 一般新訂單寫入 (預設處理)
    // ==========================================
    const orderLock = LockService.getScriptLock();
    try {
      orderLock.waitLock(10000); 
      
      let newOrderCandyQty = 0;
      const cartObj = data.cart || {};
      for (let id in cartObj) {
        if (id !== '5' && cartObj[id] > 0) { newOrderCandyQty += parseInt(cartObj[id], 10); }
      }

      const requestDateStr = String(data.eventDate).replace(/\//g, '-');
      // 呼叫 DatabaseService 計算剩餘額度
      const usedQty = DatabaseService.getDailyCandyCount(requestDateStr);
      
      if (usedQty + newOrderCandyQty > DAILY_LIMIT) {
        const remaining = Math.max(0, DAILY_LIMIT - usedQty);
        return ContentService.createTextOutput(JSON.stringify({ 'status': 'error', 'message': `非常抱歉，為堅持手工新鮮製作的品質，我們每日產能上限為 ${DAILY_LIMIT} 支。您選擇的日期目前剩餘可訂購額度為 ${remaining} 支。再麻煩您幫我們微調數量，或選擇其他日期，感謝您的體諒！🍡` })).setMimeType(ContentService.MimeType.JSON);
      }

      // 透過 PdfService 產生 PDF
      const pdfBlob = PdfService.generateOrderPdfBlob(data);
      const folder = DriveApp.getFolderById(PDF_FOLDER_ID);
      const pdfFile = folder.createFile(pdfBlob);
      pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      const directUrl = `https://drive.google.com/uc?export=download&id=${pdfFile.getId()}`;
      
      // 透過 DatabaseService 儲存新訂單
      DatabaseService.saveNewOrder(data, directUrl);
      
      // 發送通知
      const messageContent = `🍡【新訂單通知】\n編號：${data.orderNumber}\n訂購人：${data.ordererName}\n活動日：${data.eventDate} ${data.eventTime}\n[PDF連結]：\n${directUrl}`;
      if (LINE_CHANNEL_ACCESS_TOKEN && LINE_ADMIN_USER_ID) sendLineOfficialMessage(messageContent);
      
      if (NOTIFY_EMAIL) {
        MailApp.sendEmail({
          to: NOTIFY_EMAIL, subject: `【系統通知】收到新訂單 - 編號 ${data.orderNumber}`,
          body: `您好，系統已收到一筆新訂單。\n\n訂單編號：${data.orderNumber}\n訂購人：${data.ordererName}\n活動日期：${data.eventDate} ${data.eventTime}\n\n詳情明細請參閱附件 PDF。`,
          attachments: [pdfBlob]
        });
      }

      if (data.ordererEmail) {
        MailApp.sendEmail({ 
          to: data.ordererEmail, subject: `【訂單明細】李伯伯糖葫蘆 - 訂單編號 ${data.orderNumber}`, 
          body: "感謝您的訂購，明細如附件。", attachments: [pdfBlob] 
        });
      }

      return ContentService.createTextOutput(JSON.stringify({ 'status': 'success', 'pdfDownloadUrl': directUrl })).setMimeType(ContentService.MimeType.JSON);
    } catch (e) { 
      throw e; 
    } finally { 
      orderLock.releaseLock(); 
    }
  } catch (error) { 
    return ContentService.createTextOutput(JSON.stringify({ 'status': 'error', 'message': error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  if (e.parameter && e.parameter.action === 'check_availability') {
    try {
      const dateStr = String(e.parameter.date).replace(/\//g, '-');
      const usedQty = DatabaseService.getDailyCandyCount(dateStr);
      const remaining = Math.max(0, DAILY_LIMIT - usedQty);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', remaining: remaining })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (e.parameter && e.parameter.action === 'get_settings') {
    const props = PropertiesService.getScriptProperties();
    const enabled = props.getProperty('reminderEnabled') !== 'false'; 
    const time = props.getProperty('reminderTime') || '11:00';
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: { reminderEnabled: enabled, reminderTime: time } })).setMimeType(ContentService.MimeType.JSON);
  }

  if (e.parameter && e.parameter.action === 'verify_admin') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', isAdmin: ADMIN_LINE_IDS.includes(e.parameter.userId) })).setMimeType(ContentService.MimeType.JSON);
  }

  if (e.parameter && e.parameter.action === 'get_all_orders') {
    try {
      const orders = DatabaseService.getAllOrders();
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: orders })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) { 
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON); 
    }
  }

  if (e.parameter && e.parameter.action === 'query_order') {
    try {
      const matches = DatabaseService.queryOrder(e.parameter.name, e.parameter.phone, e.parameter.date);
      if (matches.length > 0) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: matches })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ status: 'not_found' })).setMimeType(ContentService.MimeType.JSON);
      }
    } catch (err) { 
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON); 
    }
  }
  return ContentService.createTextOutput("API 正常運作中！");
}

// ==========================================
// 🚀 工具與觸發器邏輯
// ==========================================
function sendLineOfficialMessage(text) {
  const messageText = text ? String(text).trim() : "⚠️ 系統測試正常。"; 
  if (!messageText) return;
  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = { to: LINE_ADMIN_USER_ID, messages: [{ type: 'text', text: messageText }] };
  const options = { 
    method: 'post', 
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN }, 
    payload: JSON.stringify(payload), 
    muteHttpExceptions: true 
  };
  try {
    const response = UrlFetchApp.fetch(url, options); 
    const responseCode = response.getResponseCode();
    if (responseCode === 429) { 
      Logger.log("⚠️ LINE 訊息發送失敗：本月免費額度已達上限。"); 
    } else if (responseCode !== 200) { 
      Logger.log("❌ LINE API 發生其他錯誤，代碼：" + responseCode); 
    }
  } catch (e) { 
    Logger.log("🚨 LINE 連線異常：" + e.toString()); 
  }
}

function kickstartReminder() { 
  manageReminderTrigger(true, '11:00'); 
  Logger.log("✅ 每日提醒觸發器已手動啟動！"); 
}

function manageReminderTrigger(enabled, timeString) {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) { 
    if (triggers[i].getHandlerFunction() === 'sendDailyReminder') { 
      ScriptApp.deleteTrigger(triggers[i]); 
    } 
  }
  if (enabled && timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    let targetDate = new Date();
    targetDate.setHours(hours, minutes, 0, 0);
    if (targetDate.getTime() <= new Date().getTime()) { 
      targetDate.setDate(targetDate.getDate() + 1); 
    }
    ScriptApp.newTrigger('sendDailyReminder').timeBased().at(targetDate).create();
    Logger.log("✅ 下一次觸發時間設定為：" + targetDate.toLocaleString());
  }
}

function sendDailyReminder() {
  try {
    const sheet = DatabaseService.getMainSheet();
    const dataRows = sheet.getDataRange().getValues();
    const tomorrow = new Date(); 
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tmrYYYY = tomorrow.getFullYear(); 
    const tmrMM = String(tomorrow.getMonth() + 1).padStart(2, '0'); 
    const tmrDD = String(tomorrow.getDate()).padStart(2, '0');
    const dbDateStr = `${tmrYYYY}-${tmrMM}-${tmrDD}`; 
    const displayDateStrFull = `${tmrYYYY}/${tmrMM}/${tmrDD}`; 
    const displayDateStrShort = `${tomorrow.getMonth() + 1}/${tomorrow.getDate()}`;

    let matchedOrders = [];
    for (let i = 1; i < dataRows.length; i++) {
      const r = dataRows[i]; 
      let rDate = r[9]; 
      let rDateStr = "";
      if (rDate instanceof Date) { 
        rDateStr = Utilities.formatDate(rDate, "GMT+8", "yyyy-MM-dd"); 
      } else { 
        rDateStr = String(rDate).replace(/\//g, '-'); 
      }
      if (rDateStr === dbDateStr) {
        matchedOrders.push({
           orderNumber: r[2], 
           recipientName: r[5], 
           recipientPhone: String(r[6]).replace(/^'/, ''),
           deliveryCity: r[7], 
           eventType: r[8],
           eventTime: r[10] instanceof Date ? Utilities.formatDate(r[10], "GMT+8", "HH:mm") : r[10],
           cart: r[20] ? JSON.parse(r[20]) : {}, 
           notes: r[18] || ''
        });
      }
    }

    let message = "";
    if (matchedOrders.length === 0) { 
      message = `🔔 明日 (${displayDateStrShort}) 無預約訂單，職人可以好好休息囉！`; 
    } else {
      message = `🔔 【明日出貨提醒】李伯伯糖葫蘆\n明日 (${displayDateStrFull}) 共有 ${matchedOrders.length} 筆排程！\n📦 【明日備料總計】\n`;
      let itemCounts = {};
      matchedOrders.forEach(o => { 
        for (let id in o.cart) { 
          if (o.cart[id] > 0 && id !== '5') { 
            if (!itemCounts[id]) itemCounts[id] = 0; 
            itemCounts[id] += o.cart[id]; 
          } 
        } 
      });
      for (let id in itemCounts) { 
        if (PRODUCTS[id]) { message += `${PRODUCTS[id].name}：${itemCounts[id]} 支\n`; } 
      }
      message += `🚗 【行程時間軸】\n`;
      matchedOrders.sort((a, b) => String(a.eventTime).localeCompare(String(b.eventTime)));
      matchedOrders.forEach(o => {
         message += `🔸 ${o.eventTime || '未定時'} (${o.eventType})\n訂單：#${o.orderNumber}\n地點：${o.deliveryCity} (${o.recipientName}、${o.recipientPhone})\n`;
         if (o.notes) message += `備註：${o.notes}\n`;
      });
    }
    sendLineOfficialMessage(message);
  } catch(e) { 
    Logger.log(e); 
    sendLineOfficialMessage("⚠️ 每日提醒功能發生錯誤：" + e.toString()); 
  } finally {
    const props = PropertiesService.getScriptProperties(); 
    const enabled = props.getProperty('reminderEnabled') !== 'false'; 
    const timeStr = props.getProperty('reminderTime') || '11:00';
    if (enabled) { manageReminderTrigger(true, timeStr); }
  }
}