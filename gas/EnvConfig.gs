// EnvConfig.gs

/**
 * ==========================================
 * 李伯伯糖葫蘆 - 環境設定與全域參數 (EnvConfig.gs)
 * ==========================================
 * 此檔案存放微服務所需的 API Token、ID、價格對照表。
 * Firestore 為訂單主資料庫；Google Sheets 僅作為雲端硬碟中的營運報表副本。
 */

// 📧 通知設定
const NOTIFY_EMAIL = 'bbcx169@gmail.com';

// 💬 LINE Messaging API 設定
const LINE_CHANNEL_ACCESS_TOKEN = 'Szz8gLG1ZeHuVW9DoTRtFf86tmxkfl4k0uGmD1xttmvdZIvQ800W/UDGJ23GeYjdHA/pCFm2oabZC/u3JQ+crvIMwwNHStr8ulYPPBtHwoKul2vFm97nUWvBkdmCqM1v8vxdCIcRbUGlBWkawcj9ZwdB04t89/1O/w1cDnyilFU=';
const LINE_ADMIN_USER_ID = ['U4460cd7d1f421c42d6dbf0f07253580e'];

// Telegram Bot API settings
const TELEGRAM_BOT_TOKEN = '8610077153:AAHBvpzWgGZ9EzKSZ3b5cp7wv82EFkkNBBA';
const TELEGRAM_CHAT_ID = '1095695500, -1003908376977';

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

// 🔐 權限與安全 (備用密碼)
const ADMIN_LINE_IDS = ['U4460cd7d1f421c42d6dbf0f07253580e'];
const ADMIN_PASSWORD = 'leebobo_admin';

// 📁 雲端硬碟 PDF 資料夾設定
const PDF_FOLDER_ID = '1GrWJtbw51RTZ-a0fGkrCqbiLpLgOqxH7';

// 📊 Google Sheets 訂單報表設定
// 若留空，第一次同步訂單時會自動建立「李伯伯糖葫蘆訂單報表」，並把試算表 ID 存到 Script Properties。
const ORDER_REPORT_SPREADSHEET_ID = '';
const ORDER_REPORT_SHEET_NAME = '訂單報表';

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
