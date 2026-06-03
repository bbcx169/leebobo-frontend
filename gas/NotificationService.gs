const NOTIFICATION_SETTINGS_COLLECTION = 'settings';
const NOTIFICATION_SETTINGS_DOCUMENT = 'notificationSettings';
const NOTIFICATION_LOGS_COLLECTION = 'notificationLogs';
const NOTIFICATION_LOG_RETENTION_DAYS = 60;
const NOTIFICATION_LOG_PRUNE_INTERVAL_HOURS = 12;

const NOTIFICATION_EVENT_DEFINITIONS = [
  { key: 'newOrder', label: '新訂單' },
  { key: 'dailyShippingReminder', label: '每日出貨提醒' },
  { key: 'orderUpdated', label: '訂單修改' },
  { key: 'orderDeleted', label: '訂單刪除' },
  { key: 'resendPdf', label: '補寄 PDF' },
  { key: 'sheetSyncFailed', label: 'Sheets 同步失敗' },
  { key: 'notificationFailed', label: '通知失敗' },
  { key: 'testNotification', label: '測試通知' }
];

function sendLineOfficialMessage(text) {
  const messageText = text ? String(text).trim() : '';
  if (!messageText) return;
  const fallbackUserId = getNotificationConfigValue("LINE_ADMIN_USER_ID", typeof LINE_ADMIN_USER_ID !== "undefined" ? LINE_ADMIN_USER_ID : "");
  sendLineMessageToUser(messageText, Array.isArray(fallbackUserId) ? fallbackUserId[0] : fallbackUserId);
}

function sendMerchantNotification(text, options) {
  const messageText = text ? String(text).trim() : "";
  if (!messageText) return;
  dispatchAdminNotification('newOrder', messageText, options || {});
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

  String(chatId).split(/[,\n]/).map(function(c) { return c.trim(); }).filter(function(c) { return c; }).forEach(function(targetChatId) {
    sendTelegramMessageToChat(messageText, targetChatId);
  });
}

function getNotificationSettings() {
  const document = getFirestoreDocument(NOTIFICATION_SETTINGS_COLLECTION, NOTIFICATION_SETTINGS_DOCUMENT);
  if (!document) {
    return getDefaultNotificationSettings();
  }

  return normalizeNotificationSettings(firestoreDocumentToPlainObject(document));
}

function getNotificationSettingsForAdmin() {
  return maskNotificationSettingsForAdmin(getNotificationSettings());
}

function saveNotificationSettings(settings) {
  const currentSettings = getNotificationSettings();
  const mergedSettings = mergeNotificationSettingsForSave(currentSettings, settings || {});
  const normalizedSettings = normalizeNotificationSettings(mergedSettings);
  normalizedSettings.updatedAt = new Date();
  setFirestoreDocument(NOTIFICATION_SETTINGS_COLLECTION, NOTIFICATION_SETTINGS_DOCUMENT, normalizedSettings);
  return maskNotificationSettingsForAdmin(normalizeNotificationSettings(normalizedSettings));
}

function dispatchAdminNotification(eventKey, messageText, options) {
  const settings = getNotificationSettings();
  const eventDefinition = getNotificationEventDefinition(eventKey);
  const rule = settings.rules[eventKey] || {};
  const deliveries = getRuleDeliveries(settings, rule);
  const subject = (options && options.subject) || eventDefinition.label;
  const attachments = (options && options.attachments) || [];
  const results = [];

  if (rule.enabled === false || !deliveries.length) {
    logNotificationResult({
      eventKey: eventKey,
      eventLabel: eventDefinition.label,
      channel: 'system',
      recipientName: '',
      recipientId: '',
      target: '',
      status: 'skipped',
      error: 'Notification rule disabled or has no active channel/recipient.'
    });
    return results;
  }

  deliveries.forEach(function(delivery) {
    const channel = delivery.channel;
    const recipient = delivery.recipient;
    const target = getRecipientTarget(recipient, channel);
    const baseLog = {
      eventKey: eventKey,
      eventLabel: eventDefinition.label,
      channel: channel,
      recipientName: recipient.name || recipient.id || '',
      recipientId: recipient.id || '',
      target: target
    };

    if (!target) {
      const skippedResult = Object.assign({}, baseLog, {
        status: 'skipped',
        error: 'Recipient has no target for ' + channel + '.'
      });
      logNotificationResult(skippedResult);
      results.push(skippedResult);
      return;
    }

    try {
      sendNotificationChannel(channel, target, subject, messageText, attachments);
      const successResult = Object.assign({}, baseLog, { status: 'success', error: '' });
      logNotificationResult(successResult);
      results.push(successResult);
    } catch (err) {
      const failureResult = Object.assign({}, baseLog, {
        status: 'failure',
        error: err.toString()
      });
      logNotificationResult(failureResult);
      results.push(failureResult);
    }
  });

  return results;
}

