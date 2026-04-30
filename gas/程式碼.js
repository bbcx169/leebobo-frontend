// ==========================================
// 李伯伯糖葫蘆 - 訂單接收、PDF生成與通知系統
// (整合 V1.9 婚禮雙代收人 + PDF 智能地址顯示 + 交貨方式視覺標籤 + 數字備註防崩潰)
// ==========================================

// 💡 【設定區】
const NOTIFY_EMAIL = 'bbcx169@gmail.com';
const LINE_CHANNEL_ACCESS_TOKEN = 'Szz8gLG1ZeHuVW9DoTRtFf86tmxkfl4k0uGmD1xttmvdZIvQ800W/UDGJ23GeYjdHA/pCFm2oabZC/u3JQ+crvIMwwNHStr8ulYPPBtHwoKul2vFm97nUWvBkdmCqM1v8vxdCIcRbUGlBWkawcj9ZwdB04t89/1O/w1cDnyilFU=';
const LINE_ADMIN_USER_ID = 'U4460cd7d1f421c42d6dbf0f07253580e';

// 🔐 【系統白名單】後台管理員的 LINE User ID
const ADMIN_LINE_IDS = [
  'U4460cd7d1f421c42d6dbf0f07253580e', '2009807397-WPVPBokl'
];
const SHEET_TAB_NAME = '工作表1';
const PDF_FOLDER_ID = '1GrWJtbw51RTZ-a0fGkrCqbiLpLgOqxH7';

// 🚀 後台備用登入通關密碼
const ADMIN_PASSWORD = 'leebobo_admin';

// 🌟 每日產能上限
const DAILY_LIMIT = 800;

// 🛍️ 產品對照表
const PRODUCTS = {
  '1': { name: '蕃茄 (小/喜糖)', price: 20 },
  '2': { name: '蕃茄蜜餞 (小/喜糖)', price: 25 },
  '3': { name: '鳥梨 (小/喜糖)', price: 20 },
  '4': { name: '蕃茄+鳥梨 (小/喜糖)', price: 20 },
  '5': { name: '承租掃帚', price: 2000 },
  '6': { name: '蕃茄 (經典)', price: 30 },
  '7': { name: '蕃茄蜜餞 (經典)', price: 35 },
  '8': { name: '鳥梨 (經典)', price: 35 }
};

