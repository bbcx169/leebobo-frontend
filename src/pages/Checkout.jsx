// src/pages/Checkout.jsx

import React, { useState, useEffect } from 'react';
import { products, getMinDate, initialFormData } from '../constants/data';
import useScrollFadeIn from '../hooks/useScrollFadeIn';
import CartSummary from '../components/CartSummary';

const Checkout = ({ 
  cart, 
  updateCart, 
  handleQuantityChange, 
  navigateTo, 
  onOrderSuccess, 
  setAlertMsg 
}) => {
  useScrollFadeIn();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({ ...initialFormData });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSameAsOrderer, setIsSameAsOrderer] = useState(false);

  useEffect(() => {
    if (isSameAsOrderer) {
      setFormData(prev => ({
        ...prev,
        recipientName: prev.ordererName,
        recipientPhone: prev.ordererPhone
      }));
    }
  }, [isSameAsOrderer, formData.ordererName, formData.ordererPhone]);

  useEffect(() => {
    // 當切換為自取時，清空不相關的配送資訊
    if (formData.deliveryCity === 'pickup') {
      setFormData(prev => ({
        ...prev,
        weddingAddress: '', 
        generalAddress: '',
        weddingLocation: '',
        generalLocation: ''
      }));
    }
  }, [formData.deliveryCity]);

  const broomQty = cart[5] || 0; 
  const candyQty = Object.entries(cart).reduce((sum, [id, qty]) => parseInt(id) !== 5 ? sum + qty : sum, 0);
  const candySubtotal = Object.entries(cart).reduce((total, [id, qty]) => {
    if (parseInt(id) === 5) return total;
    const product = products.find(p => p.id === parseInt(id));
    return total + (product ? product.price * qty : 0);
  }, 0);

  let shippingFee = 0; 
  let shippingHint = "";
  
  if (candyQty > 0 || broomQty > 0) {
    if (formData.deliveryCity === 'pickup') { 
        shippingFee = 0; 
        shippingHint = "(自取)"; 
    } else if (formData.deliveryCity === 'taipei' || formData.deliveryCity === 'new_taipei') {
        shippingFee = candySubtotal >= 5000 ? 0 : 350; 
        shippingHint = candySubtotal >= 5000 ? "(達標免運 🎉)" : `(還差 $${(5000 - candySubtotal).toLocaleString()} 享免運)`; 
    }
  }
  
  const broomRent = broomQty * 200;
  const broomDeposit = broomQty * 1800;
  const totalPrice = candySubtotal + broomRent + broomDeposit + shippingFee; 

  const handleFormChange = (e) => {
    let { name, value } = e.target;
    if (name === 'ordererPhone' || name === 'recipientPhone') {
      value = value.replace(/\D/g, ''); 
    }
    if ((name === 'weddingDate' || name === 'generalDate') && value) {
      if (value < getMinDate()) { 
        setAlertMsg(`日期需為 14 天後（最早：${getMinDate()}）。`); 
        return; 
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const renderTimeOptions = () => { 
    let options = [<option key="empty" value="" disabled>請選擇時間</option>];
    for (let m = 6 * 60 + 30; m <= 19 * 60; m += 30) {
        const h = Math.floor(m / 60); const mins = m % 60;
        const timeStr = `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        options.push(<option key={timeStr} value={timeStr}>{timeStr}</option>);
    }
    return options;
  };

  const isLocked = formData.deliveryCity === 'pickup';
  const cityMap = { taipei: '臺北市', new_taipei: '新北市', pickup: '自取' };
  const currentCityName = cityMap[formData.deliveryCity] || '請選擇縣市';

  // 💡 顧問優化：統一處理「未提供」顯示的工具函數
  const renderDetailRow = (label, value) => (
    <React.Fragment>
      <span className="text-darkWood/60 font-medium">{label}</span>
      <span className={`text-darkWood font-bold ${!value || value === '未提供' ? 'text-gray-400 font-normal' : ''}`}>
        {value || '未提供'}
      </span>
    </React.Fragment>
  );

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.eventType || !(formData.weddingDate || formData.generalDate)) {
        setAlertMsg("請先選擇活動類型與日期。"); return;
      }
      if (candyQty > 0 && candyQty < 50) {
        setAlertMsg(`總訂購量最低需達 50 支，目前僅 ${candyQty} 支。`); return;
      }
    }
    if (currentStep === 2) {
      if (!formData.deliveryCity) { setAlertMsg("請選擇配送縣市。"); return; }
      if (!isLocked) {
         const detailAddr = formData.eventType === 'wedding' ? formData.weddingAddress : formData.generalAddress;
         const time = formData.eventType === 'wedding' ? formData.weddingTime : formData.generalTime;
         const location = formData.eventType === 'wedding' ? formData.weddingLocation : formData.generalLocation;
         
         if (!time) { setAlertMsg("請選擇收貨時間。"); return; }
         if (!detailAddr) { setAlertMsg("請填寫詳細路名地址。"); return; }
         if (!location) { setAlertMsg("請填寫活動地點名稱。"); return; }
      }
    }
    if (currentStep === 3) {
      if (!formData.ordererName || !formData.ordererPhone || !formData.recipientName || !formData.recipientPhone) {
        setAlertMsg("請完整填寫聯絡資訊。"); return;
      }
      
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.ordererPhone)) {
        setAlertMsg("訂購人手機號碼格式錯誤，請輸入完整的 10 位數字。"); return;
      }
      if (!phoneRegex.test(formData.recipientPhone)) {
        setAlertMsg("收貨人聯絡電話格式錯誤，請輸入完整的 10 位數字。"); return;
      }
    }
    setCurrentStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => { setCurrentStep(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const detailAddress = formData.eventType === 'wedding' ? formData.weddingAddress : formData.generalAddress;
    const fullAddress = isLocked ? '需配合商家時間地點自取' : `${currentCityName}${detailAddress}`;
    const locationText = formData.eventType === 'wedding' ? formData.weddingLocation : formData.generalLocation;
    
    // 💡 顧問優化：送出給後端的資料也同步自取的顯示文字
    const finalEventTime = isLocked ? '需配合商家時間地點自取' : (formData.weddingTime || formData.generalTime || '未提供');
    const specificDetails = isLocked ? `取貨地址：${fullAddress}` : `地點：${locationText || '未提供'}\n地址：${fullAddress}`;

    const payload = { 
        orderDate: new Date().toLocaleDateString('zh-TW'),
        orderTime: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
        orderNumber: `${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        ordererName: formData.ordererName, ordererPhone: formData.ordererPhone, ordererEmail: formData.ordererEmail || '未提供',
        recipientName: formData.recipientName, recipientPhone: formData.recipientPhone,
        deliveryCity: currentCityName,
        eventType: formData.eventType === 'wedding' ? '浪漫婚禮 / 喜宴' : (formData.eventType === 'school' ? '校園活動 / 園遊會' : '其他'),
        eventDate: formData.weddingDate || formData.generalDate || '未提供', 
        eventTime: finalEventTime,
        specificDetails: specificDetails,
        itemsList: Object.entries(cart).filter(([id, q]) => parseInt(id) !== 5 && q > 0).map(([id, q]) => `- ${products.find(p=>p.id===parseInt(id)).name} x${q}`).join('\n'),
        candyTotal: candySubtotal, broomRent: broomRent, broomDeposit: broomDeposit, shippingFee: shippingFee,
        totalAmount: totalPrice, notes: formData.notes || '未提供', cart: cart
    };

    try {
      // 💡 顧問修正：補上備用的 GAS 網址，防止 .env 讀不到時發生錯誤
      const SCRIPT_URL = import.meta.env.VITE_GAS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzf8kJ6Ka8yGabg--MCRJ8eyucBbsGRDbceGEeH-CQDLqOMXhTCysZVrPKL0MLpSg4L/exec';
      const response = await fetch(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (result.status === 'success') { onOrderSuccess({ payload, orderNumber: payload.orderNumber, cart: { ...cart }, candyQty, broomQty, candySubtotal, broomRent, broomDeposit, shippingFee, totalPrice, pdfDownloadUrl: result.pdfDownloadUrl }); }
      else { setAlertMsg(["⚠️ 失敗", result.message]); }
    } catch (error) { setAlertMsg(["⚠️ 連線失敗", error.message]); } 
    finally { setIsSubmitting(false); }
  };

  return (
    <>
      {isSubmitting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-darkWood/60 backdrop-blur-sm transition-opacity">
          <div className="bg-pureWhite p-8 md:p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-[90%] mx-auto text-center animate-[fadeIn_0.3s_ease-out]">
            <svg className="animate-spin h-14 w-14 text-amberRed mb-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="text-xl md:text-2xl font-bold text-darkWood mb-3 tracking-wider font-serif">訂單處理中</h3>
            <p className="text-sm md:text-base text-darkWood/80 leading-relaxed font-medium">系統正在處理您的訂單，請稍候...</p>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 pt-32 pb-16 fade-in-up">
        <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <button onClick={() => navigateTo('list')} className="w-fit text-darkWood text-sm font-bold flex items-center gap-2 bg-pureWhite/60 px-4 py-2 rounded-full shadow-sm hover:bg-pureWhite transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              返回選購
            </button>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map(step => (
                <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${currentStep === step ? 'bg-amberRed text-white scale-110 shadow-md' : currentStep > step ? 'bg-emerald-500 text-white' : 'bg-warmWood/20 text-darkWood/40'}`}>
                  {currentStep > step ? '✓' : step}
                </div>
              ))}
            </div>
        </div>

        <main className="flex flex-col lg:flex-row gap-8 items-start">
          <CartSummary 
            cart={cart} updateCart={updateCart} handleQuantityChange={handleQuantityChange} navigateTo={navigateTo}
            candyQty={candyQty} broomQty={broomQty} candySubtotal={candySubtotal} broomRent={broomRent}
            broomDeposit={broomDeposit} shippingFee={shippingFee} shippingHint={shippingHint} totalPrice={totalPrice}
          />

          <section className="w-full lg:w-7/12 bg-pureWhite/65 backdrop-blur-[12px] border border-pureWhite shadow-xl rounded-2xl p-6 md:p-8">
            
            {/* Step 1: 活動類型與日期 */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                <h2 className="text-2xl font-bold text-darkWood mb-6 font-serif flex items-center gap-2"><span className="bg-amberRed/10 p-2 rounded-lg text-amberRed">01</span> 活動類型與日期</h2>
                <div>
                  <label className="block text-sm font-medium text-darkWood mb-2">活動類型 *</label>
                  <select name="eventType" required value={formData.eventType} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none">
                    <option value="" disabled>請選擇活動類型</option>
                    <option value="wedding">浪漫婚禮 / 喜宴</option>
                    <option value="school">校園活動 / 園遊會</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkWood mb-2">預計日期 * (需14天後)</label>
                  <input type="date" name={formData.eventType === 'wedding' ? 'weddingDate' : 'generalDate'} required min={getMinDate()} value={formData.weddingDate || formData.generalDate} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none" />
                </div>
              </div>
            )}

            {/* Step 2: 場地與物流資訊 */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                <h2 className="text-2xl font-bold text-darkWood mb-6 font-serif flex items-center gap-2"><span className="bg-amberRed/10 p-2 rounded-lg text-amberRed">02</span> 場地與物流資訊</h2>
                <div>
                  <label className="block text-sm font-medium text-darkWood mb-2">配送縣市 *</label>
                  <select name="deliveryCity" required value={formData.deliveryCity} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none">
                    <option value="" disabled>請選擇縣市</option>
                    <option value="taipei">臺北市</option>
                    <option value="new_taipei">新北市</option>
                    <option value="pickup">自取</option>
                  </select>
                </div>

                {!isLocked && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-darkWood mb-2">收貨時間 *</label>
                      <select name={formData.eventType === 'wedding' ? 'weddingTime' : 'generalTime'} required value={formData.weddingTime || formData.generalTime} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none">{renderTimeOptions()}</select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-darkWood mb-2">地點名稱 *</label>
                      <input type="text" name={formData.eventType === 'wedding' ? 'weddingLocation' : 'generalLocation'} required placeholder={formData.eventType === 'wedding' ? '例：○○婚宴會館○○廳' : '例：OO國小'} value={formData.eventType === 'wedding' ? formData.weddingLocation : formData.generalLocation} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-darkWood mb-2">{isLocked ? '取貨方式' : '完整地址 *'}</label>
                  {isLocked ? (
                    <input type="text" disabled value="需配合商家時間地點自取" className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-gray-100 text-gray-500" />
                  ) : (
                    <div className="flex items-stretch w-full rounded-xl border border-warmWood/30 overflow-hidden bg-pureWhite">
                      <div className="bg-gray-50 text-gray-600 px-4 py-3 border-r border-warmWood/30 font-bold flex items-center shrink-0">{currentCityName}</div>
                      <input type="text" name={formData.eventType === 'wedding' ? 'weddingAddress' : 'generalAddress'} required placeholder="例：信義區OO路123號" value={formData.eventType === 'wedding' ? formData.weddingAddress : formData.generalAddress} onChange={handleFormChange} className="w-full px-4 py-3 outline-none bg-transparent" />
                    </div>
                  )}
                </div>
                <div><label className="block text-sm font-medium text-darkWood mb-2">特殊備註</label><textarea name="notes" rows="3" placeholder="若有特殊進場動線需求請在此填寫..." value={formData.notes} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none resize-none" /></div>
              </div>
            )}

            {/* Step 3: 聯絡資訊 */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                <h2 className="text-2xl font-bold text-darkWood mb-6 font-serif flex items-center gap-2"><span className="bg-amberRed/10 p-2 rounded-lg text-amberRed">03</span> 聯絡資訊</h2>
                <div className="p-5 bg-creamBg/50 rounded-xl border border-warmWood/20 space-y-4">
                  <p className="font-bold text-amberRed text-sm">訂購人*</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="ordererName" required placeholder="姓名 *" value={formData.ordererName} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none" />
                    <input type="tel" name="ordererPhone" required maxLength="10" inputMode="numeric" placeholder="聯絡手機(10位數字)*" value={formData.ordererPhone} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none" />
                    <div className="md:col-span-2">
                      <input type="email" name="ordererEmail" placeholder="電子信箱" value={formData.ordererEmail} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none" />
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-pureWhite rounded-xl border border-warmWood/20 space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-darkWood text-sm">{isLocked ? '取貨人*' : '收貨人*'}</p>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-600"><input type="checkbox" checked={isSameAsOrderer} onChange={(e) => setIsSameAsOrderer(e.target.checked)} className="w-4 h-4" /> ☑️ 同訂購人</label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="recipientName" required placeholder="姓名 *" value={formData.recipientName} onChange={handleFormChange} disabled={isSameAsOrderer} className={`w-full px-4 py-3 rounded-xl border border-warmWood/30 ${isSameAsOrderer ? 'bg-gray-50' : 'bg-pureWhite'}`} />
                    <input type="tel" name="recipientPhone" required maxLength="10" inputMode="numeric" placeholder="聯絡手機(10位數字)*" value={formData.recipientPhone} onChange={handleFormChange} disabled={isSameAsOrderer} className={`w-full px-4 py-3 rounded-xl border border-warmWood/30 ${isSameAsOrderer ? 'bg-gray-50' : 'bg-pureWhite'}`} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: 確認訂單明細 */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                <h2 className="text-2xl font-bold text-darkWood mb-6 font-serif flex items-center gap-2"><span className="bg-amberRed/10 p-2 rounded-lg text-amberRed">04</span> 確認訂單明細</h2>
                <div className="bg-white p-6 rounded-2xl border border-warmWood/30 shadow-sm space-y-6 text-sm">
                  
                  {/* 活動資訊 */}
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-amberRed border-b border-warmWood/20 pb-2">活動資訊</h3>
                    <div className="grid grid-cols-[80px_1fr] gap-y-2">
                      {renderDetailRow('活動類型', formData.eventType === 'wedding' ? '浪漫婚禮 / 喜宴' : formData.eventType === 'school' ? '校園活動 / 園遊會' : '其他')}
                      {renderDetailRow('活動日期', formData.weddingDate || formData.generalDate)}
                      
                      {/* 💡 顧問優化：自取模式下自動顯示固定文字 */}
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

                  {/* 聯絡資訊 */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-base font-bold text-amberRed border-b border-warmWood/20 pb-2">聯絡資訊</h3>
                    <div className="grid grid-cols-[80px_1fr] gap-y-2">
                      {/* 💡 顧問優化：合併顯示 姓名(聯絡手機號碼) */}
                      {renderDetailRow('訂購人', `${formData.ordererName || '未提供'}(${formData.ordererPhone || '未提供'})`)}
                      {renderDetailRow('電子信箱', formData.ordererEmail)}
                      {renderDetailRow(isLocked ? '取貨人' : '收貨人', `${formData.recipientName || '未提供'}(${formData.recipientPhone || '未提供'})`)}
                      {renderDetailRow('備註', formData.notes)}
                    </div>
                  </div>

                  {/* 購買項目 */}
                  <div className="bg-creamBg/50 p-4 rounded-xl border border-warmWood/20">
                    <h3 className="text-base font-bold text-darkWood border-b border-warmWood/20 pb-2">預估總金額</h3>
                    <div className="pt-3 flex justify-end">
                      <span className="text-2xl font-bold text-amberRed">NT$ {totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-10 flex gap-4">
              {currentStep > 1 && (
                <button type="button" onClick={prevStep} disabled={isSubmitting} className="flex-1 py-4 px-6 rounded-xl font-bold border-2 border-warmWood/30 text-darkWood/60 hover:bg-creamBg transition-all">上一步</button>
              )}
              {currentStep < 4 ? (
                <button type="button" onClick={nextStep} className="flex-[2] bg-amberRed text-white py-4 px-6 rounded-xl font-bold shadow-lg hover:bg-darkWood transition-all">繼續下一步</button>
              ) : (
                <button type="button" onClick={handleSubmitOrder} disabled={isSubmitting || candyQty < 50} className="flex-[2] bg-emerald-600 text-white py-4 px-6 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all">確認並送出訂單</button>
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default Checkout;