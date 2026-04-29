import React from 'react';

const Step2Location = ({ formData, handleFormChange }) => {
  // 💡 內聚邏輯 1：判斷是否為自取
  const isLocked = formData.deliveryCity === 'pickup';
  
  // 💡 內聚邏輯 2：縣市對照表
  const cityMap = { 
    taipei: '臺北市', 
    new_taibei: '新北市', 
    new_taipei: '新北市', 
    pickup: '自取' 
  };
  const currentCityName = cityMap[formData.deliveryCity] || '請選擇縣市';

  // 💡 內聚邏輯 3：產生營業時間選單 (06:30 ~ 19:00，每半小時一距)
  const renderTimeOptions = () => { 
    let options = [<option key="empty" value="" disabled>請選擇時間</option>];
    for (let m = 6 * 60 + 30; m <= 19 * 60; m += 30) {
        const h = Math.floor(m / 60); 
        const mins = m % 60;
        const timeStr = `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        options.push(<option key={timeStr} value={timeStr}>{timeStr}</option>);
    }
    return options;
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <h2 className="text-2xl font-bold text-darkWood mb-6 font-serif flex items-center gap-2">
        <span className="bg-amberRed/10 p-2 rounded-lg text-amberRed">02</span> 場地與物流資訊
      </h2>
      
      <div>
        <label className="block text-sm font-medium text-darkWood mb-2">配送縣市 *</label>
        <select 
          name="deliveryCity" 
          required 
          value={formData.deliveryCity} 
          onChange={handleFormChange} 
          className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none"
        >
          <option value="" disabled>請選擇縣市</option>
          <option value="taipei">臺北市</option>
          <option value="new_taibei">新北市</option>
          <option value="pickup">自取</option>
        </select>
      </div>

      {/* 依照是否為自取，動態顯示/隱藏詳細資訊 */}
      {!isLocked && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-darkWood mb-2">收貨時間 *</label>
            <select 
              name={formData.eventType === 'wedding' ? 'weddingTime' : 'generalTime'} 
              required 
              value={formData.weddingTime || formData.generalTime} 
              onChange={handleFormChange} 
              className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none"
            >
              {renderTimeOptions()}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-darkWood mb-2">地點名稱 *</label>
            <input 
              type="text" 
              name={formData.eventType === 'wedding' ? 'weddingLocation' : 'generalLocation'} 
              required 
              placeholder={formData.eventType === 'wedding' ? '例：○○婚宴會館○○廳' : '例：OO國小'} 
              value={formData.eventType === 'wedding' ? formData.weddingLocation : formData.generalLocation} 
              onChange={handleFormChange} 
              className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none" 
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-darkWood mb-2">
          {isLocked ? '取貨方式' : '完整地址 *'}
        </label>
        
        {isLocked ? (
          <input 
            type="text" 
            disabled 
            value="需配合商家時間地點自取" 
            className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-gray-100 text-gray-500" 
          />
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-stretch w-full rounded-xl border border-warmWood/30 overflow-hidden bg-pureWhite">
              <div className="bg-gray-50 text-gray-600 px-4 py-3 border-r border-warmWood/30 font-bold flex items-center shrink-0">
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
            <p className="text-xs text-amberRed font-medium leading-relaxed pl-1">
              💡 溫馨提醒：因專車配送行程緊湊與人力限制，<span className="font-bold underline">司機無法協助送上樓或送入會場內</span>。屆時需勞煩您安排親友至一樓大門口或會場外與司機面交取貨，感謝您的體諒與配合！
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-darkWood mb-2">特殊備註</label>
        <textarea 
          name="notes" 
          rows="3" 
          placeholder="若有特殊進場動線需求請在此填寫..." 
          value={formData.notes} 
          onChange={handleFormChange} 
          className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none resize-none" 
        />
      </div>
    </div>
  );
};

export default Step2Location;