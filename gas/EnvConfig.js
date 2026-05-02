/**
 * ==========================================
 * 李伯伯糖葫蘆 - 環境設定與全域參數 (EnvConfig.gs)
 * ==========================================
 * 此檔案專門存放系統所需的 API Token、ID、價格對照表與開關。
 * 修改此處設定即可改變系統行為，不需動到核心邏輯。
 */

// 📧 通知設定
const NOTIFY_EMAIL = 'bbcx169@gmail.com';

// 💬 LINE Messaging API 設定
const LINE_CHANNEL_ACCESS_TOKEN = 'Szz8gLG1ZeHuVW9DoTRtFf86tmxkfl4k0uGmD1xttmvdZIvQ800W/UDGJ23GeYjdHA/pCFm2oabZC/u3JQ+crvIMwwNHStr8ulYPPBtHwoKul2vFm97nUWvBkdmCqM1v8vxdCIcRbUGlBWkawcj9ZwdB04t89/1O/w1cDnyilFU=';
const LINE_ADMIN_USER_ID = 'U4460cd7d1f421c42d6dbf0f07253580e';

// Telegram Bot API settings. Prefer setting these in Apps Script Properties:
// TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.
const TELEGRAM_BOT_TOKEN = '';
const TELEGRAM_CHAT_ID = '';

function setTelegramNotificationProperties(botToken, chatId) {
  if (!botToken || !chatId) {
    throw new Error('Telegram bot token and chat id are required.');
  }

  PropertiesService.getScriptProperties().setProperties({
    TELEGRAM_BOT_TOKEN: String(botToken),
    TELEGRAM_CHAT_ID: String(chatId)
  });

  return 'Telegram notification properties updated.';
}

// 🔐 權限與安全
const ADMIN_LINE_IDS = [
  'U4460cd7d1f421c42d6dbf0f07253580e', 
  '2009807397-WPVPBokl'
];
const ADMIN_PASSWORD = 'leebobo_admin';

// 📊 試算表與雲端硬碟設定
const SHEET_TAB_NAME = '工作表1';
const PDF_FOLDER_ID = '1GrWJtbw51RTZ-a0fGkrCqbiLpLgOqxH7';

// 🚀 業務邏輯限制
const DAILY_LIMIT = 800; // 每日產能上限

// 🛍️ 產品價格對照表 (用於計算總金額與 PDF 顯示)
const PRODUCTS = {
  '1': { name: '蕃茄 (小/喜糖)', price: 20 },
  '2': { name: '蕃茄蜜餞 (小/喜糖)', price: 25 },
  '3': { name: '鳥梨 (小/喜糖)', price: 20 },
  '4': { name: '蕃茄+鳥梨 (小/喜糖)', price: 20 },
  '5': { name: '承租掃帚', price: 2000 },
  '6': { name: '蕃茄 (經典)', price: 30 },
  '7': { name: '蕃茄蜜餞 (經典)', price: 35 },
  '8': { name: '鳥梨 (經典)', price: 35 }
};