function sendTestNotification(data) {
  const settings = getNotificationSettings();
  const recipient = (settings.recipients || []).filter(function(item) {
    return item.id === data.recipientId;
  })[0];
  const channel = String(data.channel || '').trim();

  if (!recipient) throw new Error('Recipient not found.');
  if (['email', 'line', 'telegram'].indexOf(channel) === -1) throw new Error('Unsupported notification channel.');

  const target = getRecipientTarget(recipient, channel);
  if (!target) throw new Error('Recipient has no target for ' + channel + '.');

  const subject = '李伯伯糖葫蘆測試通知';
  const messageText = '這是一則測試通知，用來確認後台通知設定是否正確。';
  try {
    sendNotificationChannel(channel, target, subject, messageText, []);
    const result = {
      eventKey: 'testNotification',
      eventLabel: '測試通知',
      channel: channel,
      recipientName: recipient.name || recipient.id || '',
      recipientId: recipient.id || '',
      target: target,
      status: 'success',
      error: ''
    };
    logNotificationResult(result);
    return result;
  } catch (err) {
    const failedResult = {
      eventKey: 'testNotification',
      eventLabel: '測試通知',
      channel: channel,
      recipientName: recipient.name || recipient.id || '',
      recipientId: recipient.id || '',
      target: target,
      status: 'failure',
      error: err.toString()
    };
    logNotificationResult(failedResult);
    throw err;
  }
}

function getNotificationLogs(limitCount) {
  const result = runFirestoreQuery({
    from: [{ collectionId: NOTIFICATION_LOGS_COLLECTION }],
    orderBy: [
      { field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }
    ],
    limit: Number(limitCount) || 50
  });

  return result
    .filter(function(item) { return item.document; })
    .map(function(item) { return firestoreDocumentToPlainObject(item.document); });
}

function sendNotificationChannel(channel, target, subject, messageText, attachments) {
  if (channel === 'email') {
    const payload = {
      to: target,
      subject: subject,
      body: messageText
    };
    if (attachments && attachments.length) {
      payload.attachments = attachments;
    }
    MailApp.sendEmail(payload);
    return;
  }

  if (channel === 'line') {
    sendLineMessageToUser(messageText, target);
    return;
  }

  if (channel === 'telegram') {
    splitNotificationTargets(target).forEach(function(targetChatId) {
      sendTelegramMessageToChat(messageText, targetChatId);
    });
    return;
  }

  throw new Error('Unsupported notification channel: ' + channel);
}

function sendLineMessageToUser(text, lineUserId) {
  const messageText = text ? String(text).trim() : "";
  const targetUserId = Array.isArray(lineUserId) ? lineUserId[0] : String(lineUserId || '').trim();
  const lineAccessToken = getNotificationConfigValue("LINE_CHANNEL_ACCESS_TOKEN", typeof LINE_CHANNEL_ACCESS_TOKEN !== "undefined" ? LINE_CHANNEL_ACCESS_TOKEN : "");

  if (!messageText || !lineAccessToken || !targetUserId) {
    throw new Error('LINE token or user id is not configured.');
  }

  const response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + lineAccessToken },
    payload: JSON.stringify({ to: targetUserId, messages: [{ type: 'text', text: messageText }] }),
    muteHttpExceptions: true
  });
  const statusCode = response.getResponseCode();
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('LINE push failed (' + statusCode + '): ' + response.getContentText());
  }
}

function sendTelegramMessageToChat(text, telegramChatId) {
  const botToken = getNotificationConfigValue("TELEGRAM_BOT_TOKEN", typeof TELEGRAM_BOT_TOKEN !== "undefined" ? TELEGRAM_BOT_TOKEN : "");
  const targetChatId = String(telegramChatId || '').trim();
  const messageText = text ? String(text).trim() : "";

  if (!messageText || !botToken || !targetChatId) {
    throw new Error('Telegram bot token or chat id is not configured.');
  }

  const response = UrlFetchApp.fetch("https://api.telegram.org/bot" + botToken + "/sendMessage", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ chat_id: targetChatId, text: messageText, disable_web_page_preview: true }),
    muteHttpExceptions: true
  });
  const statusCode = response.getResponseCode();
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('Telegram push failed (' + statusCode + '): ' + response.getContentText());
  }
}

function logNotificationResult(result) {
  try {
    createFirestoreDocument(NOTIFICATION_LOGS_COLLECTION, {
      eventKey: result.eventKey || '',
      eventLabel: result.eventLabel || '',
      channel: result.channel || '',
      recipientName: result.recipientName || '',
      recipientId: result.recipientId || '',
      target: maskNotificationTarget(result.target || ''),
      status: result.status || '',
      error: result.error || '',
      createdAt: new Date()
    });
    pruneNotificationLogsIfNeeded();
  } catch (err) {
    Logger.log('Unable to write notification log: ' + err.toString());
  }
}

function pruneNotificationLogsIfNeeded() {
  const props = PropertiesService.getScriptProperties();
  const now = new Date();
  const lastPrunedAt = Number(props.getProperty('NOTIFICATION_LOGS_LAST_PRUNED_AT') || 0);
  if (lastPrunedAt && now.getTime() - lastPrunedAt < NOTIFICATION_LOG_PRUNE_INTERVAL_HOURS * 60 * 60 * 1000) {
    return;
  }

  const cutoffDate = new Date(now.getTime() - NOTIFICATION_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const oldLogs = runFirestoreQuery({
    from: [{ collectionId: NOTIFICATION_LOGS_COLLECTION }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'createdAt' },
        op: 'LESS_THAN',
        value: { timestampValue: cutoffDate.toISOString() }
      }
    },
    orderBy: [
      { field: { fieldPath: 'createdAt' }, direction: 'ASCENDING' }
    ],
    limit: 100
  });

  oldLogs
    .filter(function(item) { return item.document && item.document.name; })
    .forEach(function(item) {
      deleteFirestoreDocumentByName(item.document.name);
    });

  props.setProperty('NOTIFICATION_LOGS_LAST_PRUNED_AT', String(now.getTime()));
}

function getDefaultNotificationSettings() {
  const notifyEmail = typeof NOTIFY_EMAIL !== "undefined" ? NOTIFY_EMAIL : '';
  const lineUserId = typeof LINE_ADMIN_USER_ID !== "undefined" ? LINE_ADMIN_USER_ID : '';
  const telegramChatId = typeof TELEGRAM_CHAT_ID !== "undefined" ? TELEGRAM_CHAT_ID : '';
  const ownerRecipient = {
    id: 'owner',
    name: '主要管理者',
    enabled: true,
    email: notifyEmail || '',
    lineUserId: Array.isArray(lineUserId) ? String(lineUserId[0] || '') : String(lineUserId || ''),
    telegramChatId: String(telegramChatId || '')
  };

  return normalizeNotificationSettings({
    recipients: [ownerRecipient],
    rules: {
      newOrder: {
        enabled: true,
        channels: { email: true, line: true, telegram: true },
        recipientIds: ['owner'],
        recipientChannels: { owner: { email: true, line: true, telegram: true } }
      },
      dailyShippingReminder: {
        enabled: true,
        channels: { email: false, line: false, telegram: true },
        recipientIds: ['owner'],
        recipientChannels: { owner: { email: false, line: false, telegram: true } }
      },
      orderUpdated: {
        enabled: false,
        channels: { email: false, line: false, telegram: true },
        recipientIds: ['owner'],
        recipientChannels: { owner: { email: false, line: false, telegram: true } }
      },
      orderDeleted: {
        enabled: false,
        channels: { email: false, line: false, telegram: true },
        recipientIds: ['owner'],
        recipientChannels: { owner: { email: false, line: false, telegram: true } }
      },
      resendPdf: {
        enabled: false,
        channels: { email: false, line: false, telegram: true },
        recipientIds: ['owner'],
        recipientChannels: { owner: { email: false, line: false, telegram: true } }
      },
      sheetSyncFailed: {
        enabled: true,
        channels: { email: true, line: false, telegram: true },
        recipientIds: ['owner'],
        recipientChannels: { owner: { email: true, line: false, telegram: true } }
      },
      notificationFailed: {
        enabled: false,
        channels: { email: false, line: false, telegram: true },
        recipientIds: ['owner'],
        recipientChannels: { owner: { email: false, line: false, telegram: true } }
      }
    },
    updatedAt: ''
  });
}

function normalizeNotificationSettings(settings) {
  const defaultSettings = getDefaultNotificationSettingsBase();
  const sourceSettings = settings || {};
  const sourceRecipients = Array.isArray(sourceSettings.recipients) ? sourceSettings.recipients : [];
  const recipients = sourceRecipients.length ? sourceRecipients : defaultSettings.recipients;
  const normalizedRecipients = recipients.map(function(recipient, index) {
    return {
      id: String(recipient.id || ('recipient_' + (index + 1))).trim(),
      name: String(recipient.name || '').trim(),
      enabled: recipient.enabled !== false,
      email: String(recipient.email || '').trim(),
      lineUserId: String(recipient.lineUserId || '').trim(),
      telegramChatId: String(recipient.telegramChatId || '').trim()
    };
  });

  const sourceRules = sourceSettings.rules || {};
  const normalizedRules = {};
  NOTIFICATION_EVENT_DEFINITIONS
    .filter(function(eventDefinition) { return eventDefinition.key !== 'testNotification'; })
    .forEach(function(eventDefinition) {
      const defaultRule = defaultSettings.rules[eventDefinition.key] || {};
      const sourceRule = sourceRules[eventDefinition.key] || {};
      const recipientChannels = normalizeRuleRecipientChannels(sourceRule, defaultRule);
      normalizedRules[eventDefinition.key] = {
        enabled: typeof sourceRule.enabled === 'undefined' ? defaultRule.enabled !== false : sourceRule.enabled !== false,
        channels: getAggregateRuleChannels(recipientChannels),
        recipientIds: Object.keys(recipientChannels),
        recipientChannels: recipientChannels
      };
    });

  return {
    events: NOTIFICATION_EVENT_DEFINITIONS,
    recipients: normalizedRecipients,
    rules: normalizedRules,
    updatedAt: sourceSettings.updatedAt || ''
  };
}

