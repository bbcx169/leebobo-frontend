import React, { useState, useEffect } from 'react';
import { useScrollFadeIn } from '../hooks/useScrollFadeIn';
import { products } from '../constants';

const OrderForm = ({ formData, setFormData, cart, setCart, navigateTo }) => {
  useScrollFadeIn();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minDate = new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0];

  const timeOptions = [];
  for (let i = 7; i <= 19; i++) {
    const hour = i.toString().padStart(2, '0');
    timeOptions.push(`${hour}:00`);
    if (i !== 19) timeOptions.push(`${hour}:30`);
  }

  // 🌟 保留空字串，防止使用者刪除數字時商品直接消失
  const cartItems = Object.keys(cart).map(id => {
    const product = products.find(p => p.id === parseInt(id));
    if (!product) return null;
    return { ...product, quantity: cart[id] };
  }).filter(item => item && (item.quantity > 0 || item.quantity === ''));

  const candyItems = cartItems.filter(item => item.id !== 99 && !item.name.includes('掃帚'));
  const broomItems = cartItems.filter(item => item.id === 99 || item.name.includes('掃帚'));

  // 確保數量轉為有效數字進行運算
  const getQty = (qty) => parseInt(qty, 10) || 0;
  const totalCandyItems = candyItems.reduce((sum, item) => sum + getQty(item.quantity), 0);
  const candySubtotal = candyItems.reduce((sum, item) => sum + (item.price * getQty(item.quantity)), 0);
  
  const totalBrooms = broomItems.reduce((sum, item) => sum + getQty(item.quantity), 0);
  const broomRent = totalBrooms * 200;    
  const broomDeposit = totalBrooms * 1800; 
  const broomTotal = broomRent + broomDeposit;
  
  const isMinimumMet = totalCandyItems >= 50;
  const shippingFee = (candySubtotal >= 5000 || totalCandyItems === 0) ? 0 : 350;
  const total = candySubtotal + broomTotal + shippingFee;

  useEffect(() => {
    if (cartItems.length === 0 && !isSubmitting) {
      const timer = setTimeout(() => navigateTo('list'), 3000);
      return () => clearTimeout(timer);
    }
  }, [cartItems.length, navigateTo, isSubmitting]);

  const updateQuantity = (id, delta) => {
    setCart(prev => {
      const current = parseInt(prev[id], 10) || 0;
      const next = current + delta;
      if (next <= 0) {
        const newCart = { ...prev };
        delete newCart[id];
        return newCart;
      }
      return { ...prev, [id]: next };
    });
  };

  // 🌟 全新改寫：讓直接輸入更穩定
  const handleQuantityChange = (id, value) => {
    const cleanValue = value.replace(/[^0-9]/g, ''); // 拔除所有非數字
    if (cleanValue === '') {
      setCart(prev => ({ ...prev, [id]: '' }));
      return;
    }
    const num = parseInt(cleanValue, 10);
    setCart(prev => ({ ...prev, [id]: num }));
  };

  // 🌟 若滑鼠點擊其他地方時輸入框還是空的，自動移除該商品
  const handleQuantityBlur = (id, value) => {
    const cleanValue = String(value).replace(/[^0-9]/g, '');
    if (cleanValue === '' || parseInt(cleanValue, 10) === 0) {
      removeProduct(id);
    }
  };

  const removeProduct = (id) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[id];
      return newCart;
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone' || name === 'recipientPhone') {
      const onlyNums = value.replace(/[^0-9]/g, '');
      if (onlyNums.length <= 10) {
        setFormData(prev => ({ ...prev, [name]: onlyNums }));
      }
      return;
    }

    if (name === 'deliveryCity') {
      let newAddress = formData.address || '';
      if (value === '外縣市' || value === '自取') {
        newAddress = '需配合店家時間地點自取';
      } else if (newAddress === '需配合店家時間地點自取') {
        newAddress = ''; 
      }
      setFormData(prev => ({ ...prev, [name]: value, address: newAddress }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const copyOrdererInfo = () => {
    setFormData(prev => ({
      ...prev,
      recipientName: prev.name || '',
      recipientPhone: prev.phone || ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isMinimumMet) {
      alert("糖葫蘆總數需達 50 支才能結帳喔！");
      return;
    }
    
    if (formData.eventDate && formData.eventDate < minDate) {
      alert(`活動日期需提早 14 天預訂。\n請選擇 ${minDate} 或之後的日期。`);
      return;
    }

    if (formData.deliveryTime) {
      const time = formData.deliveryTime;
      if (time < "07:00" || time > "19:00") {
        alert("送達時間僅限 07:00 ~ 19:00 之間，請重新選擇！");
        return;
      }
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setCart({});
      navigateTo('success');
      setIsSubmitting(false);
    }, 1500);
  };

  if (cartItems.length === 0 && !isSubmitting) {
    return (
      <div className="relative z-10 container mx-auto px-6 pt-40 pb-20 max-w-3xl text-center fade-in-up">
        <div className="glass-panel-light p-12 rounded-3xl border border-white/80 shadow-lg">
          <div className="w-24 h-24 bg-warmWood/20 text-warmWood rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </div>
          <h2 className="text-3xl font-bold text-darkWood mb-4 font-serif">購物車目前是空的</h2>
          <p className="text-gray-500 mb-8">您還沒有選擇任何琥珀色的甜蜜喔！即將為您導回商品頁...</p>
          <button onClick={() => navigateTo('list')} className="px-8 py-3 bg-amberRed text-white rounded-full font-bold shadow-md hover:bg-darkWood transition-colors">
            立即前往選購
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 container mx-auto px-4 sm:px-6 pt-32 pb-20 max-w-7xl fade-in-up">
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-amberRed mb-4 tracking-widest drop-shadow-sm font-serif">確認訂單</h1>
        <div className="mx-auto w-24 h-1.5 bg-warmWood rounded-full shadow-sm mb-6"></div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        
        <div className="w-full lg:w-4/12 order-2 lg:order-1">
          <div className="glass-panel-light rounded-3xl p-6 md:p-8 border border-white/80 sticky top-28 shadow-sm">
            
            <div className="flex justify-between items-center border-b border-warmWood/30 pb-4 mb-6">
              <h2 className="text-xl font-bold text-gray-800 font-serif">訂單明細</h2>
              <button type="button" onClick={() => navigateTo('list')} className="text-sm font-bold text-amberRed hover:text-darkWood flex items-center gap-1.5 transition-colors bg-amberRed/5 px-4 py-1.5 rounded-full border border-amberRed/20 hover:border-darkWood/30 hover:bg-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                返回加購
              </button>
            </div>
            
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 items-center bg-white/60 p-3 rounded-2xl border border-white hover:bg-white/90 transition-all shadow-sm">
                  <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-pureWhite border border-warmWood/20 p-1">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg mix-blend-multiply" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-bold text-darkWood text-sm">{item.name}</h3>
                    <div className="text-amberRed font-bold text-sm mb-2">NT$ {item.price}</div>
                    <div className="flex items-center space-x-1 bg-pureWhite/80 w-fit rounded-full px-1 py-0.5 border border-warmWood/20">
                      <button type="button" onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-amberRed font-bold hover:bg-amberRed hover:text-white rounded-full transition-colors">-</button>
                      
                      {/* 🌟 改為 type="text" 搭配 inputMode="numeric"，徹底解決不能直接修改的卡死 Bug */}
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        onBlur={(e) => handleQuantityBlur(item.id, e.target.value)}
                        className="w-10 text-center text-sm font-bold text-darkWood bg-transparent border-none outline-none focus:ring-0 p-0 m-0" 
                      />

                      <button type="button" onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-amberRed font-bold hover:bg-amberRed hover:text-white rounded-full transition-colors">+</button>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeProduct(item.id)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-amberRed transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="mb-6 bg-white/70 rounded-xl p-4 border border-white shadow-sm">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-darkWood">起訂門檻：50 支</span>
                <span className={`font-bold ${isMinimumMet ? 'text-green-600' : 'text-amberRed'}`}>{totalCandyItems} / 50</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className={`h-2 rounded-full transition-all duration-500 ${isMinimumMet ? 'bg-green-500' : 'bg-amberRed'}`} style={{ width: `${Math.min((totalCandyItems / 50) * 100, 100)}%` }}></div>
              </div>
              {!isMinimumMet && <p className="text-xs text-amberRed mt-2 text-right font-medium">還差 {50 - totalCandyItems} 支即可結帳</p>}
            </div>

            <div className="space-y-3 pt-4 border-t border-warmWood/30 text-darkWood">
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">糖葫蘆小計 ({totalCandyItems} 支)</span>
                <span className="font-bold">NT$ {candySubtotal}</span>
              </div>

              {totalBrooms > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">掃帚租金 ({totalBrooms} 組)</span>
                    <span className="font-bold">NT$ {broomRent}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      掃帚押金 
                      <span className="text-[10px] bg-amberRed/10 text-amberRed px-1.5 py-0.5 rounded font-bold border border-amberRed/20">歸還後退回</span>
                    </span>
                    <span className="font-bold">NT$ {broomDeposit}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-sm items-center">
                <span className="flex items-center gap-2 text-gray-600">
                  配送運費 
                  {candySubtotal >= 5000 && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-green-200">滿額免運</span>}
                </span>
                <span className="font-bold">{shippingFee === 0 ? 'NT$ 0' : `NT$ ${shippingFee}`}</span>
              </div>
              
              <div className="flex justify-between items-end pt-5 border-t border-warmWood/30 mt-2">
                <span className="font-bold text-lg text-gray-800">總計金額</span>
                <span className="text-2xl font-bold text-amberRed font-serif">NT$ {total}</span>
              </div>
              <p className="text-[13px] text-amberRed font-medium mt-3 leading-relaxed">
                * 糖葫蘆總訂購量最低需達 50 支。<br/>* 糖葫蘆商品滿 5,000 元享免運；未滿需酌收運費 350 元。
              </p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-8/12 order-1 lg:order-2">
          <form onSubmit={handleSubmit} className="glass-panel-light rounded-3xl p-6 md:p-10 border border-white/80 shadow-sm">
            
            <div className="flex items-center gap-3 mb-8 border-b border-warmWood/30 pb-5">
              <div className="w-10 h-10 bg-amberRed/10 rounded-full flex items-center justify-center text-amberRed">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 font-serif tracking-wide">填寫活動資訊</h2>
            </div>

            <h3 className="text-lg font-bold text-[#8B4513] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-amberRed rounded-full"></span> 訂購人資訊
            </h3>
            
            <div className="bg-white/50 p-6 rounded-2xl border border-white/80 mb-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-darkWood/80 ml-1">聯絡人姓名 <span className="text-amberRed">*</span></label>
                  <input required type="text" name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amberRed/30 focus:border-amberRed transition-all shadow-sm" placeholder="請輸入全名" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-darkWood/80 ml-1">聯絡電話 <span className="text-amberRed">*</span></label>
                  <input 
                    required 
                    type="tel" 
                    name="phone" 
                    value={formData.phone || ''} 
                    onChange={handleInputChange} 
                    maxLength="10"
                    minLength="10"
                    pattern="09[0-9]{8}"
                    title="請輸入 10 位數字的手機號碼 (例如: 0912345678)"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amberRed/30 focus:border-amberRed transition-all shadow-sm" 
                    placeholder="0912345678" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-darkWood/80 ml-1">電子郵件 <span className="text-amberRed">*</span></label>
                <input required type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amberRed/30 focus:border-amberRed transition-all shadow-sm" placeholder="example@email.com" />
                <p className="text-xs text-amberRed font-medium ml-1 mt-1">※ 系統將自動發送訂單明細 PDF 至此信箱</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#8B4513] flex items-center gap-2">
                <span className="w-1.5 h-4 bg-amberRed rounded-full"></span> 收貨人資訊
              </h3>
              <button type="button" onClick={copyOrdererInfo} className="text-sm bg-warmWood/10 text-[#8B4513] font-bold px-3 py-1.5 rounded-lg border border-warmWood/30 hover:bg-warmWood/20 transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
                同訂購人
              </button>
            </div>
            
            <div className="bg-white/50 p-6 rounded-2xl border border-white/80 mb-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-darkWood/80 ml-1">收貨人姓名 <span className="text-amberRed">*</span></label>
                  <input required type="text" name="recipientName" value={formData.recipientName || ''} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amberRed/30 focus:border-amberRed transition-all shadow-sm" placeholder="現場負責點交的聯絡人" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-darkWood/80 ml-1">收貨人電話 <span className="text-amberRed">*</span></label>
                  <input 
                    required 
                    type="tel" 
                    name="recipientPhone" 
                    value={formData.recipientPhone || ''} 
                    onChange={handleInputChange} 
                    maxLength="10"
                    minLength="10"
                    pattern="09[0-9]{8}"
                    title="請輸入 10 位數字的手機號碼 (例如: 0912345678)"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amberRed/30 focus:border-amberRed transition-all shadow-sm" 
                    placeholder="0912345678" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5 md:col-span-1">
                  <label className="block text-sm font-bold text-darkWood/80 ml-1">配送縣市 <span className="text-amberRed">*</span></label>
                  <div className="relative">
                    <select required name="deliveryCity" value={formData.deliveryCity || ''} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amberRed/30 focus:border-amberRed transition-all shadow-sm text-gray-700 appearance-none cursor-pointer">
                      <option value="" disabled>請選擇縣市</option>
                      <option value="臺北市">臺北市</option>
                      <option value="新北市">新北市</option>
                      <option value="外縣市">外縣市</option>
                      <option value="自取">自取</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-sm font-bold text-darkWood/80 ml-1">詳細地址 <span className="text-amberRed">*</span></label>
                  <input 
                    required 
                    type="text" 
                    name="address" 
                    value={formData.address || ''} 
                    onChange={handleInputChange} 
                    className={`w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amberRed/30 focus:border-amberRed transition-all shadow-sm ${
                      (formData.deliveryCity === '外縣市' || formData.deliveryCity === '自取') ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`} 
                    placeholder="請輸入完整路名與門牌" 
                    readOnly={formData.deliveryCity === '外縣市' || formData.deliveryCity === '自取'}
                  />
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-[#8B4513] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-amberRed rounded-full"></span> 活動細節
            </h3>
            
            <div className="bg-white/50 p-6 rounded-2xl border border-white/80 mb-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-darkWood/80 ml-1">活動日期 (請填西元年) <span className="text-amberRed">*</span></label>
                  <input 
                    required 
                    type="date" 
                    name="eventDate" 
                    value={formData.eventDate || ''} 
                    onChange={handleInputChange} 
                    min={minDate}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amberRed/30 focus:border-amberRed transition-all shadow-sm text-gray-700" 
                  />
                  <p className="text-xs text-amberRed font-medium ml-1 mt-1">※ 需提前至少 14 天預訂</p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-darkWood/80 ml-1">希望送達時間 (24小時制) <span className="text-amberRed">*</span></label>
                  <div className="relative">
                    <select 
                      required 
                      name="deliveryTime" 
                      value={formData.deliveryTime || ''} 
                      onChange={handleInputChange} 
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amberRed/30 focus:border-amberRed transition-all shadow-sm text-gray-700 appearance-none cursor-pointer"
                    >
                      <option value="" disabled>請選擇時間</option>
                      {timeOptions.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 ml-1 mt-1">限定時段：07:00 ~ 19:00</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-darkWood/80 ml-1">活動類別 <span className="text-amberRed">*</span></label>
                <div className="relative">
                  <select required name="eventType" value={formData.eventType || ''} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amberRed/30 focus:border-amberRed transition-all shadow-sm text-gray-700 appearance-none cursor-pointer">
                    <option value="" disabled>請選擇活動類別</option>
                    <option value="wedding">浪漫婚禮 (婚宴/家宴)</option>
                    <option value="school">校園活動 (園遊會/校慶)</option>
                    <option value="corporate">企業行銷 (尾牙/春酒/發表會)</option>
                    <option value="other">其他私人聚會</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {formData.eventType === 'wedding' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-5 border-t border-gray-200/60 mt-2 animate-[fadeIn_0.4s_ease-in-out]">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-darkWood/80 ml-1">婚宴餐廳名稱</label>
                    <input type="text" name="restaurantName" value={formData.restaurantName || ''} onChange={handleInputChange} className="w-full bg-amberRed/5 border border-amberRed/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amberRed/30 focus:border-amberRed transition-all shadow-sm" placeholder="例如：彭園、典華" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-darkWood/80 ml-1">廳別</label>
                    <input type="text" name="hallName" value={formData.hallName || ''} onChange={handleInputChange} className="w-full bg-amberRed/5 border border-amberRed/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amberRed/30 focus:border-amberRed transition-all shadow-sm" placeholder="例如：國際宴會廳" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-darkWood/80 ml-1">新人資訊</label>
                    <input type="text" name="coupleName" value={formData.coupleName || ''} onChange={handleInputChange} className="w-full bg-amberRed/5 border border-amberRed/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amberRed/30 focus:border-amberRed transition-all shadow-sm" placeholder="例如：王小明 & 陳小美" />
                  </div>
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <label className="block text-sm font-bold text-darkWood/80 ml-1">備註事項</label>
                <textarea name="remarks" value={formData.remarks || ''} onChange={handleInputChange} rows="3" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amberRed/30 focus:border-amberRed transition-all shadow-sm custom-scrollbar resize-none" placeholder="有任何特殊需求、場地限制或婚企聯絡方式，請在此告訴我們..."></textarea>
              </div>
            </div>

            {/* 送出按鈕 */}
            <button 
              type="submit" 
              disabled={!isMinimumMet || isSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 flex justify-center items-center gap-2 ${
                !isMinimumMet ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-amberRed to-[#802020] text-white hover:shadow-[0_10px_20px_rgba(165,42,42,0.2)] hover:-translate-y-1'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  處理中...
                </span>
              ) : (
                <>確認送出訂單 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></>
              )}
            </button>
            {!isMinimumMet && (
              <p className="text-center text-sm text-amberRed font-bold mt-4 animate-pulse">
                ※ 請先將糖葫蘆數量加至 50 支以上即可解鎖結帳
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;