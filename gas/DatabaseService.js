/**
 * ==========================================
 * 李伯伯糖葫蘆 - 資料庫服務 (DatabaseService.gs)
 * ==========================================
 * 此檔案封裝所有對 Google Sheets 的讀取與寫入操作。
 * 其他服務只需呼叫此處的方法，無需關心底層試算表的欄位細節。
 */

const DatabaseService = {

  // 取得主要工作表
  getMainSheet: function() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    return ss.getSheetByName(SHEET_TAB_NAME) || ss.getSheets()[0];
  },

  // 取得特定日期的糖葫蘆數量 (用於計算產能)
  getDailyCandyCount: function(targetDateStr) {
    const sheet = this.getMainSheet();
    const dataRows = sheet.getDataRange().getValues();
    let totalCandies = 0;
    
    for (let i = 1; i < dataRows.length; i++) {
      let rDate = dataRows[i][9];
      let rDateStr = "";
      
      if (rDate instanceof Date) {
        rDateStr = Utilities.formatDate(rDate, "GMT+8", "yyyy-MM-dd");
      } else if (rDate) {
        rDateStr = String(rDate).replace(/\//g, '-');
      }
      
      if (rDateStr === targetDateStr) {
        let cartStr = dataRows[i][20];
        if (cartStr) {
          try {
            let cartObj = JSON.parse(cartStr);
            for (let id in cartObj) {
              // 排除掃帚(id='5')，只計算糖葫蘆數量
              if (id !== '5' && cartObj[id] > 0) {
                totalCandies += parseInt(cartObj[id], 10);
              }
            }
          } catch(e) {}
        }
      }
    }
    return totalCandies;
  },

  // 儲存新訂單
  saveNewOrder: function(data, pdfUrl) {
    const sheet = this.getMainSheet();
    
    // 確保表頭存在
    if (sheet.getLastRow() === 0) {
      const headers = ["訂單建立日期", "訂單建立時間", "訂購明細單編號", "訂購人", "訂購人電話", "收貨人", "收貨人電話", "配送縣市", "活動類型", "活動日期", "活動時間", "詳細資訊 (地點名稱與地址)", "訂購明細", "糖葫蘆小計", "掃帚租金", "掃帚押金", "運費", "總金額", "備註", "聯絡信箱", "購物車原始資料", "PDF下載連結", "是否修改過"];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#F3F4F6");
      sheet.setFrozenRows(1);
    }

    const rowData = [
      data.orderDate || "", 
      data.orderTime || "", 
      data.orderNumber || "", 
      data.ordererName || "", 
      data.ordererPhone ? "'" + data.ordererPhone : "", 
      data.recipientName || "", 
      data.recipientPhone ? "'" + data.recipientPhone : "", 
      data.deliveryCity || "", 
      data.eventType || "", 
      data.eventDate || "", 
      data.eventTime || "", 
      data.specificDetails || "", 
      data.itemsList || "", 
      data.candyTotal || 0, 
      data.broomRent || 0, 
      data.broomDeposit || 0, 
      data.shippingFee || 0, 
      data.totalAmount || "", 
      data.notes || "", 
      data.ordererEmail || "", 
      JSON.stringify(data.cart || {}), 
      pdfUrl || "", 
      ""
    ];
    
    sheet.appendRow(rowData);
    return sheet.getLastRow(); // 回傳新行號
  },

  // 修改訂單 (時間/日期/備註)
  updateOrder: function(orderNumber, newDate, newTime, newDetails, newNotes, newPdfUrl) {
    const sheet = this.getMainSheet();
    const dataRows = sheet.getDataRange().getValues();
    let targetRowIndex = -1;
    
    // 從後面找比較快，因為要找最新的訂單
    for (let i = dataRows.length - 1; i >= 1; i--) {
      if (dataRows[i][2] === orderNumber) { 
        targetRowIndex = i + 1;
        break; 
      }
    }

    if (targetRowIndex !== -1) {
      // 更新日期時間
      sheet.getRange(targetRowIndex, 10).setValue(newDate);
      sheet.getRange(targetRowIndex, 11).setValue(newTime);
      
      let updatedDetails = dataRows[targetRowIndex - 1][11];
      if (newDetails !== undefined) {
        updatedDetails = newDetails;
        sheet.getRange(targetRowIndex, 12).setValue(updatedDetails);
      }

      let finalNotes = dataRows[targetRowIndex - 1][18];
      if (newNotes !== undefined) {
        finalNotes = newNotes;
        sheet.getRange(targetRowIndex, 19).setValue(finalNotes);
      }

      // 標記為已修改
      sheet.getRange(targetRowIndex, 23).setValue("TRUE");
      
      // 更新 PDF 網址
      if(newPdfUrl) {
        sheet.getRange(targetRowIndex, 22).setValue(newPdfUrl);
      }

      // 回傳更新後的完整該行資料，方便後續重建 PDF
      const rowData = sheet.getRange(targetRowIndex, 1, 1, 23).getValues()[0];
      return {
        orderDate: rowData[0] instanceof Date ? Utilities.formatDate(rowData[0], "GMT+8", "yyyy/MM/dd") : rowData[0],
        orderTime: rowData[1] instanceof Date ? Utilities.formatDate(rowData[1], "GMT+8", "HH:mm:ss") : rowData[1],
        orderNumber: rowData[2], 
        ordererName: rowData[3], 
        ordererPhone: String(rowData[4]).replace(/^'/, ''),
        recipientName: rowData[5], 
        recipientPhone: String(rowData[6]).replace(/^'/, ''), 
        deliveryCity: rowData[7],
        eventType: rowData[8], 
        eventDate: newDate, 
        eventTime: newTime, 
        specificDetails: updatedDetails, 
        itemsList: rowData[12], 
        candyTotal: rowData[13], 
        broomRent: rowData[14], 
        broomDeposit: rowData[15],
        shippingFee: rowData[16], 
        totalAmount: rowData[17], 
        notes: finalNotes, 
        ordererEmail: rowData[19],
        cart: rowData[20] ? JSON.parse(rowData[20]) : {},
        isModified: true
      };
    }
    return null; // 找不到訂單
  },

  // 取得所有訂單 (供後台使用)
  getAllOrders: function() {
    const sheet = this.getMainSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    
    const dataRows = sheet.getRange(2, 1, lastRow - 1, 23).getValues();
    let orders = [];
    
    for (let i = dataRows.length - 1; i >= 0; i--) {
      const r = dataRows[i];
      const safeDate = v => v instanceof Date ? Utilities.formatDate(v, "GMT+8", "yyyy-MM-dd") : v;
      const safeTime = v => v instanceof Date ? Utilities.formatDate(v, "GMT+8", "HH:mm") : v;
      
      orders.push({
        orderDate: r[0] instanceof Date ? Utilities.formatDate(r[0], "GMT+8", "yyyy/MM/dd") : r[0],
        orderTime: r[1] instanceof Date ? Utilities.formatDate(r[1], "GMT+8", "HH:mm:ss") : r[1],
        orderNumber: r[2], 
        ordererName: r[3], 
        ordererPhone: String(r[4]).replace(/^'/, ''), 
        recipientName: r[5], 
        recipientPhone: String(r[6]).replace(/^'/, ''),
        deliveryCity: r[7], 
        eventType: r[8], 
        eventDate: safeDate(r[9]), 
        eventTime: safeTime(r[10]), 
        specificDetails: r[11], 
        itemsList: r[12],
        candySubtotal: r[13] || 0, 
        broomRent: r[14] || 0, 
        broomDeposit: r[15] || 0, 
        shippingFee: r[16] || 0, 
        totalPrice: r[17] || 0,
        notes: r[18] || '', 
        ordererEmail: r[19] || '', 
        cart: r[20] ? JSON.parse(r[20]) : {}, 
        pdfDownloadUrl: r[21] || '',
        isModified: r[22] === "TRUE" || r[22] === true
      });
    }
    return orders;
  },

  // 查詢特定訂單 (供前台查詢使用)
  queryOrder: function(name, phone, date) {
    const sheet = this.getMainSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    
    const dataRows = sheet.getRange(2, 1, lastRow - 1, 23).getValues();
    const cleanStr = str => String(str).replace(/[\s\-\'\"\/\\]/g, '');
    const formatDate = val => {
      if (val instanceof Date) { 
        const yyyy = val.getFullYear(); 
        const mm = String(val.getMonth() + 1).padStart(2, '0'); 
        const dd = String(val.getDate()).padStart(2, '0'); 
        return `${yyyy}${mm}${dd}`; 
      }
      return cleanStr(val);
    };
    
    const qName = cleanStr(name); 
    const qPhone = cleanStr(phone); 
    const qDate = formatDate(date);
    let matches = []; 
    
    for (let i = dataRows.length - 1; i >= 0; i--) {
      const r = dataRows[i]; 
      const rName = cleanStr(r[3]); 
      const rPhone = cleanStr(r[4]); 
      const rDate = formatDate(r[9]);
      
      if (rName === qName && rPhone === qPhone && rDate === qDate) {
        const safeDate = val => val instanceof Date ? Utilities.formatDate(val, "GMT+8", "yyyy-MM-dd") : val; 
        const safeTime = val => val instanceof Date ? Utilities.formatDate(val, "GMT+8", "HH:mm") : val;
        matches.push({
          orderDate: r[0] instanceof Date ? Utilities.formatDate(r[0], "GMT+8", "yyyy/MM/dd") : r[0], 
          orderTime: r[1] instanceof Date ? Utilities.formatDate(r[1], "GMT+8", "HH:mm:ss") : r[1], 
          orderNumber: r[2], 
          ordererName: r[3], 
          ordererPhone: String(r[4]).replace(/^'/, ''), 
          recipientName: r[5], 
          recipientPhone: String(r[6]).replace(/^'/, ''),
          deliveryCity: r[7], 
          eventType: r[8], 
          eventDate: safeDate(r[9]), 
          eventTime: safeTime(r[10]), 
          specificDetails: r[11], 
          itemsList: r[12],
          candySubtotal: r[13] || 0, 
          broomRent: r[14] || 0, 
          broomDeposit: r[15] || 0, 
          shippingFee: r[16] || 0, 
          totalPrice: r[17] || 0, 
          notes: r[18] || '', 
          ordererEmail: r[19] || '', 
          cart: r[20] ? JSON.parse(r[20]) : {}, 
          pdfDownloadUrl: r[21] || '',
          isModified: r[22] === "TRUE" || r[22] === true
        });
      }
    }
    return matches;
  },

  // 年度封存舊訂單
  autoArchiveOldOrdersByYear: function() {
    const ss = SpreadsheetApp.getActiveSpreadsheet(); 
    const sourceSheet = this.getMainSheet(); 
    if (!sourceSheet) return;
    
    const lastRow = sourceSheet.getLastRow(); 
    if (lastRow <= 1) return;
    
    const data = sourceSheet.getRange(2, 1, lastRow - 1, sourceSheet.getLastColumn()).getValues();
    const today = new Date(); 
    const oneYearAgo = new Date(); 
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    const archiveGroups = {}; 
    const rowsToKeep = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i]; 
      const orderDateVal = row[0]; 
      const orderDate = orderDateVal instanceof Date ? orderDateVal : new Date(orderDateVal);
      
      if (orderDate < oneYearAgo) {
        const year = orderDate.getFullYear(); 
        const sheetName = "封存_" + year;
        if (!archiveGroups[sheetName]) archiveGroups[sheetName] = [];
        archiveGroups[sheetName].push(row);
      } else { 
        rowsToKeep.push(row); 
      }
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
    if (rowsToKeep.length > 0) { 
      sourceSheet.getRange(2, 1, rowsToKeep.length, rowsToKeep[0].length).setValues(rowsToKeep); 
    }
  }
};