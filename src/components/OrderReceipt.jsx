// src/components/OrderReceipt.jsx

import React from 'react';

const OrderReceipt = ({ order, products }) => {
  // 防呆：若無資料則不渲染
  if (!order || !order.payload) return null;

  const p = order.payload;
  const { 
    cart, 
    candyQty, 
    broomQty, 
    candySubtotal, 
    broomRent, 
    broomDeposit, 
    shippingFee, 
    totalPrice,
    orderNumber 
  } = order;

  // 處理時間格式：將 HH:mm:ss 轉換為 HH:mm (不顯示秒數)
  const displayTime = p.orderTime ? p.orderTime.split(':').slice(0, 2).join(':') : '';

  // 判斷是否為自取/外縣市
  const isLocked = p.deliveryCity === '外縣市' || p.deliveryCity === '自取';

  // 💡 智慧解析：從 specificDetails 中提取出對應的欄位，完美還原 Checkout 的排版
  let fullAddress = isLocked ? '配合商家時間地點自取' : p.deliveryCity;
  let locationName = '';
  let groomName = '';

  if (p.specificDetails) {
    const lines = p.specificDetails.split('\n');
    
    // 找尋地址
    const addrLine = lines.find(l => l.startsWith('地址：'));
    if (addrLine && !isLocked) fullAddress = addrLine.replace('地址：', '');
    
    // 找尋地點名稱或餐廳
    const locLine = lines.find(l => l.startsWith('地點：') || l.startsWith('餐廳：'));
    if (locLine) locationName = locLine.replace(/^(地點：|餐廳：)/, '');

    // 找尋新人資訊
    const groomLine = lines.find(l => l.startsWith('新人：'));
    if (groomLine) groomName = groomLine.replace('新人：', '');
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl border border-warmWood/30 shadow-sm space-y-6 text-sm animate-[fadeIn_0.5s_ease-out]">
      
      {/* 💡 標頭：訂購單編號字體與時間大小一致，但保持粗體 */}
      <div className="text-center border-b border-warmWood/20 pb-6 mb-2">
        <h2 className="text-3xl md:text-4xl font-bold text-amberRed mb-4 tracking-widest font-serif">
          李伯伯糖葫蘆
        </h2>
        <div className="text-darkWood/80 space-y-1 font-medium">
          <p className="text-base font-bold text-darkWood">
            訂購單編號 ： {orderNumber || p.orderNumber}
          </p>
          <p className="text-base opacity-90">
            訂購時間：{p.orderDate} {displayTime}
          </p>
        </div>
      </div>

      {/* 區塊 1：活動資訊 (與 Checkout 完全同步) */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-amberRed border-b border-warmWood/20 pb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          活動資訊
        </h3>
        <div className="grid grid-cols-[80px_1fr] gap-y-2">
          <span className="text-darkWood/60 font-medium">活動類型</span>
          <span className="text-darkWood font-bold">{p.eventType}</span>
          
          <span className="text-darkWood/60 font-medium">活動日期</span>
          <span className="text-darkWood font-bold">{p.eventDate}</span>
          
          <span className="text-darkWood/60 font-medium">收貨時間</span>
          <span className="text-darkWood font-bold">{p.eventTime}</span>
          
          <span className="text-darkWood/60 font-medium">配送地址</span>
          <span className="text-darkWood font-bold leading-relaxed">{fullAddress}</span>
          
          {!isLocked && locationName ? (
            <>
              <span className="text-darkWood/60 font-medium">地點名稱</span>
              <span className="text-darkWood font-bold">{locationName}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* 區塊 2：聯絡資訊 (與 Checkout 完全同步) */}
      <div className="space-y-3 pt-2">
        <h3 className="text-base font-bold text-amberRed border-b border-warmWood/20 pb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          聯絡資訊
        </h3>
        <div className="grid grid-cols-[80px_1fr] gap-y-2">
          <span className="text-darkWood/60 font-medium">訂購人</span>
          <span className="text-darkWood font-bold">{p.ordererName} <span className="text-darkWood/60 text-xs ml-1">({p.ordererPhone})</span></span>
          
          {p.ordererEmail ? (
            <>
              <span className="text-darkWood/60 font-medium">電子信箱</span>
              <span className="text-darkWood font-bold">{p.ordererEmail}</span>
            </>
          ) : null}

          <span className="text-darkWood/60 font-medium">收貨人</span>
          <span className="text-darkWood font-bold">{p.recipientName} <span className="text-darkWood/60 text-xs ml-1">({p.recipientPhone})</span></span>
          
          {p.eventType === '浪漫婚禮 / 喜宴' && groomName && groomName !== '未提供' ? (
            <>
              <span className="text-darkWood/60 font-medium">新人資訊</span>
              <span className="text-darkWood font-bold">{groomName}</span>
            </>
          ) : null}
          
          {p.notes ? (
            <>
              <span className="text-darkWood/60 font-medium">備註</span>
              <span className="text-darkWood font-medium whitespace-pre-wrap">{p.notes}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* 區塊 3：購買項目 (完全相同) */}
      <div className="space-y-3 bg-creamBg/50 p-4 rounded-xl border border-warmWood/20">
        <h3 className="text-base font-bold text-darkWood border-b border-warmWood/20 pb-2">購買項目</h3>
        <div className="space-y-2">
          {Object.entries(cart || {}).filter(([id, q]) => parseInt(id) !== 5 && q > 0).map(([id, q]) => {
            const product = products.find(prod => prod.id === parseInt(id));
            if (!product) return null;
            return (
              <div key={id} className="flex justify-between text-darkWood font-medium">
                <span>{product.name} <span className="text-xs text-darkWood/60 ml-1">x {q}</span></span>
                <span>NT$ {(product.price * q).toLocaleString()}</span>
              </div>
            );
          })}
        </div>
        
        <div className="border-t border-warmWood/20 pt-3 mt-3 space-y-2">
          <div className="flex justify-between text-darkWood/70 text-xs">
            <span>商品小計 ({candyQty} 支)</span>
            <span>NT$ {candySubtotal?.toLocaleString()}</span>
          </div>
          
          {broomQty > 0 && (
            <>
              <div className="flex justify-between text-darkWood/70 text-xs">
                <span>掃帚租金 ({broomQty} 組)</span>
                <span>NT$ {broomRent?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold text-xs">
                <span>掃帚押金 (歸還後退回)</span>
                <span>NT$ {broomDeposit?.toLocaleString()}</span>
              </div>
            </>
          )}
          
          <div className="flex justify-between text-darkWood/70 text-xs">
            <span>配送運費</span>
            <span>NT$ {shippingFee?.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between text-darkWood font-bold text-lg pt-3 mt-3 border-t border-warmWood/30">
            <span>預估總金額</span>
            <span className="text-amberRed">NT$ {totalPrice?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderReceipt;