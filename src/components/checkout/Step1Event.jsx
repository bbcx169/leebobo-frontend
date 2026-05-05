import React, { useState } from 'react';
import { db } from '../../utils/firebase'; 
import { collection, query, where, getDocs } from 'firebase/firestore';

const Step1Event = ({ formData, handleFormChange, getMinDate, currentTotalQty = 0 }) => {
  const [isChecking, setIsChecking] = useState(false);

  const handleDateValidation = async (e) => {
    // ⚠️ 必須在進入非同步 (await) 之前，先把這些值「拷貝」保存下來
    const selectedDate = e.target.value;
    const inputName = e.target.name; 

    // 1. 先立刻更新父元件的狀態，讓畫面上的日期馬上改變！
    handleFormChange({ target: { name: inputName, value: selectedDate } });

    // 如果使用者是手動清空日期，直接結束，不用查資料庫
    if (!selectedDate) {
      return;
    }

    // 開始背景檢查額度
    setIsChecking(true);
    try {
      let totalCandiesUsed = 0;
      
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("eventDate", "==", selectedDate));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        const orderData = doc.data();
        
        // ✨【關鍵修正】：從 cart 購物車裡面計算真實的「糖葫蘆數量」，不再讀取 candyTotal(金額)
        if (orderData.cart) {
          Object.entries(orderData.cart).forEach(([id, qty]) => {
            if (parseInt(id) !== 5) { // 排除 ID 為 5 的承租掃帚
              totalCandiesUsed += qty;
            }
          });
        }
      });

      const remaining = Math.max(0, 800 - totalCandiesUsed);

      // 判斷額度是否足夠
      if (remaining < currentTotalQty) {
        alert(`非常抱歉，為堅持手工新鮮製作的品質，我們每日產能上限為 800 支。\n\n您選擇的日期目前剩餘可訂購額度為 ${remaining} 支。\n\n請微調數量或選擇其他日期，感謝您的體諒！🍡`);
        
        // 額度不足，強迫把剛剛寫入的日期清空
        handleFormChange({ target: { name: inputName, value: '' } });
      } else {
        console.log(`日期驗證成功！該日剩餘額度：${remaining} 支`); 
      }
    } catch (error) {
      console.error('日期驗證失敗:', error);
      alert('系統暫時無法核對產能額度，請稍後再試。');
      
      // 發生錯誤為求安全，也清空日期
      handleFormChange({ target: { name: inputName, value: '' } });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <h2 className="text-2xl font-bold text-darkWood mb-6 font-serif flex items-center gap-2">
        <span className="bg-amberRed/10 p-2 rounded-lg text-amberRed">01</span> 活動類型與日期
      </h2>
      
      <div>
        <label className="block text-sm font-medium text-darkWood mb-2">活動類型 *</label>
        <select 
          name="eventType" 
          required 
          value={formData.eventType} 
          onChange={handleFormChange} 
          className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none"
        >
          <option value="" disabled>請選擇活動類型</option>
          <option value="wedding">浪漫婚禮 / 喜宴</option>
          <option value="school">校園活動 / 園遊會</option>
          <option value="other">其他</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-darkWood mb-2 flex items-center">
          預計日期 * (需14天後)
          {isChecking && <span className="text-amberRed text-xs ml-3 animate-pulse">⏳ 核對額度中...</span>}
        </label>
        <input 
          type="date" 
          name={formData.eventType === 'wedding' ? 'weddingDate' : 'generalDate'} 
          required 
          min={getMinDate()} 
          value={formData.eventType === 'wedding' ? (formData.weddingDate || '') : (formData.generalDate || '')} 
          onChange={handleDateValidation} 
          disabled={isChecking}
          className={`w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none transition-opacity ${isChecking ? 'opacity-50 cursor-not-allowed' : ''}`} 
        />
      </div>
    </div>
  );
};

export default Step1Event;