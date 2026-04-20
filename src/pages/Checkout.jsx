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
    if (formData.deliveryCity === 'other' || formData.deliveryCity === 'pickup') {
      setFormData(prev => ({
        ...prev,
        weddingTime: '', generalTime: '',
        weddingRestaurant: '', generalLocation: ''
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
    if (formData.deliveryCity === 'other' || formData.deliveryCity === 'pickup') { 
        shippingFee = 0; 
        shippingHint = formData.deliveryCity === 'pickup' ? "(自取)" : "(外縣市需自取)"; 
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

  const isLocked = formData.deliveryCity === 'other' || formData.deliveryCity === 'pickup';
  const cityMap = { taipei: '臺北市', new_taipei: '新北市', other: '外縣市', pickup: '自取' };
  const currentCityName = cityMap[formData.deliveryCity] || '請選擇縣市';

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
         if (!time) { setAlertMsg("請選擇收貨時間。"); return; }
         if (!detailAddr) { setAlertMsg("請填寫詳細路名地址。"); return; }
         if (formData.eventType !== 'wedding' && !formData.generalLocation) {
           setAlertMsg("請填寫活動地點名稱。"); return;
         }
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

      if (formData.ordererEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.ordererEmail)) {
          setAlertMsg("聯絡信箱格式不正確，請輸入有效的 Email。"); return;
        }
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
    
    let specificDetails = "";
    if (formData.eventType === 'wedding') {
        const restaurantText = formData.weddingRestaurant || '未提供';
        const hallText = formData.weddingHall ? `(${formData.weddingHall})` : '';
        const groomText = formData.groomName || '未提供';
        specificDetails = `新人：${groomText}\n餐廳：${restaurantText} ${hallText}\n地址：${fullAddress}`;
    } else {
        specificDetails = `地點：${formData.generalLocation}\n地址：${fullAddress}`;
    }

    const payload = { 
        orderDate: new Date().toLocaleDateString('zh-TW'),
        orderTime: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
        orderNumber: `${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        ordererName: formData.ordererName, ordererPhone: formData.ordererPhone, ordererEmail: formData.ordererEmail,
        recipientName: formData.recipientName, recipientPhone: formData.recipientPhone,
        deliveryCity: currentCityName,
        eventType: formData.eventType === 'wedding' ? '浪漫婚禮 / 喜宴' : (formData.eventType === 'school' ? '校園活動 / 園遊會' : '其他'),
        eventDate: formData.weddingDate || formData.generalDate, 
        // 💡 修正：送出給後端與 PDF 的文字也一併更新
        eventTime: isLocked ? '配合商家時間地點自取' : (formData.weddingTime || formData.generalTime),
        specificDetails: specificDetails,
        itemsList: Object.entries(cart).filter(([id, q]) => parseInt(id) !== 5 && q > 0).map(([id, q]) => `- ${products.find(p=>p.id===parseInt(id)).name} x${q}`).join('\n'),
        candyTotal: candySubtotal, broomRent: broomRent, broomDeposit: broomDeposit, shippingFee: shippingFee,
        totalAmount: totalPrice, notes: formData.notes, cart: cart
    };

    try {
      const SCRIPT_URL = import.meta.env.VITE_GAS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzf8kJ6Ka8yGabg--MCRJ8eyucBbsGRDbceGEeH-CQDLqOMXhTCysZVrPKL0MLpSg4L/exec';
      const response = await fetch(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (result.status === 'success') { 
        onOrderSuccess({ 
          payload, 
          orderNumber: payload.orderNumber, 
          cart: { ...cart }, 
          candyQty, 
          broomQty, 
          candySubtotal, 
          broomRent, 
          broomDeposit, 
          shippingFee, 
          totalPrice, 
          pdfDownloadUrl: result.pdfDownloadUrl 
        }); 
      }
      else { setAlertMsg(["⚠️ 失敗", result.message]); }
    } catch (error) { setAlertMsg(["⚠️ 連線失敗", error.message]); } 
    finally { setIsSubmitting(false); }
  };

  return (
    <>
      {/* 全螢幕防焦慮載入遮罩 */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-darkWood/60 backdrop-blur-sm transition-opacity">
          <div className="bg-pureWhite p-8 md:p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-[90%] mx-auto text-center animate-[fadeIn_0.3s_ease-out]">
            <svg className="animate-spin h-14 w-14 text-amberRed mb-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="text-xl md:text-2xl font-bold text-darkWood mb-3 tracking-wider font-serif">訂單處理中</h3>
            <p className="text-sm md:text-base text-darkWood/80 leading-relaxed font-medium">
              系統正在為您生成 PDF 明細<br/>並寄送通知信件...
            </p>
            <div className="mt-5 bg-amberRed/10 py-2 px-4 rounded-lg">
              <p className="text-xs text-amberRed font-bold">⚠️ 大約需要 5~10 秒鐘，請勿關閉視窗</p>
            </div>
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

        <header className="text-center mb-10 mt-4">
            <h1 className="text-3xl md:text-5xl font-bold text-amberRed mb-4 tracking-wider leading-snug font-serif">讓李伯伯為您的重要時刻增添甜蜜</h1>
            <p className="text-darkWood/70 text-lg md:text-xl">婚禮佈置 / 校園活動 / 品牌活動 預約訂購</p>
        </header>

        <main className="flex flex-col lg:flex-row gap-8 items-start">
          <CartSummary 
            cart={cart} updateCart={updateCart} handleQuantityChange={handleQuantityChange} navigateTo={navigateTo}
            candyQty={candyQty} broomQty={broomQty} candySubtotal={candySubtotal} broomRent={broomRent}
            broomDeposit={broomDeposit} shippingFee={shippingFee} shippingHint={shippingHint} totalPrice={totalPrice}
          />

          <section className="w-full lg:w-7/12 bg-pureWhite/65 backdrop-blur-[12px] border border-pureWhite shadow-[0_10px_30px_-10px_rgba(165,42,42,0.08)] rounded-2xl p-6 md:p-8">
            
            {/* Step 1: 活動大綱 */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                <h2 className="text-2xl font-bold text-darkWood mb-6 font-serif flex items-center gap-2"><span className="bg-amberRed/10 p-2 rounded-lg text-amberRed">01</span> 活動類型與日期</h2>
                <div>
                  <label className="block text-sm font-medium text-darkWood mb-2">活動類型 *</label>
                  <select name="eventType" required value={formData.eventType} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none appearance-none transition-all">
                    <option value="" disabled>請選擇活動類型</option><option value="wedding">浪漫婚禮 / 喜宴</option><option value="school">校園活動 / 園遊會</option><option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkWood mb-2">預計日期 * (需14天後)</label>
                  <input type="date" name={formData.eventType === 'wedding' ? 'weddingDate' : 'generalDate'} required min={getMinDate()} value={formData.weddingDate || formData.generalDate} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none transition-all" />
                </div>
              </div>
            )}

            {/* Step 2: 場地與物流資訊 */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                <h2 className="text-2xl font-bold text-darkWood mb-6 font-serif flex items-center gap-2"><span className="bg-amberRed/10 p-2 rounded-lg text-amberRed">02</span> 場地與物流資訊</h2>
                
                <div>
                  <label className="block text-sm font-medium text-darkWood mb-2">配送縣市 *</label>
                  <select name="deliveryCity" required value={formData.deliveryCity} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite focus:ring-2 focus:ring-amberRed outline-none appearance-none transition-all shadow-sm">
                    <option value="" disabled>請選擇縣市</option>
                    <option value="taipei">臺北市</option>
                    <option value="new_taipei">新北市</option>
                    <option value="other">外縣市</option>
                    <option value="pickup">自取</option>
                  </select>
                </div>

                {!isLocked && (
                  <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                    <div>
                      <label className="block text-sm font-medium text-darkWood mb-2">收貨時間 *</label>
                      <select name={formData.eventType === 'wedding' ? 'weddingTime' : 'generalTime'} required value={formData.weddingTime || formData.generalTime} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite focus:ring-2 focus:ring-amberRed outline-none appearance-none transition-all shadow-sm">{renderTimeOptions()}</select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-darkWood mb-2">{formData.eventType === 'wedding' ? '餐廳名稱' : '地點名稱 *'}</label>
                      <input 
                        type="text" 
                        name={formData.eventType === 'wedding' ? 'weddingRestaurant' : 'generalLocation'} 
                        required={formData.eventType !== 'wedding'} 
                        placeholder={formData.eventType === 'wedding' ? '例：OO婚宴會館' : '例：OO國小'} 
                        value={formData.eventType === 'wedding' ? formData.weddingRestaurant : formData.generalLocation} 
                        onChange={handleFormChange} 
                        className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none shadow-sm focus:ring-2 focus:ring-amberRed" 
                      />
                    </div>
                    {formData.eventType === 'wedding' && (
                      <div><label className="block text-sm font-medium text-darkWood mb-2">廳別</label><input type="text" name="weddingHall" placeholder="例：鳳凰廳" value={formData.weddingHall} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none shadow-sm focus:ring-2 focus:ring-amberRed" /></div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-darkWood mb-2">完整地址 *</label>
                  {isLocked ? (
                    <input 
                      type="text" 
                      disabled 
                      value="需配合商家時間地點自取" 
                      className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-gray-100 text-gray-500 cursor-not-allowed outline-none shadow-sm" 
                    />
                  ) : (
                    <div className="flex items-stretch w-full rounded-xl border border-warmWood/30 overflow-hidden focus-within:ring-2 focus-within:ring-amberRed transition-all shadow-sm bg-pureWhite">
                      <div className="bg-gray-50 text-gray-600 px-4 py-3 border-r border-warmWood/30 font-bold tracking-widest flex items-center shrink-0">
                        {currentCityName}
                      </div>
                      <input 
                        type="text" 
                        name={formData.eventType === 'wedding' ? 'weddingAddress' : 'generalAddress'} 
                        required 
                        placeholder="例：信義區OO路123號" 
                        value={formData.eventType === 'wedding' ? formData.weddingAddress : formData.generalAddress} 
                        onChange={handleFormChange} 
                        className="w-full px-4 py-3 outline-none bg-transparent" 
                      />
                    </div>
                  )}
                </div>

                <div><label className="block text-sm font-medium text-darkWood mb-2">特殊備註</label><textarea name="notes" rows="3" placeholder="若有特殊進場動線需求請在此填寫..." value={formData.notes} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none resize-none shadow-sm focus:ring-2 focus:ring-amberRed" /></div>
              </div>
            )}

            {/* Step 3: 聯絡資訊 */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                <h2 className="text-2xl font-bold text-darkWood mb-6 font-serif flex items-center gap-2"><span className="bg-amberRed/10 p-2 rounded-lg text-amberRed">03</span> 聯絡資訊</h2>
                
                <div className="p-5 bg-creamBg/50 rounded-xl border border-warmWood/20 space-y-4 shadow-sm">
                  <p className="font-bold text-amberRed text-sm">訂購人*</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="ordererName" required placeholder="姓名 *" value={formData.ordererName} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite focus:ring-2 focus:ring-amberRed outline-none" />
                    <input type="tel" name="ordererPhone" required maxLength="10" inputMode="numeric" placeholder="手機 (10位數字) *" value={formData.ordererPhone} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite focus:ring-2 focus:ring-amberRed outline-none" />
                    <div className="md:col-span-2">
                      <input type="email" name="ordererEmail" placeholder="電子信箱" value={formData.ordererEmail} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite focus:ring-2 focus:ring-amberRed outline-none" />
                      <p className="text-xs text-amberRed/90 mt-1.5 ml-1 font-medium tracking-wide">
                        ※ 建議填寫，訂單送出後自動寄送 PDF 明細備份至您的信箱。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-pureWhite rounded-xl border border-warmWood/20 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-darkWood text-sm">{formData.eventType === 'wedding' ? '當日現場收貨人*' : '收貨人*'}</p>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-600"><input type="checkbox" checked={isSameAsOrderer} onChange={(e) => setIsSameAsOrderer(e.target.checked)} className="w-4 h-4" /> ☑️ 同訂購人</label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="recipientName" required placeholder="姓名 *" value={formData.recipientName} onChange={handleFormChange} disabled={isSameAsOrderer} className={`w-full px-4 py-3 rounded-xl border border-warmWood/30 outline-none ${isSameAsOrderer ? 'bg-gray-50' : 'bg-pureWhite focus:ring-2 focus:ring-amberRed'}`} />
                    <input type="tel" name="recipientPhone" required maxLength="10" inputMode="numeric" placeholder="聯絡電話 (10位數字) *" value={formData.recipientPhone} onChange={handleFormChange} disabled={isSameAsOrderer} className={`w-full px-4 py-3 rounded-xl border border-warmWood/30 outline-none ${isSameAsOrderer ? 'bg-gray-50' : 'bg-pureWhite focus:ring-2 focus:ring-amberRed'}`} />
                  </div>
                </div>

                {formData.eventType === 'wedding' && (
                  <div className="p-5 bg-pureWhite rounded-xl border border-warmWood/20 space-y-4 shadow-sm">
                    <p className="font-bold text-darkWood text-sm">新人資訊</p>
                    <input type="text" name="groomName" placeholder="例：王府陳府喜宴" value={formData.groomName} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite focus:ring-2 focus:ring-amberRed outline-none" />
                  </div>
                )}
              </div>
            )}

            {/* Step 4: 最終確認 */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                <h2 className="text-2xl font-bold text-darkWood mb-6 font-serif flex items-center gap-2">
                  <span className="bg-amberRed/10 p-2 rounded-lg text-amberRed">04</span> 確認訂單明細
                </h2>
                
                <div className="bg-white p-6 rounded-2xl border border-warmWood/30 shadow-sm space-y-6 text-sm">
                  
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-amberRed border-b border-warmWood/20 pb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      活動資訊
                    </h3>
                    <div className="grid grid-cols-[80px_1fr] gap-y-2">
                      <span className="text-darkWood/60 font-medium">活動類型</span>
                      <span className="text-darkWood font-bold">
                        {formData.eventType === 'wedding' ? '浪漫婚禮 / 喜宴' : formData.eventType === 'school' ? '校園活動 / 園遊會' : '其他'}
                      </span>
                      
                      <span className="text-darkWood/60 font-medium">活動日期</span><span className="text-darkWood font-bold">{formData.weddingDate || formData.generalDate}</span>
                      {/* 💡 修正 1：畫面上同步顯示「配合商家時間地點自取」 */}
                      <span className="text-darkWood/60 font-medium">收貨時間</span><span className="text-darkWood font-bold">{isLocked ? '配合商家時間地點自取' : (formData.weddingTime || formData.generalTime)}</span>
                      <span className="text-darkWood/60 font-medium">配送地址</span><span className="text-darkWood font-bold">{isLocked ? '配合商家時間地點自取' : `${currentCityName}${formData.eventType === 'wedding' ? formData.weddingAddress : formData.generalAddress}`}</span>
                      {!isLocked ? (
                        <>
                          <span className="text-darkWood/60 font-medium">地點名稱</span>
                          <span className="text-darkWood font-bold">
                            {formData.eventType === 'wedding' ? formData.weddingRestaurant : formData.generalLocation}
                            {formData.weddingHall ? ` (${formData.weddingHall})` : ''}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h3 className="text-base font-bold text-amberRed border-b border-warmWood/20 pb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      聯絡資訊
                    </h3>
                    <div className="grid grid-cols-[80px_1fr] gap-y-2">
                      <span className="text-darkWood/60 font-medium">訂購人</span><span className="text-darkWood font-bold">{formData.ordererName} <span className="text-darkWood/60 text-xs ml-1">({formData.ordererPhone})</span></span>
                      
                      {formData.ordererEmail ? (
                        <>
                          <span className="text-darkWood/60 font-medium">電子信箱</span>
                          <span className="text-darkWood font-bold">{formData.ordererEmail}</span>
                        </>
                      ) : null}

                      <span className="text-darkWood/60 font-medium">收貨人</span>
                      <span className="text-darkWood font-bold">{formData.recipientName} <span className="text-darkWood/60 text-xs ml-1">({formData.recipientPhone})</span></span>
                      
                      {formData.eventType === 'wedding' && formData.groomName ? (
                        <>
                          <span className="text-darkWood/60 font-medium">新人資訊</span>
                          <span className="text-darkWood font-bold">{formData.groomName}</span>
                        </>
                      ) : null}
                      
                      {formData.notes ? (
                        <>
                          <span className="text-darkWood/60 font-medium">備註</span>
                          <span className="text-darkWood font-medium whitespace-pre-wrap">{formData.notes}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-3 bg-creamBg/50 p-4 rounded-xl border border-warmWood/20">
                    <h3 className="text-base font-bold text-darkWood border-b border-warmWood/20 pb-2">購買項目</h3>
                    <div className="space-y-2">
                      {Object.entries(cart).filter(([id, q]) => parseInt(id) !== 5 && q > 0).map(([id, q]) => {
                        const p = products.find(prod => prod.id === parseInt(id));
                        if (!p) return null;
                        return (
                          <div key={id} className="flex justify-between text-darkWood font-medium">
                            <span>{p.name} <span className="text-xs text-darkWood/60 ml-1">x {q}</span></span>
                            <span>NT$ {(p.price * q).toLocaleString()}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="border-t border-warmWood/20 pt-3 mt-3 space-y-2">
                      <div className="flex justify-between text-darkWood/70 text-xs"><span>商品小計 ({candyQty} 支)</span><span>NT$ {candySubtotal.toLocaleString()}</span></div>
                      {broomQty > 0 && (
                        <>
                          <div className="flex justify-between text-darkWood/70 text-xs"><span>掃帚租金 ({broomQty} 組)</span><span>NT$ {broomRent.toLocaleString()}</span></div>
                          <div className="flex justify-between text-emerald-700 font-bold text-xs"><span>掃帚押金 (歸還後退回)</span><span>NT$ {broomDeposit.toLocaleString()}</span></div>
                        </>
                      )}
                      <div className="flex justify-between text-darkWood/70 text-xs"><span>配送運費</span><span>NT$ {shippingFee.toLocaleString()}</span></div>
                      <div className="flex justify-between text-darkWood font-bold text-lg pt-3 mt-3 border-t border-warmWood/30">
                        <span>預估總金額</span>
                        <span className="text-amberRed">NT$ {totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                </div>
                
                {candyQty < 50 && <p className="text-xs font-bold text-amberRed bg-red-50 p-3 rounded-lg text-center animate-pulse border border-amberRed/20">⚠️ 目前總數僅 {candyQty} 支，需滿 50 支才可送出訂單。</p>}
              </div>
            )}

            <div className="mt-10 flex gap-4">
              {currentStep > 1 && (
                <button type="button" onClick={prevStep} disabled={isSubmitting} className="flex-1 py-4 px-6 rounded-xl font-bold border-2 border-warmWood/30 text-darkWood/60 hover:bg-creamBg transition-all shadow-sm disabled:opacity-50">上一步</button>
              )}
              {currentStep < 4 ? (
                <button type="button" onClick={nextStep} className="flex-[2] bg-amberRed text-white py-4 px-6 rounded-xl font-bold shadow-lg hover:bg-darkWood transition-all hover:-translate-y-0.5">繼續下一步</button>
              ) : (
                <button type="button" onClick={handleSubmitOrder} disabled={isSubmitting || candyQty < 50} className="flex-[2] bg-emerald-600 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex justify-center items-center hover:-translate-y-0.5">
                  確認並送出訂單
                </button>
              )}
            </div>

          </section>
        </main>
      </div>
    </>
  );
};

export default Checkout;