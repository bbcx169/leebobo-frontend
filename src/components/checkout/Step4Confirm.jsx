// src/components/checkout/Step4Confirm.jsx

import React from 'react';

const Step4Confirm = ({ 
  formData, 
  cart, 
  products, 
  candyQty, 
  broomQty, 
  candySubtotal, 
  broomRent, 
  broomDeposit, 
  shippingFee, 
  shippingHint, 
  totalPrice 
}) => {
  // 💡 內聚顯示邏輯 1：縣市對照
  const cityMap = { taipei: '臺北市', new_taibei: '新北市', new_taipei: '新北市', pickup: '自取' };
  const currentCityName = cityMap[formData.deliveryCity] || '請選擇縣市';
  const isLocked = formData.deliveryCity === 'pickup';

  // 💡 內聚顯示邏輯 2：明細列渲染函數
  const renderDetailRow = (label, value) => (
    <React.Fragment>
      <span className="text-darkWood/60 font-medium">{label}</span>
      <span className={`text-darkWood font-bold ${!value || value === '未提供' ? 'text-gray-400 font-normal' : ''}`}>
        {value || '未提供'}
      </span>
    </React.Fragment>
  );

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <h2 className="text-2xl font-bold text-darkWood mb-6 font-serif flex items-center gap-2">
        <span className="bg-amberRed/10 p-2 rounded-lg text-amberRed">04</span> 確認訂單明細
      </h2>
      
      <div className="bg-white p-6 rounded-2xl border border-warmWood/30 shadow-sm space-y-6 text-sm">
        
        {/* 💡 顧問優化：交貨方式視覺標籤 (加上 SVG 圖示並對齊) */}
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

        {/* 區塊 1：活動資訊 (加上 SVG 圖示並對齊) */}
        <div className="space-y-3 pt-2">
          <h3 className="text-base font-bold text-amberRed border-b border-warmWood/20 pb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            活動資訊
          </h3>
          <div className="grid grid-cols-[80px_1fr] gap-y-2">
            {renderDetailRow('活動類型', formData.eventType === 'wedding' ? '浪漫婚禮 / 喜宴' : formData.eventType === 'school' ? '校園活動 / 園遊會' : '其他')}
            {renderDetailRow('活動日期', formData.weddingDate || formData.generalDate)}
            {isLocked ? (
              <>
                {renderDetailRow('取貨時間', '需配合商家時間地點自取')}
                {renderDetailRow('取貨地址', '需配合商家時間地點自取')}
              </>
            ) : (
              <>
                {renderDetailRow('收貨時間', formData.weddingTime || formData.generalTime)}
                {renderDetailRow('地點名稱', formData.eventType === 'wedding' ? formData.weddingLocation : formData.generalLocation)}
                {renderDetailRow('配送地址', `${currentCityName}${formData.eventType === 'wedding' ? formData.weddingAddress : formData.generalAddress}`)}
              </>
            )}
          </div>
        </div>

        {/* 區塊 2：聯絡資訊 (加上 SVG 圖示並對齊) */}
        <div className="space-y-3 pt-2">
          <h3 className="text-base font-bold text-amberRed border-b border-warmWood/20 pb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            聯絡資訊
          </h3>
          <div className="grid grid-cols-[80px_1fr] gap-y-2">
            {renderDetailRow('訂購人', `${formData.ordererName || '未提供'} (${formData.ordererPhone || '未提供'})`)}
            {renderDetailRow('電子信箱', formData.ordererEmail)}
            
            {formData.eventType === 'wedding' ? (
              <>
                {renderDetailRow('收貨人 1', `${formData.recipientName || '未提供'} (${formData.recipientPhone || '未提供'})`)}
                {renderDetailRow('收貨人 2', `${formData.recipientName2 || '未提供'} (${formData.recipientPhone2 || '未提供'})`)}
              </>
            ) : (
              renderDetailRow(isLocked ? '取貨人' : '收貨人', `${formData.recipientName || '未提供'} (${formData.recipientPhone || '未提供'})`)
            )}
            
            {renderDetailRow('備註', formData.notes)}
          </div>
        </div>

        {/* 區塊 3：購買明細 */}
        <div className="bg-creamBg/50 p-5 rounded-xl border border-warmWood/20">
          <h3 className="text-base font-bold text-darkWood border-b border-warmWood/20 pb-2 mb-3">購買明細</h3>
          <div className="space-y-3 mb-4">
            {Object.entries(cart).map(([id, qty]) => {
              if (parseInt(id) === 5 || qty === 0) return null;
              const product = products.find(p => p.id === parseInt(id));
              return (
                <div key={id} className="flex justify-between items-center">
                  <span className="text-darkWood font-medium">{product?.name} <span className="text-darkWood/50 ml-1 text-xs">x {qty}</span></span>
                  <span className="text-darkWood font-bold">NT$ {(product?.price * qty).toLocaleString()}</span>
                </div>
              );
            })}
            
            {broomQty > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-darkWood font-medium">承租掃帚 (租金) <span className="text-darkWood/50 ml-1 text-xs">x {broomQty}</span></span>
                  <span className="text-darkWood font-bold">NT$ {broomRent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-600 font-medium">掃帚押金 (歸還後退回)</span>
                  <span className="text-emerald-600 font-bold">NT$ {broomDeposit.toLocaleString()}</span>
                </div>
              </>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-darkWood font-medium">配送運費 <span className="text-amberRed text-xs ml-1">{shippingHint}</span></span>
              <span className="text-darkWood font-bold">NT$ {shippingFee.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="pt-4 border-t border-warmWood/20 flex justify-between items-end">
            <span className="text-sm font-bold text-darkWood">預估總金額</span>
            <span className="text-2xl font-black text-amberRed">NT$ {totalPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4Confirm;