// ==========================================
// ⚙️ API 入口：處理 POST 請求 (寫入/修改資料)
// ==========================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // 🚀 備用密碼驗證 API (繞過 LINE)
    if (data.action === 'verify_password') {
      if (data.password === ADMIN_PASSWORD) {
        return ContentService.createTextOutput(JSON.stringify({ 'status': 'success' })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ 'status': 'error', 'message': '密碼錯誤' })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 1. 儲存系統設定
    if (data.action === 'save_settings') {
      const props = PropertiesService.getScriptProperties();
      props.setProperty('reminderEnabled', String(data.reminderEnabled));
      props.setProperty('reminderTime', data.reminderTime);
      manageReminderTrigger(data.reminderEnabled, data.reminderTime);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. 補發 PDF 至 Email
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

    // 3. 修改訂單交貨時間與日期
    if (data.action === 'update_order_time') {
      const lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000); 
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        let sheet = ss.getSheetByName(SHEET_TAB_NAME) || ss.getSheets()[0];
        const dataRows = sheet.getDataRange().getValues();
        let targetRowIndex = -1;
        
        for (let i = dataRows.length - 1; i >= 1; i--) {
          if (dataRows[i][2] === data.orderNumber) { 
            targetRowIndex = i + 1;
            break; 
          }
        }

        if (targetRowIndex !== -1) {
          sheet.getRange(targetRowIndex, 10).setValue(data.newDate);
          sheet.getRange(targetRowIndex, 11).setValue(data.newTime);
          
          let updatedDetails = dataRows[targetRowIndex - 1][11];
          if (data.newDetails !== undefined) {
            updatedDetails = data.newDetails;
            sheet.getRange(targetRowIndex, 12).setValue(updatedDetails);
          }

          let finalNotes = dataRows[targetRowIndex - 1][18];
          if (data.newNotes !== undefined) {
            finalNotes = data.newNotes;
            sheet.getRange(targetRowIndex, 19).setValue(finalNotes);
          }

          sheet.getRange(targetRowIndex, 23).setValue("TRUE");
          
          const rowData = sheet.getRange(targetRowIndex, 1, 1, 23).getValues()[0];
          const fullOrderData = {
            orderDate: rowData[0] instanceof Date ? Utilities.formatDate(rowData[0], "GMT+8", "yyyy/MM/dd") : rowData[0],
            orderTime: rowData[1] instanceof Date ? Utilities.formatDate(rowData[1], "GMT+8", "HH:mm:ss") : rowData[1],
            orderNumber: rowData[2], ordererName: rowData[3], ordererPhone: String(rowData[4]).replace(/^'/, ''),
            recipientName: rowData[5], recipientPhone: String(rowData[6]).replace(/^'/, ''), deliveryCity: rowData[7],
            eventType: rowData[8], eventDate: data.newDate, eventTime: data.newTime, 
            specificDetails: updatedDetails, 
            itemsList: rowData[12], candyTotal: rowData[13], broomRent: rowData[14], broomDeposit: rowData[15],
            shippingFee: rowData[16], totalAmount: rowData[17], notes: finalNotes, ordererEmail: rowData[19],
            cart: rowData[20] ? JSON.parse(rowData[20]) : {},
            isModified: true
          };

          const folder = DriveApp.getFolderById(PDF_FOLDER_ID);
          const fileName = `李伯伯糖葫蘆_訂單明細_${data.orderNumber}.pdf`;
          const oldFiles = folder.searchFiles(`title = '${fileName}'`);
          while (oldFiles.hasNext()) { oldFiles.next().setTrashed(true); }

          const newPdfBlob = generateOrderPdfBlob(fullOrderData);
          const newPdfFile = folder.createFile(newPdfBlob);
          newPdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          const newUrl = `https://drive.google.com/uc?export=download&id=${newPdfFile.getId()}`;
          sheet.getRange(targetRowIndex, 22).setValue(newUrl);

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

    // 4. 營收報表自動生成與回傳
    if (data.action === 'generate_monthly_report') {
      const lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000);
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        let mainSheet = ss.getSheetByName(SHEET_TAB_NAME) || ss.getSheets()[0];
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

    // 🛑 【邏輯安全防護牆】
    if (data.action && data.action !== 'create_order') {
      return ContentService.createTextOutput(JSON.stringify({ 'status': 'error', 'message': `未知的操作指令 (Unknown action): ${data.action}` })).setMimeType(ContentService.MimeType.JSON);
    }

    // ==========================================
    // 5. 一般新訂單寫入 (第二道防線：寫入前檢查上限)
    // ==========================================
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000); 
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(SHEET_TAB_NAME) || ss.getSheets()[0];
      let newOrderCandyQty = 0;
      const cartObj = data.cart || {};
      for (let id in cartObj) {
        if (id !== '5' && cartObj[id] > 0) { newOrderCandyQty += parseInt(cartObj[id], 10); }
      }

      const requestDateStr = String(data.eventDate).replace(/\//g, '-');
      const usedQty = getDailyCandyCount(sheet, requestDateStr);
      
      if (usedQty + newOrderCandyQty > DAILY_LIMIT) {
        const remaining = Math.max(0, DAILY_LIMIT - usedQty);
        return ContentService.createTextOutput(JSON.stringify({ 'status': 'error', 'message': `非常抱歉，為堅持手工新鮮製作的品質，我們每日產能上限為 ${DAILY_LIMIT} 支。您選擇的日期目前剩餘可訂購額度為 ${remaining} 支。再麻煩您幫我們微調數量，或選擇其他日期，感謝您的體諒！🍡` })).setMimeType(ContentService.MimeType.JSON);
      }

      if (sheet.getLastRow() === 0) {
        const headers = ["訂單建立日期", "訂單建立時間", "訂購明細單編號", "訂購人", "訂購人電話", "收貨人", "收貨人電話", "配送縣市", "活動類型", "活動日期", "活動時間", "詳細資訊 (餐廳/新人/地點)", "訂購明細", "糖葫蘆小計", "掃帚租金", "掃帚押金", "運費", "總金額", "備註", "聯絡信箱", "購物車原始資料", "PDF下載連結", "是否修改過"];
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#F3F4F6");
        sheet.setFrozenRows(1);
      }

      const rowData = [
        data.orderDate || "", data.orderTime || "", data.orderNumber || "", data.ordererName || "", 
        data.ordererPhone ? "'" + data.ordererPhone : "", data.recipientName || "", 
        data.recipientPhone ? "'" + data.recipientPhone : "", data.deliveryCity || "", 
        data.eventType || "", data.eventDate || "", data.eventTime || "", data.specificDetails || "", 
        data.itemsList || "", data.candyTotal || 0, data.broomRent || 0, data.broomDeposit || 0, 
        data.shippingFee || 0, data.totalAmount || "", data.notes || "", data.ordererEmail || "", 
        JSON.stringify(data.cart || {}), "", ""
      ];
      sheet.appendRow(rowData);
      const newRowIndex = sheet.getLastRow();
      
      const pdfBlob = generateOrderPdfBlob(data);
      const folder = DriveApp.getFolderById(PDF_FOLDER_ID);
      const pdfFile = folder.createFile(pdfBlob);
      pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      const directUrl = `https://drive.google.com/uc?export=download&id=${pdfFile.getId()}`;
      sheet.getRange(newRowIndex, 22).setValue(directUrl);
      
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
    } catch (e) { throw e; } finally { lock.releaseLock(); }
  } catch (error) { 
    return ContentService.createTextOutput(JSON.stringify({ 'status': 'error', 'message': error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// ⚙️ API 入口：處理 GET 請求 (讀取資料)
// ==========================================
function doGet(e) {
  if (e.parameter && e.parameter.action === 'check_availability') {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(SHEET_TAB_NAME) || ss.getSheets()[0];
      const dateStr = String(e.parameter.date).replace(/\//g, '-');
      const usedQty = getDailyCandyCount(sheet, dateStr);
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
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(SHEET_TAB_NAME) || ss.getSheets()[0];
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] })).setMimeType(ContentService.MimeType.JSON);
      const dataRows = sheet.getRange(2, 1, lastRow - 1, 23).getValues();
      let orders = [];
      
      for (let i = dataRows.length - 1; i >= 0; i--) {
        const r = dataRows[i];
        const safeDate = v => v instanceof Date ? Utilities.formatDate(v, "GMT+8", "yyyy-MM-dd") : v;
        const safeTime = v => v instanceof Date ? Utilities.formatDate(v, "GMT+8", "HH:mm") : v;
        orders.push({
          orderDate: r[0] instanceof Date ? Utilities.formatDate(r[0], "GMT+8", "yyyy/MM/dd") : r[0],
          orderTime: r[1] instanceof Date ? Utilities.formatDate(r[1], "GMT+8", "HH:mm:ss") : r[1],
          orderNumber: r[2], ordererName: r[3], ordererPhone: String(r[4]).replace(/^'/, ''), recipientName: r[5], recipientPhone: String(r[6]).replace(/^'/, ''),
          deliveryCity: r[7], eventType: r[8], eventDate: safeDate(r[9]), eventTime: safeTime(r[10]), specificDetails: r[11], itemsList: r[12],
          candySubtotal: r[13] || 0, broomRent: r[14] || 0, broomDeposit: r[15] || 0, shippingFee: r[16] || 0, totalPrice: r[17] || 0,
          notes: r[18] || '', ordererEmail: r[19] || '', cart: r[20] ? JSON.parse(r[20]) : {}, pdfDownloadUrl: r[21] || '',
          isModified: r[22] === "TRUE" || r[22] === true
        });
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: orders })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) { return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON); }
  }

  if (e.parameter && e.parameter.action === 'query_order') {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(SHEET_TAB_NAME) || ss.getSheets()[0];
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return ContentService.createTextOutput(JSON.stringify({ status: 'not_found' })).setMimeType(ContentService.MimeType.JSON);
      const dataRows = sheet.getRange(2, 1, lastRow - 1, 23).getValues();
      const cleanStr = str => String(str).replace(/[\s\-\'\"\/\\]/g, '');
      const formatDate = val => {
        if (val instanceof Date) { const yyyy = val.getFullYear(); const mm = String(val.getMonth() + 1).padStart(2, '0'); const dd = String(val.getDate()).padStart(2, '0'); return `${yyyy}${mm}${dd}`; }
        return cleanStr(val);
      };
      
      const qName = cleanStr(e.parameter.name); const qPhone = cleanStr(e.parameter.phone); const qDate = formatDate(e.parameter.date);
      let matches = []; 
      for (let i = dataRows.length - 1; i >= 0; i--) {
        const r = dataRows[i]; const rName = cleanStr(r[3]); const rPhone = cleanStr(r[4]); const rDate = formatDate(r[9]);
        if (rName === qName && rPhone === qPhone && rDate === qDate) {
          const safeDate = val => val instanceof Date ? Utilities.formatDate(val, "GMT+8", "yyyy-MM-dd") : val; 
          const safeTime = val => val instanceof Date ? Utilities.formatDate(val, "GMT+8", "HH:mm") : val;
          matches.push({
            orderDate: r[0] instanceof Date ? Utilities.formatDate(r[0], "GMT+8", "yyyy/MM/dd") : r[0], 
            orderTime: r[1] instanceof Date ? Utilities.formatDate(r[1], "GMT+8", "HH:mm:ss") : r[1], 
            orderNumber: r[2], ordererName: r[3], ordererPhone: String(r[4]).replace(/^'/, ''), recipientName: r[5], recipientPhone: String(r[6]).replace(/^'/, ''),
            deliveryCity: r[7], eventType: r[8], eventDate: safeDate(r[9]), eventTime: safeTime(r[10]), specificDetails: r[11], itemsList: r[12],
            candySubtotal: r[13] || 0, broomRent: r[14] || 0, broomDeposit: r[15] || 0, shippingFee: r[16] || 0, totalPrice: r[17] || 0, 
            notes: r[18] || '', ordererEmail: r[19] || '', cart: r[20] ? JSON.parse(r[20]) : {}, pdfDownloadUrl: r[21] || '',
            isModified: r[22] === "TRUE" || r[22] === true
          });
        }
      }
      if (matches.length > 0) return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: matches })).setMimeType(ContentService.MimeType.JSON);
      else return ContentService.createTextOutput(JSON.stringify({ status: 'not_found' })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) { return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON); }
  }
  return ContentService.createTextOutput("API 正常運作中！");
}

