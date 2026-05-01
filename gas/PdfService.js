/**
 * ==========================================
 * 李伯伯糖葫蘆 - PDF 處理服務 (PdfService.gs)
 * ==========================================
 * 此檔案負責將訂單資料進行前置處理（計算數量、判斷地址等），
 * 並將變數注入 HTML 模板 (PdfTemplate.html) 生成 PDF 檔案 (Blob)。
 */

const PdfService = {
  // 根據訂單資料生成 PDF Blob
  generateOrderPdfBlob: function(data) {
    const cart = data.cart || {};
    let itemsHtml = ''; 
    let candyQty = 0; 
    let broomQty = 0;
    
    // 1. 處理商品明細與數量計算
    for (let id in cart) {
      if (cart[id] > 0 && id !== '5') {
        // 從 EnvConfig.gs 取得產品資訊
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
      } else if (cart[id] > 0 && id === '5') { 
        broomQty += cart[id]; 
      }
    }

    // 2. 判斷交貨方式與地址邏輯
    const isLocked = data.deliveryCity === '外縣市' || data.deliveryCity === '自取' || data.deliveryCity === 'pickup' || data.deliveryCity === 'other';
    
    let fullAddress = data.deliveryCity || '';
    let locationName = ''; 

    // 解析特殊詳細資訊
    if (data.specificDetails) {
      const lines = String(data.specificDetails).split('\n');
      
      const addrLine = lines.find(l => l.startsWith('地址：') || l.startsWith('取貨地址：'));
      if (addrLine) fullAddress = addrLine.replace(/^(地址：|取貨地址：)/, '').trim();
      
      const locLine = lines.find(l => l.startsWith('地點：'));
      if (locLine) locationName = locLine.replace(/^地點：/, '').trim();
    }

    if (isLocked && (!fullAddress || fullAddress === '自取' || fullAddress === 'pickup')) { 
      fullAddress = '配合商家時間地點自取'; 
    }

    // 3. 處理收貨人資訊 (婚禮雙代收人邏輯)
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

    // 4. 備註與時間格式化
    const notesHtml = data.notes ? String(data.notes).replace(/\n/g, '<br/>') : '無';
    const displayTime = data.orderTime ? data.orderTime.split(':').slice(0, 2).join(':') : '';

    // 5. 呼叫 HTML 模板並注入變數
    const template = HtmlService.createTemplateFromFile('PdfTemplate');
    template.data = data;
    template.candyQty = candyQty;
    template.broomQty = broomQty;
    template.itemsHtml = itemsHtml;
    template.isLocked = isLocked;
    template.fullAddress = fullAddress;
    template.locationName = locationName;
    template.recipientHtml = recipientHtml;
    template.notesHtml = notesHtml;
    template.displayTime = displayTime;

    // 6. 渲染並產出 PDF Blob
    const htmlOutput = template.evaluate();
    const blob = htmlOutput.getAs('application/pdf');
    blob.setName(`李伯伯糖葫蘆_訂單明細_${data.orderNumber}.pdf`);
    
    return blob;
  }
};