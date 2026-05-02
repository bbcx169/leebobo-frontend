// src/pages/Checkout.jsx

import React, { useState, useEffect } from 'react';
import { products, getMinDate, initialFormData } from '../constants/data';
import useScrollFadeIn from '../hooks/useScrollFadeIn';
import CartSummary from '../components/CartSummary';

// 💡 導入步驟子組件
import Step1Event from '../components/checkout/Step1Event';
import Step2Location from '../components/checkout/Step2Location';
import Step3Contact from '../components/checkout/Step3Contact';
import Step4Confirm from '../components/checkout/Step4Confirm';
import { formatSpecificDetails } from '../utils/orderDetails';

const Checkout = ({ 
  cart, 
  updateCart, 
  handleQuantityChange, 
  navigateTo, 
  onOrderSuccess, 
  setAlertMsg 
}) => {
  useScrollFadeIn();
  
  // ==========================================
  // 🧠 指揮中心：狀態管理
  // ==========================================
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({ ...initialFormData });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingDate, setIsCheckingDate] = useState(false);
  const [isSameAsOrderer, setIsSameAsOrderer] = useState(false);

  // 💡 智慧提示語狀態
  const [submitMsg, setSubmitMsg] = useState("系統正在處理您的訂單，請稍候...");

  // ==========================================
  // ⏳ 智慧載入提示輪播邏輯[cite: 8]
  // ==========================================
  useEffect(() => {
    let interval;
    if (isSubmitting) {
      const messages = [
        "正在將訂單安全地寫入系統中...",
        "正在為您生成專屬 PDF 訂單明細...",
        "就快完成了！請務必留在網頁上...",
        "正在準備發送確認通知...",
        "感謝您的耐心等待，正在進行最後確認..."
      ];
      let counter = 0;
      setSubmitMsg(messages[0]);
      
      interval = setInterval(() => {
        counter = (counter + 1) % messages.length;
        setSubmitMsg(messages[counter]);
      }, 2500); // 每 2.5 秒更換一次語句
    } else {
      setSubmitMsg("系統正在處理您的訂單，請稍候...");
    }
    return () => clearInterval(interval);
  }, [isSubmitting]);

  // 💡 特殊狀態連動邏輯[cite: 8]
  useEffect(() => {
    if (isSameAsOrderer && formData.eventType !== 'wedding') {
      setFormData(prev => ({ ...prev, recipientName: prev.ordererName, recipientPhone: prev.ordererPhone }));
    }
  }, [isSameAsOrderer, formData.ordererName, formData.ordererPhone, formData.eventType]);

  useEffect(() => {
    if (formData.deliveryCity === 'pickup') {
      setFormData(prev => ({ ...prev, weddingAddress: '', generalAddress: '', weddingLocation: '', generalLocation: '' }));
    }
    if (formData.eventType === 'wedding') {
      setIsSameAsOrderer(false);
    }
  }, [formData.deliveryCity, formData.eventType]);

  // ==========================================
  // 🧮 金額與物流計算[cite: 8]
  // ==========================================
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

  const isLocked = formData.deliveryCity === 'pickup';
  const cityMap = { taipei: '臺北市', new_taibei: '新北市', new_taipei: '新北市', pickup: '自取' };
  const currentCityName = cityMap[formData.deliveryCity] || '請選擇縣市';

  // ==========================================
  // 🎮 行為控制與 API 串接[cite: 8]
  // ==========================================
  const handleFormChange = (e) => {
    let { name, value } = e.target;
    if (name === 'ordererPhone' || name === 'recipientPhone' || name === 'recipientPhone2') {
      value = value.replace(/\D/g, ''); 
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = async () => {
    if (currentStep === 1) {
      if (!formData.eventType || !(formData.weddingDate || formData.generalDate)) { setAlertMsg("請先選擇活動類型與日期。"); return; }
      const selectedDate = formData.weddingDate || formData.generalDate;
      if (selectedDate < getMinDate()) { setAlertMsg(`日期需為 14 天後（最早：${getMinDate()}）。`); return; }
      if (candyQty === 0) { setAlertMsg("購物車目前是空的，請先選購商品！（最低起訂量為 50 支）"); return; }
      if (candyQty < 50) { setAlertMsg(`總訂購量最低需達 50 支，目前僅 ${candyQty} 支。`); return; }

      setIsCheckingDate(true);
      try {
        const SCRIPT_URL = import.meta.env.VITE_GAS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzf8kJ6Ka8yGabg--MCRJ8eyucBbsGRDbceGEeH-CQDLqOMXhTCysZVrPKL0MLpSg4L/exec';
        const response = await fetch(`${SCRIPT_URL}?action=check_availability&date=${selectedDate}`);
        const result = await response.json();
        if (result.status === 'success' && candyQty > result.remaining) {
          setAlertMsg(`非常抱歉，我們每日產能上限為 800 支。此日期目前剩餘可訂購額度為 ${result.remaining} 支。請微調數量或選擇其他日期，感謝體諒！🍡`);
          return; 
        }
      } catch (error) {
        setAlertMsg("系統暫時無法核對產能額度，請稍後再試。"); return;
      } finally { setIsCheckingDate(false); }
    }

    if (currentStep === 2) {
      if (!formData.deliveryCity) { setAlertMsg("請選擇配送縣市。"); return; }
      if (!isLocked) {
         if (!(formData.eventType === 'wedding' ? formData.weddingTime : formData.generalTime)) { setAlertMsg("請選擇收貨時間。"); return; }
         if (!(formData.eventType === 'wedding' ? formData.weddingAddress : formData.generalAddress)) { setAlertMsg("請填寫詳細地址。"); return; }
         if (!(formData.eventType === 'wedding' ? formData.weddingLocation : formData.generalLocation)) { setAlertMsg("請填寫地點名稱。"); return; }
      }
    }

    if (currentStep === 3) {
      const phoneRegex = /^[0-9]{10}$/;
      if (formData.eventType === 'wedding') {
        if (!formData.ordererName || !formData.ordererPhone || !formData.recipientName || !formData.recipientPhone || !formData.recipientName2 || !formData.recipientPhone2) { setAlertMsg("請完整填寫收貨資訊。"); return; }
        if (!phoneRegex.test(formData.recipientPhone) || !phoneRegex.test(formData.recipientPhone2)) { setAlertMsg("手機號碼格式錯誤。"); return; }
      } else {
        if (!formData.ordererName || !formData.ordererPhone || !formData.recipientName || !formData.recipientPhone) { setAlertMsg("請完整填寫聯絡資訊。"); return; }
        if (!phoneRegex.test(formData.recipientPhone)) { setAlertMsg("收貨人電話格式錯誤。"); return; }
      }
      if (!phoneRegex.test(formData.ordererPhone)) { setAlertMsg("訂購人電話格式錯誤。"); return; }
      if (formData.ordererEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ordererEmail)) { setAlertMsg("信箱格式錯誤。"); return; }
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
    const specificDetails = formatSpecificDetails({
      isPickup: isLocked,
      locationName: locationText,
      address: fullAddress
    });

    const payload = { 
        orderDate: new Date().toLocaleDateString('zh-TW'),
        orderTime: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
        orderNumber: `${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        ordererName: formData.ordererName, 
        ordererPhone: formData.ordererPhone, 
        ordererEmail: formData.ordererEmail || '未提供',
        recipientName: formData.eventType === 'wedding' ? `${formData.recipientName} / ${formData.recipientName2}` : formData.recipientName, 
        recipientPhone: formData.eventType === 'wedding' ? `${formData.recipientPhone} / ${formData.recipientPhone2}` : formData.recipientPhone,
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
      } else { setAlertMsg(result.message); }
    } catch (error) { setAlertMsg(["⚠️ 連線失敗", error.message]); } 
    finally { setIsSubmitting(false); }
  };

  // ==========================================
  // 🖼️ UI 渲染組合[cite: 8]
  // ==========================================
  return (
    <>
      {/* 💡 智慧載入遮罩[cite: 8] */}
      {(isSubmitting || isCheckingDate) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-darkWood/60 backdrop-blur-sm transition-opacity">
          <div className="bg-pureWhite p-8 md:p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-[90%] mx-auto text-center animate-[fadeIn_0.3s_ease-out]">
            <svg className="animate-spin h-14 w-14 text-amberRed mb-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <h3 className="text-xl md:text-2xl font-bold text-darkWood mb-3 tracking-wider font-serif">
              {isCheckingDate ? "核對產能中" : "訂單處理中"}
            </h3>
            <p className="text-sm md:text-base text-darkWood/80 leading-relaxed font-medium min-h-[3rem]">
              {isCheckingDate ? "正在為您確認當日可製作額度..." : submitMsg}
            </p>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 pt-32 pb-16 fade-in-up">
        {/* 頂部進度條 */}
        <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <button onClick={() => navigateTo('list')} className="w-fit text-darkWood text-sm font-bold flex items-center gap-2 bg-pureWhite/60 px-4 py-2 rounded-full shadow-sm hover:bg-pureWhite transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> 返回選購
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
            {currentStep === 1 && <Step1Event formData={formData} handleFormChange={handleFormChange} getMinDate={getMinDate} />}
            {currentStep === 2 && <Step2Location formData={formData} handleFormChange={handleFormChange} />}
            {currentStep === 3 && <Step3Contact formData={formData} handleFormChange={handleFormChange} isSameAsOrderer={isSameAsOrderer} setIsSameAsOrderer={setIsSameAsOrderer} />}
            {currentStep === 4 && (
              <Step4Confirm 
                formData={formData} cart={cart} products={products} candyQty={candyQty} broomQty={broomQty} 
                candySubtotal={candySubtotal} broomRent={broomRent} broomDeposit={broomDeposit} 
                shippingFee={shippingFee} shippingHint={shippingHint} totalPrice={totalPrice} 
              />
            )}

            <div className="mt-10 flex gap-4">
              {currentStep > 1 && (
                <button type="button" onClick={prevStep} disabled={isSubmitting || isCheckingDate} className="flex-1 py-4 px-6 rounded-xl font-bold border-2 border-warmWood/30 text-darkWood/60 hover:bg-creamBg transition-all">上一步</button>
              )}
              {currentStep < 4 ? (
                <button type="button" onClick={nextStep} disabled={isCheckingDate} className="flex-[2] bg-amberRed text-white py-4 px-6 rounded-xl font-bold shadow-lg hover:bg-darkWood transition-all flex items-center justify-center gap-2">
                  {isCheckingDate ? "核對中..." : "繼續下一步"}
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
