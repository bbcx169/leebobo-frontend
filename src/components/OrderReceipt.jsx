// src/components/OrderReceipt.jsx

import React from 'react';
import { parseSpecificDetails } from '../utils/orderDetails';

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

  // 判斷是否為自取
  const isLocked = p.deliveryCity === '自取' || p.deliveryCity === 'pickup';

  // 💡 顧問優化：統一處理「未提供」顯示的工具函數
  const renderDetailRow = (label, value) => (
    <React.Fragment>
      <span className="text-darkWood/60 font-medium">{label}</span>
      <span className={`text-darkWood font-bold ${!value || value === '未提供' ? 'text-gray-400 font-normal' : ''}`}>
        {value || '未提供'}
      </span>
    </React.Fragment>
  );

  const { address: detailAddress, locationName: locationText } = parseSpecificDetails(p.specificDetails);

  // 💡 雙代收人拆解邏輯
  const isWedding = p.eventType === '浪漫婚禮 / 喜宴';
  const names = p.recipientName ? p.recipientName.split(' / ') : [];
  const phones = p.recipientPhone ? p.recipientPhone.split(' / ') : [];

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl border border-warmWood/30 shadow-sm space-y-6 text-sm animate-[fadeIn_0.5s_ease-out]">
      
      {/* 標頭區塊 */}
      <div className="text-center border-b border-warmWood/20 pb-6 mb-2">
        <h2 className="text-3xl md:text-4xl font-bold text-amberRed mb-4 tracking-widest font-serif">
          李伯伯糖葫蘆
        </h2>
        <div className="text-darkWood/80 space-y-1 font-medium">
          <p className="text-base font-bold text-darkWood">
            訂購單編號 ： {orderNumber || p.orderNumber || '未提供'}
          </p>
          <p className="text-base opacity-90">
            訂購時間：{p.orderDate || '未提供'} {displayTime}
          </p>
        </div>
      </div>

      {/* 💡 顧問新增：交貨方式區塊 (位於活動資訊上方) */}
      <div className="space-y-3 pt-2">
        <h3 className="text-base font-bold text-amberRed border-b border-warmWood/20 pb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          交貨方式
        </h3>
        <div className="pt-1">
          {isLocked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-sm font-bold shadow-sm">
              🏪 門市自取
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-sm font-bold shadow-sm">
              🚚 專車配送
            </span>
          )}
        </div>
      </div>

      {/* 區塊 1：活動資訊 */}
      <div className="space-y-3 pt-2">
        <h3 className="text-base font-bold text-amberRed border-b border-warmWood/20 pb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          活動資訊
        </h3>
        <div className="grid grid-cols-[80px_1fr] gap-y-2">
          {renderDetailRow('活動類型', p.eventType)}
          {renderDetailRow('活動日期', p.eventDate)}
          
          {isLocked ? (
            <>
              {renderDetailRow('取貨時間', '需配合商家時間地點自取')}
              {renderDetailRow('取貨地址', '需配合商家時間地點自取')}
            </>
          ) : (
            <>
              {renderDetailRow('收貨時間', p.eventTime)}
              {renderDetailRow('地點名稱', locationText)}
              {renderDetailRow('配送地址', detailAddress)}
            </>
          )}
        </div>
      </div>

      {/* 區塊 2：聯絡資訊 */}
      <div className="space-y-3 pt-2">
        <h3 className="text-base font-bold text-amberRed border-b border-warmWood/20 pb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          聯絡資訊
        </h3>
        <div className="grid grid-cols-[80px_1fr] gap-y-2">
          {renderDetailRow('訂購人', `${p.ordererName || '未提供'} (${p.ordererPhone || '未提供'})`)}
          {renderDetailRow('電子信箱', p.ordererEmail)}
          
          {/* 💡 根據模式切換收貨人顯示 */}
          {isWedding ? (
            <>
              {renderDetailRow('收貨人 1', names[0] ? `${names[0]} (${phones[0]})` : '未提供')}
              {renderDetailRow('收貨人 2', names[1] ? `${names[1]} (${phones[1]})` : '未提供')}
            </>
          ) : (
            renderDetailRow(isLocked ? '取貨人' : '收貨人', `${p.recipientName || '未提供'} (${p.recipientPhone || '未提供'})`)
          )}
          
          {renderDetailRow('備註', p.notes)}
        </div>
      </div>

      {/* 區塊 3：購買項目 */}
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
