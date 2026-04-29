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
  const [isCheckingDate, setIsCheckingDate] = useState(false);
  const [isSameAsOrderer, setIsSameAsOrderer] = useState(false);

  useEffect(() => {
    if (isSameAsOrderer && formData.eventType !== 'wedding') {
      setFormData(prev => ({
        ...prev,
        recipientName: prev.ordererName,
        recipientPhone: prev.ordererPhone
      }));
    }
  }, [isSameAsOrderer, formData.ordererName, formData.ordererPhone, formData.eventType]);

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
    // 若切換活動類型，且勾選了同訂購人，將其取消勾選（婚禮不適用同訂購人）
    if (formData.eventType === 'wedding') {
      setIsSameAsOrderer(false);
    }
  }, [formData.deliveryCity, formData.eventType]);

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
    } else if (formData.deliveryCity === 'taipei' || formData.deliveryCity === 'new_taibei' || formData.deliveryCity === 'new_taipei') {
        shippingFee = candySubtotal >= 5000 ? 0 : 350; 
        shippingHint = candySubtotal >= 5000 ? "(達標免運 🎉)" : `(還差 $${(5000 - candySubtotal).toLocaleString()} 享免運)`; 
    }
  }
  
  const broomRent = broomQty * 200;
  const broomDeposit = broomQty * 1800;
  const totalPrice = candySubtotal + broomRent + broomDeposit + shippingFee; 

  const handleFormChange = (e) => {
    let { name, value } = e.target;
    if (name === 'ordererPhone' || name === 'recipientPhone' || name === 'recipientPhone2') {
      value = value.replace(/\D/g, ''); 
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
  const cityMap = { taipei: '臺北市', new_taibei: '新北市', new_taipei: '新北市', pickup: '自取' };
  const currentCityName = cityMap[formData.deliveryCity] || '請選擇縣市';

  const renderDetailRow = (label, value) => (
    <React.Fragment>
      <span className="text-darkWood/60 font-medium">{label}</span>
      <span className={`text-darkWood font-bold ${!value || value === '未提供' ? 'text-gray-400 font-normal' : ''}`}>
        {value || '未提供'}
      </span>
    </React.Fragment>
  );

  const nextStep = async () => {
    if (currentStep === 1) {
      if (!formData.eventType || !(formData.weddingDate || formData.generalDate)) {
        setAlertMsg("請先選擇活動類型與日期。"); return;
      }

      const selectedDate = formData.weddingDate || formData.generalDate;
      if (selectedDate < getMinDate()) { 
        setAlertMsg(`日期需為 14 天後（最早：${getMinDate()}）。`); 
        return; 
      }

      // 💡 修正邏輯：嚴格阻擋購物車為 0 以及未滿 50 支的情況
      if (candyQty === 0) {
        setAlertMsg("購物車目前是空的，請先選購商品！（最低起訂量為 50 支）"); 
        return;
      }

      if (candyQty < 50) {
        setAlertMsg(`總訂購量最低需達 50 支，目前僅 ${candyQty} 支。`); 
        return;
      }

      // 當購物車大於等於 50 支且日期正確後，才呼叫 API 檢查每日產能
      setIsCheckingDate(true);
      try {
        const SCRIPT_URL = import.meta.env.VITE_GAS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzf8kJ6Ka8yGabg--MCRJ8eyucBbsGRDbceGEeH-CQDLqOMXhTCysZVrPKL0MLpSg4L/exec';
        const response = await fetch(`${SCRIPT_URL}?action=check_availability&date=${selectedDate}`);
        const result = await response.json();

        if (result.status === 'success') {
          const remaining = result.remaining;
          if (candyQty > remaining) {
            setAlertMsg(`非常抱歉，為堅持手工新鮮製作的品質，我們每日產能上限為 800 支。您選擇的日期目前剩餘可訂購額度為 ${remaining} 支。再麻煩您幫我們微調數量，或選擇其他日期，感謝您的體諒！🍡`);
            return; 
          }
        }
      } catch (error) {
        console.error("產能檢查失敗:", error);
        setAlertMsg("系統暫時無法核對產能額度，請檢查網路連線或稍後再試。");
        return;
      } finally {
        setIsCheckingDate(false);
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
      const phoneRegex = /^[0-9]{10}$/;
      
      if (formData.eventType === 'wedding') {
        if (!formData.ordererName || !formData.ordererPhone || !formData.recipientName || !formData.recipientPhone || !formData.recipientName2 || !formData.recipientPhone2) {
          setAlertMsg("請完整填寫聯絡人與兩位現場代收親友的資訊。"); return;
        }
        if (!phoneRegex.test(formData.recipientPhone) || !phoneRegex.test(formData.recipientPhone2)) {
          setAlertMsg("代收人手機號碼格式錯誤，請輸入完整的 10 位數字。"); return;
        }
      } else {
        if (!formData.ordererName || !formData.ordererPhone || !formData.recipientName || !formData.recipientPhone) {
          setAlertMsg("請完整填寫聯絡資訊。"); return;
        }
        if (!phoneRegex.test(formData.recipientPhone)) {
          setAlertMsg("收貨人聯絡電話格式錯誤，請輸入完整的 10 位數字。"); return;
        }
      }

      if (!phoneRegex.test(formData.ordererPhone)) {
        setAlertMsg("訂購人手機號碼格式錯誤，請輸入完整的 10 位數字。"); return;
      }

      if (formData.ordererEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.ordererEmail)) {
          setAlertMsg("電子信箱格式錯誤，請輸入有效的 Email。"); return;
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
    const locationText = formData.eventType === 'wedding' ? formData.weddingLocation : formData.generalLocation;
    
    const finalEventTime = isLocked ? '需配合商家時間地點自取' : (formData.weddingTime || formData.generalTime || '未提供');
    const specificDetails = isLocked ? `取貨地址：${fullAddress}` : `地點：${locationText || '未提供'}\n地址：${fullAddress}`;

    const finalRecipientName = formData.eventType === 'wedding' 
        ? `${formData.recipientName} / ${formData.recipientName2}` 
        : formData.recipientName;
    const finalRecipientPhone = formData.eventType === 'wedding' 
        ? `${formData.recipientPhone} / ${formData.recipientPhone2}` 
        : formData.recipientPhone;

    const payload = { 
        orderDate: new Date().toLocaleDateString('zh-TW'),
        orderTime: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
        orderNumber: `${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        ordererName: formData.ordererName, 
        ordererPhone: formData.ordererPhone, 
        ordererEmail: formData.ordererEmail || '未提供',
        recipientName: finalRecipientName, 
        recipientPhone: finalRecipientPhone,
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
      const SCRIPT_URL = import.meta.env.VITE_GAS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzf8kJ6Ka8yGabg--MCRJ8eyucBbsGRDbceGEeH-CQDLqOMXhTCysZVrPKL0MLpSg4L/exec';
      const response = await fetch(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (result.status === 'success') { 
        onOrderSuccess({ payload, orderNumber: payload.orderNumber, cart: { ...cart }, candyQty, broomQty, candySubtotal, broomRent, broomDeposit, shippingFee, totalPrice, pdfDownloadUrl: result.pdfDownloadUrl }); 
      }
      else { 
        setAlertMsg(result.message); 
      }
    } catch (error) { 
      setAlertMsg(["⚠️ 連線失敗", error.message]); 
    } 
    finally { setIsSubmitting(false); }
  };

  return (
    <>
      {(isSubmitting || isCheckingDate) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-darkWood/60 backdrop-blur-sm transition-opacity">
          <div className="bg-pureWhite p-8 md:p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-[90%] mx-auto text-center animate-[fadeIn_0.3s_ease-out]">
            <svg className="animate-spin h-14 w-14 text-amberRed mb-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="text-xl md:text-2xl font-bold text-darkWood mb-3 tracking-wider font-serif">
              {isCheckingDate ? "核對產能中" : "訂單處理中"}
            </h3>
            <p className="text-sm md:text-base text-darkWood/80 leading-relaxed font-medium">
              {isCheckingDate ? "正在為您確認當日可製作額度..." : "系統正在處理您的訂單，請稍候..."}
            </p>
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
                    <div className="flex flex-col gap-2">
                      <div className="flex items-stretch w-full rounded-xl border border-warmWood/30 overflow-hidden bg-pureWhite">
                        <div className="bg-gray-50 text-gray-600 px-4 py-3 border-r border-warmWood/30 font-bold flex items-center shrink-0">{currentCityName}</div>
                        <input type="text" name={formData.eventType === 'wedding' ? 'weddingAddress' : 'generalAddress'} required placeholder="例：信義區OO路123號" value={formData.eventType === 'wedding' ? formData.weddingAddress : formData.generalAddress} onChange={handleFormChange} className="w-full px-4 py-3 outline-none bg-transparent" />
                      </div>
                      {/* 💡 顧問修正：針對配送範圍的溫馨提示，確保完整呈現！ */}
                      <p className="text-xs text-amberRed font-medium leading-relaxed pl-1">
                        💡 溫馨提醒：因專車配送行程緊湊與人力限制，<span className="font-bold underline">司機無法協助送上樓或送入會場內</span>。屆時需勞煩您安排親友至一樓大門口或會場外與司機面交取貨，感謝您的體諒與配合！
                      </p>
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
                      <input type="email" name="ordererEmail" placeholder="電子信箱" value={formData.ordererEmail} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none focus:ring-2 focus:ring-amberRed transition-all" />
                      <p className="text-xs text-darkWood/60 mt-2 font-medium pl-1">💡 填寫可收取系統自動發送的訂單明細 (PDF)</p>
                    </div>
                  </div>
                </div>

                {/* 💡 根據活動類型切換收貨人 UI */}
                {formData.eventType === 'wedding' ? (
                  <div className="p-5 bg-pureWhite rounded-xl border border-warmWood/20 space-y-5">
                    <div className="bg-amberRed/10 border border-amberRed/20 p-4 rounded-xl text-sm text-amberRed font-medium leading-relaxed">
                      💡 婚宴當日新人行程緊湊且環境嘈雜，常有漏接電話之情事。為確保糖葫蘆順利送達，請提供<span className="font-bold underline decoration-2 underline-offset-2">兩位現場代收親友</span>（如：伴郎、總召或工作人員）的聯絡資訊，讓您能安心享受專屬於您的美好時刻。🍡
                    </div>
                    
                    <div>
                      <p className="font-bold text-darkWood text-sm border-b border-warmWood/20 pb-2 mb-3">收貨人 1 (現場代收親友)*</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="recipientName" required placeholder="姓名 *" value={formData.recipientName || ''} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-gray-50 focus:bg-white outline-none" />
                        <input type="tel" name="recipientPhone" required maxLength="10" inputMode="numeric" placeholder="聯絡手機(10位數字)*" value={formData.recipientPhone || ''} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-gray-50 focus:bg-white outline-none" />
                      </div>
                    </div>

                    <div>
                      <p className="font-bold text-darkWood text-sm border-b border-warmWood/20 pb-2 mb-3">收貨人 2 (現場代收親友)*</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="recipientName2" required placeholder="姓名 *" value={formData.recipientName2 || ''} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-gray-50 focus:bg-white outline-none" />
                        <input type="tel" name="recipientPhone2" required maxLength="10" inputMode="numeric" placeholder="聯絡手機(10位數字)*" value={formData.recipientPhone2 || ''} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-gray-50 focus:bg-white outline-none" />
                      </div>
                    </div>
                  </div>
                ) : (
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
                )}
              </div>
            )}

            {/* Step 4: 確認訂單明細 */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                <h2 className="text-2xl font-bold text-darkWood mb-6 font-serif flex items-center gap-2"><span className="bg-amberRed/10 p-2 rounded-lg text-amberRed">04</span> 確認訂單明細</h2>
                <div className="bg-white p-6 rounded-2xl border border-warmWood/30 shadow-sm space-y-6 text-sm">
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-amberRed border-b border-warmWood/20 pb-2">活動資訊</h3>
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

                  <div className="space-y-3 pt-2">
                    <h3 className="text-base font-bold text-amberRed border-b border-warmWood/20 pb-2">聯絡資訊</h3>
                    <div className="grid grid-cols-[80px_1fr] gap-y-2">
                      {renderDetailRow('訂購人', `${formData.ordererName || '未提供'} (${formData.ordererPhone || '未提供'})`)}
                      {renderDetailRow('電子信箱', formData.ordererEmail)}
                      
                      {/* 💡 預覽畫面：依照婚禮拆分顯示 */}
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
            )}

            <div className="mt-10 flex gap-4">
              {currentStep > 1 && (
                <button type="button" onClick={prevStep} disabled={isSubmitting || isCheckingDate} className="flex-1 py-4 px-6 rounded-xl font-bold border-2 border-warmWood/30 text-darkWood/60 hover:bg-creamBg transition-all">上一步</button>
              )}
              {currentStep < 4 ? (
                <button type="button" onClick={nextStep} disabled={isCheckingDate} className="flex-[2] bg-amberRed text-white py-4 px-6 rounded-xl font-bold shadow-lg hover:bg-darkWood transition-all flex items-center justify-center gap-2">
                  {isCheckingDate ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      核對中...
                    </>
                  ) : "繼續下一步"}
                </button>
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