function mergeNotificationSettingsForSave(currentSettings, incomingSettings) {
  const currentRecipients = currentSettings.recipients || [];
  const incomingRecipients = Array.isArray(incomingSettings.recipients) ? incomingSettings.recipients : [];
  const currentRecipientMap = {};
  currentRecipients.forEach(function(recipient) {
    currentRecipientMap[recipient.id] = recipient;
  });

  const mergedRecipients = incomingRecipients.map(function(incomingRecipient) {
    const recipientId = String(incomingRecipient.id || '').trim();
    const existingRecipient = currentRecipientMap[recipientId] || {};
    return {
      id: recipientId || ('recipient_' + new Date().getTime()),
      name: String(incomingRecipient.name || existingRecipient.name || '').trim(),
      enabled: incomingRecipient.enabled !== false,
      email: mergeSensitiveContactValue(existingRecipient.email, incomingRecipient.email, incomingRecipient.clearEmail),
      lineUserId: mergeSensitiveContactValue(existingRecipient.lineUserId, incomingRecipient.lineUserId, incomingRecipient.clearLineUserId),
      telegramChatId: mergeSensitiveContactValue(existingRecipient.telegramChatId, incomingRecipient.telegramChatId, incomingRecipient.clearTelegramChatId)
    };
  });

  return {
    recipients: mergedRecipients,
    rules: incomingSettings.rules || currentSettings.rules || {},
    updatedAt: currentSettings.updatedAt || ''
  };
}

function mergeSensitiveContactValue(existingValue, incomingValue, shouldClear) {
  if (shouldClear === true) return '';
  const cleanIncomingValue = String(incomingValue || '').trim();
  if (cleanIncomingValue) return cleanIncomingValue;
  return String(existingValue || '').trim();
}

function maskNotificationSettingsForAdmin(settings) {
  const normalizedSettings = normalizeNotificationSettings(settings);
  return {
    events: normalizedSettings.events,
    rules: normalizedSettings.rules,
    updatedAt: normalizedSettings.updatedAt || '',
    recipients: (normalizedSettings.recipients || []).map(function(recipient) {
      const email = String(recipient.email || '').trim();
      const lineUserId = String(recipient.lineUserId || '').trim();
      const telegramChatId = String(recipient.telegramChatId || '').trim();
      return {
        id: recipient.id,
        name: recipient.name,
        enabled: recipient.enabled !== false,
        email: '',
        lineUserId: '',
        telegramChatId: '',
        emailMasked: maskNotificationTarget(email),
        lineUserIdMasked: maskNotificationTarget(lineUserId),
        telegramChatIdMasked: maskNotificationTarget(telegramChatId),
        hasEmail: Boolean(email),
        hasLineUserId: Boolean(lineUserId),
        hasTelegramChatId: Boolean(telegramChatId),
        clearEmail: false,
        clearLineUserId: false,
        clearTelegramChatId: false
      };
    })
  };
}

function getDefaultNotificationSettingsBase() {
  const notifyEmail = typeof NOTIFY_EMAIL !== "undefined" ? NOTIFY_EMAIL : '';
  const lineUserId = typeof LINE_ADMIN_USER_ID !== "undefined" ? LINE_ADMIN_USER_ID : '';
  const telegramChatId = typeof TELEGRAM_CHAT_ID !== "undefined" ? TELEGRAM_CHAT_ID : '';
  return {
    recipients: [{
      id: 'owner',
      name: '主要管理者',
      enabled: true,
      email: notifyEmail || '',
      lineUserId: Array.isArray(lineUserId) ? String(lineUserId[0] || '') : String(lineUserId || ''),
      telegramChatId: String(telegramChatId || '')
    }],
    rules: {
      newOrder: { enabled: true, channels: { email: true, line: true, telegram: true }, recipientIds: ['owner'], recipientChannels: { owner: { email: true, line: true, telegram: true } } },
      dailyShippingReminder: { enabled: true, channels: { email: false, line: false, telegram: true }, recipientIds: ['owner'], recipientChannels: { owner: { email: false, line: false, telegram: true } } },
      orderUpdated: { enabled: false, channels: { email: false, line: false, telegram: true }, recipientIds: ['owner'], recipientChannels: { owner: { email: false, line: false, telegram: true } } },
      orderDeleted: { enabled: false, channels: { email: false, line: false, telegram: true }, recipientIds: ['owner'], recipientChannels: { owner: { email: false, line: false, telegram: true } } },
      resendPdf: { enabled: false, channels: { email: false, line: false, telegram: true }, recipientIds: ['owner'], recipientChannels: { owner: { email: false, line: false, telegram: true } } },
      sheetSyncFailed: { enabled: true, channels: { email: true, line: false, telegram: true }, recipientIds: ['owner'], recipientChannels: { owner: { email: true, line: false, telegram: true } } },
      notificationFailed: { enabled: false, channels: { email: false, line: false, telegram: true }, recipientIds: ['owner'], recipientChannels: { owner: { email: false, line: false, telegram: true } } }
    }
  };
}

