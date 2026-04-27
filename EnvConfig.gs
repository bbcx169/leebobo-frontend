/**
 * 安全性工具模組：負責管理敏感資訊
 * 避免將 API Key 硬編碼在程式碼中，防止洩漏至 GitHub
 */

const EnvConfig = {
  /**
   * 取得 API 金鑰
   * @param {string} keyName 屬性名稱 (例如 'GEMINI_API_KEY')
   * @return {string} 回傳儲存的密鑰字串
   */
  getSecret: function(keyName) {
    try {
      const scriptProperties = PropertiesService.getScriptProperties();
      const value = scriptProperties.getProperty(keyName);
      
      if (!value) {
        Logger.log('⚠️ 警告：找不到屬性 ' + keyName + '，請確認 GAS 專案設定中已加入此屬性。');
        return null;
      }
      
      return value;
    } catch (e) {
      Logger.log('❌ 讀取 Properties 發生錯誤：' + e.message);
      return null;
    }
  },

  /**
   * 設定 API 金鑰（通常在初始化或開發時執行一次即可）
   * @param {string} keyName 屬性名稱
   * @param {string} keyValue 密鑰內容
   */
  setSecret: function(keyName, keyValue) {
    try {
      PropertiesService.getScriptProperties().setProperty(keyName, keyValue);
      Logger.log('✅ 成功儲存屬性：' + keyName);
    } catch (e) {
      Logger.log('❌ 儲存 Properties 發生錯誤：' + e.message);
    }
  }
};

/**
 * 測試範例：如何呼叫 Gemini API 並使用安全密鑰
 */
function callGeminiExample() {
  // 從系統屬性中安全地取得 API Key，而不是直接寫在程式碼中
  const apiKey = EnvConfig.getSecret('GEMINI_API_KEY');
  
  if (!apiKey) return;

  // 之後的 API 呼叫邏輯...
  Logger.log('成功取得密鑰，準備發送請求...');
}