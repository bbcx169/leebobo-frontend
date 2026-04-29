import React from 'react';

const Step1Event = ({ formData, handleFormChange, getMinDate }) => {
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
        <label className="block text-sm font-medium text-darkWood mb-2">預計日期 * (需14天後)</label>
        <input 
          type="date" 
          name={formData.eventType === 'wedding' ? 'weddingDate' : 'generalDate'} 
          required 
          min={getMinDate()} 
          value={formData.weddingDate || formData.generalDate} 
          onChange={handleFormChange} 
          className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite outline-none" 
        />
      </div>
    </div>
  );
};

export default Step1Event;