function normalizeRuleRecipientChannels(sourceRule, defaultRule) {
  const sourceRecipientChannels = sourceRule.recipientChannels || {};
  const normalized = {};

  Object.keys(sourceRecipientChannels).forEach(function(recipientId) {
    const cleanRecipientId = String(recipientId || '').trim();
    if (!cleanRecipientId) return;
    normalized[cleanRecipientId] = normalizeChannelMap(sourceRecipientChannels[recipientId]);
  });

  if (Object.keys(normalized).length) {
    return normalized;
  }

  const recipientIds = Array.isArray(sourceRule.recipientIds) && sourceRule.recipientIds.length
    ? sourceRule.recipientIds
    : (defaultRule.recipientIds || ['owner']);
  const channels = sourceRule.channels || defaultRule.channels || {};
  recipientIds.forEach(function(recipientId) {
    const cleanRecipientId = String(recipientId || '').trim();
    if (cleanRecipientId) normalized[cleanRecipientId] = normalizeChannelMap(channels);
  });

  return normalized;
}

function normalizeChannelMap(channels) {
  const sourceChannels = channels || {};
  return {
    email: sourceChannels.email === true,
    line: sourceChannels.line === true,
    telegram: sourceChannels.telegram === true
  };
}

function getAggregateRuleChannels(recipientChannels) {
  const aggregate = { email: false, line: false, telegram: false };
  Object.keys(recipientChannels || {}).forEach(function(recipientId) {
    const channels = recipientChannels[recipientId] || {};
    aggregate.email = aggregate.email || channels.email === true;
    aggregate.line = aggregate.line || channels.line === true;
    aggregate.telegram = aggregate.telegram || channels.telegram === true;
  });
  return aggregate;
}

function getRuleDeliveries(settings, rule) {
  const recipientChannels = rule.recipientChannels || {};
  const recipientMap = {};
  (settings.recipients || []).forEach(function(recipient) {
    recipientMap[recipient.id] = recipient;
  });

  const deliveries = [];
  Object.keys(recipientChannels).forEach(function(recipientId) {
    const recipient = recipientMap[recipientId];
    const channels = recipientChannels[recipientId] || {};
    if (!recipient || recipient.enabled === false) return;
    ['email', 'line', 'telegram'].forEach(function(channel) {
      if (channels[channel] === true) {
        deliveries.push({ recipient: recipient, channel: channel });
      }
    });
  });
  return deliveries;
}

function getRecipientTarget(recipient, channel) {
  if (channel === 'email') return String(recipient.email || '').trim();
  if (channel === 'line') return String(recipient.lineUserId || '').trim();
  if (channel === 'telegram') return String(recipient.telegramChatId || '').trim();
  return '';
}

function splitNotificationTargets(target) {
  return String(target || '')
    .split(/[,\n]/)
    .map(function(item) { return item.trim(); })
    .filter(function(item) { return item; });
}

function getNotificationEventDefinition(eventKey) {
  return NOTIFICATION_EVENT_DEFINITIONS.filter(function(eventDefinition) {
    return eventDefinition.key === eventKey;
  })[0] || { key: eventKey, label: eventKey };
}

function maskNotificationTarget(target) {
  const value = String(target || '');
  if (!value) return '';
  if (value.indexOf('@') !== -1) {
    const parts = value.split('@');
    return parts[0].slice(0, 2) + '***@' + parts[1];
  }
  if (value.length <= 8) return '***';
  return value.slice(0, 4) + '***' + value.slice(-4);
}
