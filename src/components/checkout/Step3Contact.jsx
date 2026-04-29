import React from 'react';

const Step3Contact = ({ formData, handleFormChange, isSameAsOrderer, setIsSameAsOrderer }) => {
  // 💡 內聚邏輯：判斷是否為自取，以決定顯示「收貨人」或「取貨人」標籤
  const isLocked = formData.deliveryCity === 'pickup';

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <h2 className="text-2xl font-bold text-darkWood mb-6 font-serif flex items-center gap-2">
        <span className="bg-amberRed/10 p-2 rounded-lg text-amberRed">03</span> 聯絡資訊
      </h2>
      
      {/* 訂購人區塊 */}
      <div className="p-5 bg-creamBg/50 rounded-xl border border-warmWood/20 space-y-4">
        <p className="font-bold text-amberRed text-sm">訂購人*</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="text" 
            name="ordererName" 
            required 
            placeholder="姓名 *" 
            value={formData.ordererName} 
            onChange={handleFormChange} 
            className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none" 
          />
          <input 
            type="tel" 
            name="ordererPhone" 
            required 
            maxLength="10" 
            inputMode="numeric" 
            placeholder="聯絡手機(10位數字)*" 
            value={formData.ordererPhone} 
            onChange={handleFormChange} 
            className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none" 
          />
          
          <div className="md:col-span-2">
            <input 
              type="email" 
              name="ordererEmail" 
              placeholder="電子信箱" 
              value={formData.ordererEmail} 
              onChange={handleFormChange} 
              className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none focus:ring-2 focus:ring-amberRed transition-all" 
            />
            <p className="text-xs text-darkWood/60 mt-2 font-medium pl-1">💡 填寫可收取系統自動發送的訂單明細 (PDF)</p>
          </div>
        </div>
      </div>

      {/* 依照活動類型，切換收貨人顯示模式 */}
      {formData.eventType === 'wedding' ? (
        /* 模式 A：婚禮雙代收人 */
        <div className="p-5 bg-pureWhite rounded-xl border border-warmWood/20 space-y-5">
          <div className="bg-amberRed/10 border border-amberRed/20 p-4 rounded-xl text-sm text-amberRed font-medium leading-relaxed">
            💡 婚宴當日新人行程緊湊且環境嘈雜，常有漏接電話之情事。為確保糖葫蘆順利送達，請提供<span className="font-bold underline decoration-2 underline-offset-2">兩位現場代收親友</span>（如：伴郎、總召或工作人員）的聯絡資訊，讓您能安心享受專屬於您的美好時刻。🍡
          </div>
          
          <div>
            <p className="font-bold text-darkWood text-sm border-b border-warmWood/20 pb-2 mb-3">收貨人 1 (現場代收親友)*</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                name="recipientName" 
                required 
                placeholder="姓名 *" 
                value={formData.recipientName || ''} 
                onChange={handleFormChange} 
                className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-gray-50 focus:bg-white outline-none" 
              />
              <input 
                type="tel" 
                name="recipientPhone" 
                required 
                maxLength="10" 
                inputMode="numeric" 
                placeholder="聯絡手機(10位數字)*" 
                value={formData.recipientPhone || ''} 
                onChange={handleFormChange} 
                className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-gray-50 focus:bg-white outline-none" 
              />
            </div>
          </div>

          <div>
            <p className="font-bold text-darkWood text-sm border-b border-warmWood/20 pb-2 mb-3">收貨人 2 (現場代收親友)*</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                name="recipientName2" 
                required 
                placeholder="姓名 *" 
                value={formData.recipientName2 || ''} 
                onChange={handleFormChange} 
                className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-gray-50 focus:bg-white outline-none" 
              />
              <input 
                type="tel" 
                name="recipientPhone2" 
                required 
                maxLength="10" 
                inputMode="numeric" 
                placeholder="聯絡手機(10位數字)*" 
                value={formData.recipientPhone2 || ''} 
                onChange={handleFormChange} 
                className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-gray-50 focus:bg-white outline-none" 
              />
            </div>
          </div>
        </div>
      ) : (
        /* 模式 B：一般活動/自取模式 (含同訂購人選鈕) */
        <div className="p-5 bg-pureWhite rounded-xl border border-warmWood/20 space-y-4">
          <div className="flex justify-between items-center">
            <p className="font-bold text-darkWood text-sm">{isLocked ? '取貨人*' : '收貨人*'}</p>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-600">
              <input 
                type="checkbox" 
                checked={isSameAsOrderer} 
                onChange={(e) => setIsSameAsOrderer(e.target.checked)} 
                className="w-4 h-4" 
              /> 
              ☑️ 同訂購人
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              name="recipientName" 
              required 
              placeholder="姓名 *" 
              value={formData.recipientName} 
              onChange={handleFormChange} 
              disabled={isSameAsOrderer} 
              className={`w-full px-4 py-3 rounded-xl border border-warmWood/30 ${isSameAsOrderer ? 'bg-gray-50' : 'bg-pureWhite'}`} 
            />
            <input 
              type="tel" 
              name="recipientPhone" 
              required 
              maxLength="10" 
              inputMode="numeric" 
              placeholder="聯絡手機(10位數字)*" 
              value={formData.recipientPhone} 
              onChange={handleFormChange} 
              disabled={isSameAsOrderer} 
              className={`w-full px-4 py-3 rounded-xl border border-warmWood/30 ${isSameAsOrderer ? 'bg-gray-50' : 'bg-pureWhite'}`} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Step3Contact;