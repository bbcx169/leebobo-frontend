function sendLineOfficialMessage(text) {
  const messageText = text ? String(text).trim() : "⚠️ 系統測試正常。";
  if (!messageText) return;
  const lineAccessToken = getNotificationConfigValue("LINE_CHANNEL_ACCESS_TOKEN", typeof LINE_CHANNEL_ACCESS_TOKEN !== "undefined" ? LINE_CHANNEL_ACCESS_TOKEN : "");
  const lineAdminUserId = getNotificationConfigValue("LINE_ADMIN_USER_ID", typeof LINE_ADMIN_USER_ID !== "undefined" ? LINE_ADMIN_USER_ID : "");
  if (!lineAccessToken || !lineAdminUserId) return;

  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = { to: lineAdminUserId, messages: [{ type: 'text', text: messageText }] };
  const options = {
    method: 'post',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + lineAccessToken },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  try { UrlFetchApp.fetch(url, options); } catch (e) { Logger.log(e); }
}

function sendMerchantNotification(text) {
  const messageText = text ? String(text).trim() : "";
  if (!messageText) return;
  sendLineOfficialMessage(messageText);
  sendTelegramMessage(messageText);
}

function getNotificationConfigValue(keyName, fallbackValue) {
  if (fallbackValue) return fallbackValue;
  try { return PropertiesService.getScriptProperties().getProperty(keyName) || ""; } catch (e) { return ""; }
}

function sendTelegramMessage(text) {
  const botToken = getNotificationConfigValue("TELEGRAM_BOT_TOKEN", typeof TELEGRAM_BOT_TOKEN !== "undefined" ? TELEGRAM_BOT_TOKEN : "");
  const chatId = getNotificationConfigValue("TELEGRAM_CHAT_ID", typeof TELEGRAM_CHAT_ID !== "undefined" ? TELEGRAM_CHAT_ID : "");
  const messageText = text ? String(text).trim() : "";

  if (!messageText || !botToken || !chatId) return;

  const url = "https://api.telegram.org/bot" + botToken + "/sendMessage";
  String(chatId).split(/[,\n]/).map(c => c.trim()).filter(c => c).forEach(targetChatId => {
    const payload = { chat_id: targetChatId, text: messageText, disable_web_page_preview: true };
    const options = { method: "post", contentType: "application/json", payload: JSON.stringify(payload), muteHttpExceptions: true };
    try { UrlFetchApp.fetch(url, options); } catch (e) { Logger.log(e); }
  });
}