// ==========================================
// 🚀 工具與觸發器邏輯
// ==========================================
function kickstartReminder() { manageReminderTrigger(true, '11:00'); Logger.log("✅ 每日提醒觸發器已手動啟動！"); }

function manageReminderTrigger(enabled, timeString) {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) { if (triggers[i].getHandlerFunction() === 'sendDailyReminder') { ScriptApp.deleteTrigger(triggers[i]); } }
  if (enabled && timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    let targetDate = new Date();
    targetDate.setHours(hours, minutes, 0, 0);
    if (targetDate.getTime() <= new Date().getTime()) { targetDate.setDate(targetDate.getDate() + 1); }
    ScriptApp.newTrigger('sendDailyReminder').timeBased().at(targetDate).create();
    Logger.log("✅ 下一次觸發時間設定為：" + targetDate.toLocaleString());
  }
}

function sendDailyReminder() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_TAB_NAME) || ss.getSheets()[0];
    const dataRows = sheet.getDataRange().getValues();
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tmrYYYY = tomorrow.getFullYear(); const tmrMM = String(tomorrow.getMonth() + 1).padStart(2, '0'); const tmrDD = String(tomorrow.getDate()).padStart(2, '0');
    const dbDateStr = `${tmrYYYY}-${tmrMM}-${tmrDD}`; const displayDateStrFull = `${tmrYYYY}/${tmrMM}/${tmrDD}`; const displayDateStrShort = `${tomorrow.getMonth() + 1}/${tomorrow.getDate()}`;

    let matchedOrders = [];
    for (let i = 1; i < dataRows.length; i++) {
      const r = dataRows[i]; let rDate = r[9]; let rDateStr = "";
      if (rDate instanceof Date) { rDateStr = Utilities.formatDate(rDate, "GMT+8", "yyyy-MM-dd"); } 
      else { rDateStr = String(rDate).replace(/\//g, '-'); }
      if (rDateStr === dbDateStr) {
        matchedOrders.push({
           orderNumber: r[2], recipientName: r[5], recipientPhone: String(r[6]).replace(/^'/, ''),
           deliveryCity: r[7], eventType: r[8],
           eventTime: r[10] instanceof Date ? Utilities.formatDate(r[10], "GMT+8", "HH:mm") : r[10],
           cart: r[20] ? JSON.parse(r[20]) : {}, notes: r[18] || ''
        });
      }
    }

    let message = "";
    if (matchedOrders.length === 0) { message = `🔔 明日 (${displayDateStrShort}) 無預約訂單，職人可以好好休息囉！`; } 
    else {
      message = `🔔 【明日出貨提醒】李伯伯糖葫蘆\n明日 (${displayDateStrFull}) 共有 ${matchedOrders.length} 筆排程！\n📦 【明日備料總計】\n`;
      let itemCounts = {};
      matchedOrders.forEach(o => { for (let id in o.cart) { if (o.cart[id] > 0 && id !== '5') { if (!itemCounts[id]) itemCounts[id] = 0; itemCounts[id] += o.cart[id]; } } });
      for (let id in itemCounts) { if (PRODUCTS[id]) { message += `${PRODUCTS[id].name}：${itemCounts[id]} 支\n`; } }
      message += `🚗 【行程時間軸】\n`;
      matchedOrders.sort((a, b) => String(a.eventTime).localeCompare(String(b.eventTime)));
      matchedOrders.forEach(o => {
         message += `🔸 ${o.eventTime || '未定時'} (${o.eventType})\n訂單：#${o.orderNumber}\n地點：${o.deliveryCity} (${o.recipientName}、${o.recipientPhone})\n`;
         if (o.notes) message += `備註：${o.notes}\n`;
      });
    }
    sendLineOfficialMessage(message);
  } catch(e) { Logger.log(e); sendLineOfficialMessage("⚠️ 每日提醒功能發生錯誤：" + e.toString()); } 
  finally {
    const props = PropertiesService.getScriptProperties(); const enabled = props.getProperty('reminderEnabled') !== 'false'; const timeStr = props.getProperty('reminderTime') || '11:00';
    if (enabled) { manageReminderTrigger(true, timeStr); }
  }
}

// ==========================================
// 📄 內部核心：HTML 轉 PDF Blob 引擎
// ==========================================
function generateOrderPdfBlob(data) {
  const cart = data.cart || {};
  let itemsHtml = ''; let candyQty = 0; let broomQty = 0;
  for (let id in cart) {
    if (cart[id] > 0 && id !== '5') {
      const product = PRODUCTS[id];
      if (product) {
        itemsHtml += `
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #EEEEEE; color: #3E2723; font-weight: bold; font-size: 14px;">
              ${product.name} <span style="font-size: 12px; color: #888888; margin-left: 5px;">x ${cart[id]}</span>
            </td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #EEEEEE; text-align: right; color: #3E2723; font-weight: bold; font-size: 14px;">
              NT$ ${(product.price * cart[id]).toLocaleString()}
            </td>
          </tr>
        `;
        candyQty += cart[id];
      }
    } else if (cart[id] > 0 && id === '5') { broomQty += cart[id]; }
  }

  // 💡 【核心優化】標籤狀態切換，但內容由資料優先決定
  const isLocked = data.deliveryCity === '外縣市' || data.deliveryCity === '自取' || data.deliveryCity === 'pickup' || data.deliveryCity === 'other';
  
  let fullAddress = data.deliveryCity || '';
  let locationName = ''; let groomInfo = '';

  if (data.specificDetails) {
    const lines = String(data.specificDetails).split('\n');
    const addrLine = lines.find(l => l.startsWith('地址：') || l.startsWith('取貨地址：'));
    if (addrLine) fullAddress = addrLine.replace(/^(地址：|取貨地址：)/, '').trim();
    const locLine = lines.find(l => l.startsWith('地點：') || l.startsWith('餐廳：'));
    if (locLine) locationName = locLine.replace(/^(地點：|餐廳：)/, '').trim();
    const groomLine = lines.find(l => l.startsWith('新人：'));
    if (groomLine) groomInfo = groomLine.replace('新人：', '').trim();
  }

  if (isLocked && (!fullAddress || fullAddress === '自取' || fullAddress === 'pickup')) { fullAddress = '配合商家時間地點自取'; }

  const isWedding = data.eventType === '浪漫婚禮 / 喜宴';
  const names = data.recipientName ? data.recipientName.split(' / ') : [];
  const phones = data.recipientPhone ? data.recipientPhone.split(' / ') : [];

  let recipientHtml = '';
  if (isWedding) {
    recipientHtml = `
      <tr><td class="label">收貨人 1</td><td class="value">${names[0] || '未提供'} <span style="font-size:12px; color:#666;">(${phones[0] || '未提供'})</span></td></tr>
      <tr><td class="label">收貨人 2</td><td class="value">${names[1] || '未提供'} <span style="font-size:12px; color:#666;">(${phones[1] || '未提供'})</span></td></tr>
    `;
  } else {
    recipientHtml = `<tr><td class="label">${isLocked ? '取貨人' : '收貨人'}</td><td class="value">${data.recipientName || '未提供'} <span style="font-size:12px; color:#666;">(${data.recipientPhone || '未提供'})</span></td></tr>`;
  }

  const notesHtml = data.notes ? String(data.notes).replace(/\n/g, '<br/>') : '無';
  const displayTime = data.orderTime ? data.orderTime.split(':').slice(0, 2).join(':') : '';

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, 'Microsoft JhengHei', sans-serif; background-color: #FAF7F2; padding: 20px; }
        .container { background-color: #FFFFFF; border-radius: 16px; padding: 30px; border: 1px solid #E6D5C3; max-width: 800px; margin: auto; }
        .header { text-align: center; border-bottom: 1px solid #E6D5C3; padding-bottom: 20px; margin-bottom: 20px; }
        .title { color: #A52A2A; font-size: 32px; font-weight: bold; margin: 0 0 15px 0; letter-spacing: 4px; font-family: serif; }
        .section-title { color: #A52A2A; font-size: 16px; font-weight: bold; border-bottom: 1px solid #E6D5C3; padding-bottom: 5px; margin-bottom: 15px; margin-top: 25px; }
        .info-table { width: 100%; font-size: 14px; border-collapse: collapse; }
        .info-table td { padding: 6px 0; vertical-align: top; }
        .label { color: #888888; font-weight: bold; width: 90px; }
        .value { color: #3E2723; font-weight: bold; }
        .summary-box { background-color: #FAF7F2; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .delivery-badge { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: bold; margin-top: 5px; }
        .badge-pickup { background-color: #FFF7ED; color: #EA580C; border: 1px solid #FFEDD5; }
        .badge-delivery { background-color: #EFF6FF; color: #2563EB; border: 1px solid #DBEAFE; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 class="title">李伯伯糖葫蘆</h2>
          <div style="font-size: 16px; font-weight: bold; color: #3E2723; margin-bottom: 8px;">訂購單編號 ： ${data.orderNumber}</div>
          <div style="font-size: 16px; color: #3E2723;">訂購時間：${data.orderDate} ${displayTime}</div>
        </div>

        <div class="section-title">交貨方式</div>
        <div class="delivery-badge ${isLocked ? 'badge-pickup' : 'badge-delivery'}">
          ${isLocked ? '🏪 門市自取' : '🚚 專車配送'}
        </div>

        <div class="section-title">活動資訊</div>
        <table class="info-table">
          <tr><td class="label">活動類型</td><td class="value">${data.eventType}</td></tr>
          <tr><td class="label">活動日期</td><td class="value">${data.eventDate || '未填寫'}</td></tr>
          <tr><td class="label">${isLocked ? '取貨時間' : '收貨時間'}</td><td class="value">${data.eventTime || '未填寫'}</td></tr>
          ${locationName ? `<tr><td class="label">${isLocked ? '取貨地點' : '地點名稱'}</td><td class="value">${locationName}</td></tr>` : ''}
          <tr><td class="label">${isLocked ? '取貨地址' : '配送地址'}</td><td class="value">${fullAddress}</td></tr>
        </table>

        <div class="section-title">聯絡資訊</div>
        <table class="info-table">
          <tr><td class="label">訂購人</td><td class="value">${data.ordererName} <span style="font-size:12px; color:#666;">(${data.ordererPhone})</span></td></tr>
          ${data.ordererEmail ? `<tr><td class="label">電子信箱</td><td class="value">${data.ordererEmail}</td></tr>` : ''}
          ${recipientHtml}
          ${groomInfo && groomInfo !== '未提供' ? `<tr><td class="label">新人資訊</td><td class="value">${groomInfo}</td></tr>` : ''}
          ${data.notes ? `<tr><td class="label">備註</td><td class="value" style="line-height: 1.5;">${notesHtml}</td></tr>` : ''}
        </table>

        <div class="section-title">購買項目</div>
        <div class="summary-box">
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsHtml}
          </table>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; border-top: 1px solid #E6D5C3; padding-top: 10px;">
            <tr>
              <td style="padding: 6px 0; color: #666666; font-size: 13px;">商品小計 (${candyQty} 支)</td>
              <td style="padding: 6px 0; text-align: right; color: #666666; font-size: 13px;">NT$ ${(data.candyTotal || 0).toLocaleString()}</td>
            </tr>
            ${broomQty > 0 ? `
            <tr>
              <td style="padding: 6px 0; color: #666666; font-size: 13px;">掃帚租金 (${broomQty} 組)</td>
              <td style="padding: 6px 0; text-align: right; color: #666666; font-size: 13px;">NT$ ${(data.broomRent || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #059669; font-size: 13px; font-weight: bold;">掃帚押金 (歸還後退回)</td>
              <td style="padding: 6px 0; text-align: right; color: #059669; font-size: 13px; font-weight: bold;">NT$ ${(data.broomDeposit || 0).toLocaleString()}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 6px 0; color: #666666; font-size: 13px;">配送運費</td>
              <td style="padding: 6px 0; text-align: right; color: #666666; font-size: 13px;">NT$ ${(data.shippingFee || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 15px 0 0 0; color: #3E2723; font-size: 16px; font-weight: bold; border-top: 1px solid #E6D5C3; margin-top: 10px;">預估總金額</td>
              <td style="padding: 15px 0 0 0; text-align: right; color: #A52A2A; font-size: 20px; font-weight: bold; border-top: 1px solid #E6D5C3; margin-top: 10px;">NT$ ${(data.totalAmount || 0).toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <div class="section-title">商家資訊</div>
        <div class="summary-box" style="margin-top: 10px; padding: 20px; border-radius: 8px;">
           <div style="color: #A52A2A; font-size: 18px; font-weight: bold; margin-bottom: 12px; letter-spacing: 1px;">寧夏夜市古早味糖葫蘆</div>
           <table style="font-size: 14px; color: #3E2723; border-collapse: collapse; line-height: 1.8; width: 100%;">
             <tr>
               <td style="color: #D2B48C; padding-right: 8px; vertical-align: top; font-size: 16px; font-weight: bold; width: 15px;">●</td>
               <td><span style="font-weight: bold; color: #888888;">地址：</span>臺北市大同區寧夏夜市第61號攤位 (蓬萊國小前)</td>
             </tr>
             <tr>
               <td style="color: #D2B48C; padding-right: 8px; vertical-align: top; font-size: 16px; font-weight: bold;">●</td>
               <td><span style="font-weight: bold; color: #888888;">聯絡電話：</span>0912-294-022</td>
             </tr>
             <tr>
               <td style="color: #D2B48C; padding-right: 8px; vertical-align: top; font-size: 16px; font-weight: bold;">●</td>
               <td><span style="font-weight: bold; color: #888888;">營業時間：</span>18:00 ~ 23:00</td>
             </tr>
           </table>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const blob = HtmlService.createHtmlOutput(htmlTemplate).getAs('application/pdf');
  blob.setName(`李伯伯糖葫蘆_訂單明細_${data.orderNumber}.pdf`);
  return blob;
}

function sendLineOfficialMessage(text) {
  const messageText = text ? String(text).trim() : "⚠️ 系統測試正常。"; if (!messageText) return;
  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = { to: LINE_ADMIN_USER_ID, messages: [{ type: 'text', text: messageText }] };
  const options = { method: 'post', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN }, payload: JSON.stringify(payload), muteHttpExceptions: true };
  try {
    const response = UrlFetchApp.fetch(url, options); const responseCode = response.getResponseCode();
    if (responseCode === 429) { Logger.log("⚠️ LINE 訊息發送失敗：本月免費額度已達上限。"); } 
    else if (responseCode !== 200) { Logger.log("❌ LINE API 發生其他錯誤，代碼：" + responseCode); }
  } catch (e) { Logger.log("🚨 LINE 連線異常：" + e.toString()); }
}

function autoArchiveOldOrdersByYear() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(); const sourceSheet = ss.getSheetByName(SHEET_TAB_NAME); if (!sourceSheet) { return; }
  const lastRow = sourceSheet.getLastRow(); if (lastRow <= 1) { return; }
  const data = sourceSheet.getRange(2, 1, lastRow - 1, sourceSheet.getLastColumn()).getValues();
  const today = new Date(); const oneYearAgo = new Date(); oneYearAgo.setFullYear(today.getFullYear() - 1);
  const archiveGroups = {}; const rowsToKeep = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i]; const orderDateVal = row[0]; const orderDate = orderDateVal instanceof Date ? orderDateVal : new Date(orderDateVal);
    if (orderDate < oneYearAgo) {
      const year = orderDate.getFullYear(); const sheetName = "封存_" + year;
      if (!archiveGroups[sheetName]) archiveGroups[sheetName] = [];
      archiveGroups[sheetName].push(row);
    } else { rowsToKeep.push(row); }
  }
  for (const sheetName in archiveGroups) {
    let targetSheet = ss.getSheetByName(sheetName);
    if (!targetSheet) {
      targetSheet = ss.insertSheet(sheetName);
      const headers = sourceSheet.getRange(1, 1, 1, sourceSheet.getLastColumn()).getValues();
      targetSheet.appendRow(headers[0]);
      targetSheet.getRange(1, 1, 1, headers[0].length).setFontWeight("bold").setBackground("#EFEFEF");
      targetSheet.setFrozenRows(1);
    }
    const moveData = archiveGroups[sheetName];
    targetSheet.getRange(targetSheet.getLastRow() + 1, 1, moveData.length, moveData[0].length).setValues(moveData);
  }
  sourceSheet.getRange(2, 1, sourceSheet.getLastRow(), sourceSheet.getLastColumn()).clearContent();
  if (rowsToKeep.length > 0) { sourceSheet.getRange(2, 1, rowsToKeep.length, rowsToKeep[0].length).setValues(rowsToKeep); }
}

function getDailyCandyCount(sheet, targetDateStr) {
  const dataRows = sheet.getDataRange().getValues(); let totalCandies = 0;
  for (let i = 1; i < dataRows.length; i++) {
    let rDate = dataRows[i][9]; let rDateStr = "";
    if (rDate instanceof Date) { rDateStr = Utilities.formatDate(rDate, "GMT+8", "yyyy-MM-dd"); } 
    else if (rDate) { rDateStr = String(rDate).replace(/\//g, '-'); }
    if (rDateStr === targetDateStr) {
      let cartStr = dataRows[i][20];
      if (cartStr) {
        try {
          let cartObj = JSON.parse(cartStr);
          for (let id in cartObj) { if (id !== '5' && cartObj[id] > 0) { totalCandies += parseInt(cartObj[id], 10); } }
        } catch(e) {}
      }
    }
  }
  return totalCandies;
}