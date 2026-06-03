import React from 'react';

const CHANNELS = [
  { key: 'email', label: 'Email', valueKey: 'email', maskedKey: 'emailMasked', hasKey: 'hasEmail', clearKey: 'clearEmail' },
  { key: 'line', label: 'LINE', valueKey: 'lineUserId', maskedKey: 'lineUserIdMasked', hasKey: 'hasLineUserId', clearKey: 'clearLineUserId' },
  { key: 'telegram', label: 'Telegram', valueKey: 'telegramChatId', maskedKey: 'telegramChatIdMasked', hasKey: 'hasTelegramChatId', clearKey: 'clearTelegramChatId' }
];

const EVENT_HELP_TEXT = {
  newOrder: '顧客送出新訂單後發送。',
  dailyShippingReminder: '每日指定時間發送明日出貨總覽。',
  orderUpdated: '管理員修改訂單並重產 PDF 後發送。',
  orderDeleted: '管理員刪除訂單後發送。',
  resendPdf: '補寄訂單 PDF 後發送。',
  sheetSyncFailed: 'Google Sheets 訂單報表同步失敗時發送。',
  notificationFailed: '保留給通知失敗警示。'
};

const getChannelMeta = (channelKey) => CHANNELS.find(channel => channel.key === channelKey);

const canTestChannel = (recipient, channelKey) => {
  const channel = getChannelMeta(channelKey);
  if (!channel) return false;
  return Boolean(recipient[channel.hasKey]) && recipient[channel.clearKey] !== true;
};

export default function NotificationSettings({
  settings,
  setSettings,
  logs,
  isSaving,
  isTesting,
  isLoadingLogs,
  onSave,
  onTest,
  onRefreshLogs
}) {
  if (!settings) {
    return null;
  }

  const recipients = settings.recipients || [];
  const rules = settings.rules || {};
  const events = (settings.events || []).filter(event => event.key !== 'testNotification');
  const canManageAllRecipients = settings.canManageAllRecipients === true;

  const updateRecipient = (recipientId, updates) => {
    setSettings({
      ...settings,
      recipients: recipients.map(recipient =>
        recipient.id === recipientId ? { ...recipient, ...updates } : recipient
      )
    });
  };

  const addRecipient = () => {
    const id = `recipient_${Date.now()}`;
    setSettings({
      ...settings,
      recipients: [
        ...recipients,
        {
          id,
          name: '共同管理者',
          enabled: true,
          email: '',
          lineUserId: '',
          telegramChatId: '',
          authEmail: '',
          emailMasked: '',
          lineUserIdMasked: '',
          telegramChatIdMasked: '',
          hasEmail: false,
          hasLineUserId: false,
          hasTelegramChatId: false,
          clearEmail: false,
          clearLineUserId: false,
          clearTelegramChatId: false
        }
      ]
    });
  };

  const removeRecipient = (recipientId) => {
    setSettings({
      ...settings,
      recipients: recipients.filter(recipient => recipient.id !== recipientId),
      rules: Object.fromEntries(Object.entries(rules).map(([eventKey, rule]) => [
        eventKey,
        removeRuleRecipient(rule, recipientId)
      ]))
    });
  };

  const updateRule = (eventKey, updates) => {
    setSettings({
      ...settings,
      rules: {
        ...rules,
        [eventKey]: {
          ...(rules[eventKey] || {}),
          ...updates
        }
      }
    });
  };

  const updateRecipientChannel = (eventKey, recipientId, channel, enabled) => {
    const rule = rules[eventKey] || {};
    const currentRecipientChannels = rule.recipientChannels || {};
    const nextRecipientChannels = {
      ...currentRecipientChannels,
      [recipientId]: {
        ...(currentRecipientChannels[recipientId] || {}),
        [channel]: enabled
      }
    };

    if (!hasAnyEnabledChannel(nextRecipientChannels[recipientId])) {
      delete nextRecipientChannels[recipientId];
    }

    updateRule(eventKey, {
      recipientChannels: nextRecipientChannels
    });
  };

  const getRuleRecipientChannels = (rule, recipientId) => {
    const recipientChannels = rule.recipientChannels || {};
    return recipientChannels[recipientId] || {};
  };

  const renderContactInput = (recipient, channel) => {
    const hasValue = Boolean(recipient[channel.hasKey]);
    const isClearing = recipient[channel.clearKey] === true;
    const newValue = recipient[channel.valueKey] || '';
    const maskedValue = recipient[channel.maskedKey] || '';

    return (
      <label className="block">
        <span className="block text-sm font-bold text-gray-500 mb-1">{channel.label}</span>
        <input
          value={newValue}
          disabled={isClearing}
          placeholder={hasValue ? '留空保留既有設定；輸入新值才覆蓋' : '尚未設定，請輸入新值'}
          onChange={e => updateRecipient(recipient.id, { [channel.valueKey]: e.target.value })}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amberRed disabled:opacity-50"
        />
        <div className="flex flex-col gap-1 mt-2">
          <p className="text-xs text-gray-500">
            {hasValue ? `已設定：${maskedValue}` : '尚未設定'}
          </p>
          {hasValue && (
            <label className="inline-flex items-center gap-2 text-xs font-bold text-red-600">
              <input
                type="checkbox"
                checked={isClearing}
                onChange={e => updateRecipient(recipient.id, {
                  [channel.clearKey]: e.target.checked,
                  [channel.valueKey]: e.target.checked ? '' : newValue
                })}
                className="accent-red-600"
              />
              清除此通道設定
            </label>
          )}
        </div>
      </label>
    );
  };

  return (
    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">通知規則設定</h3>
          <p className="text-gray-500 mt-1">後台只顯示遮罩聯絡資料；完整 Email、LINE userId、Telegram chatId 僅由 GAS 端保留。</p>
        </div>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-8 py-3 bg-darkWood text-white font-bold rounded-2xl hover:bg-black transition-colors disabled:opacity-50"
        >
          {isSaving ? '儲存中...' : '儲存通知設定'}
        </button>
      </div>

      <div className="space-y-10">
        <div>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h4 className="text-xl font-bold text-gray-800">共同管理者</h4>
            <button
              type="button"
              onClick={addRecipient}
              disabled={!canManageAllRecipients}
              className="px-5 py-2 bg-gray-800 text-white font-bold rounded-xl hover:bg-black transition-colors"
            >
              新增管理者
            </button>
          </div>

          <div className="space-y-4">
            {recipients.map(recipient => (
              <div key={recipient.id} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/70">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="block text-sm font-bold text-gray-500 mb-1">名稱</span>
                      <input
                        value={recipient.name || ''}
                        disabled={!canManageAllRecipients}
                        onChange={e => updateRecipient(recipient.id, { name: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amberRed disabled:opacity-60"
                      />
                    </label>
                    {canManageAllRecipients && (
                      <label className="block">
                        <span className="block text-sm font-bold text-gray-500 mb-1">後台登入 Email</span>
                        <input
                          value={recipient.authEmail || ''}
                          onChange={e => updateRecipient(recipient.id, { authEmail: e.target.value })}
                          placeholder="用來限制一般 admin 只能看到自己的設定"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amberRed"
                        />
                      </label>
                    )}
                    {CHANNELS.map(channel => (
                      <React.Fragment key={channel.key}>
                        {renderContactInput(recipient, channel)}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="flex md:flex-col gap-3 md:items-end justify-between">
                    <label className="inline-flex items-center gap-2 font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={recipient.enabled !== false}
                        disabled={!canManageAllRecipients}
                        onChange={e => updateRecipient(recipient.id, { enabled: e.target.checked })}
                        className="w-5 h-5 accent-amberRed disabled:opacity-60"
                      />
                      啟用
                    </label>
                    <button
                      type="button"
                      onClick={() => removeRecipient(recipient.id)}
                      disabled={!canManageAllRecipients || recipients.length <= 1}
                      className="px-4 py-2 text-red-600 bg-red-50 border border-red-100 font-bold rounded-xl disabled:opacity-40"
                    >
                      移除
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                  {CHANNELS.map(channel => (
                    <button
                      key={channel.key}
                      type="button"
                      onClick={() => onTest({ recipientId: recipient.id, channel: channel.key })}
                      disabled={isTesting || !canTestChannel(recipient, channel.key)}
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:border-amberRed disabled:opacity-40"
                    >
                      測試 {channel.label}
                    </button>
                  ))}
                  <p className="basis-full text-xs text-gray-400">新輸入的聯絡值需先儲存，才能發送測試通知。</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xl font-bold text-gray-800 mb-4">事件收件人通道</h4>
          <div className="overflow-x-auto border border-gray-100 rounded-2xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3 font-bold">事件</th>
                  <th className="text-center px-4 py-3 font-bold">啟用</th>
                  <th className="text-left px-4 py-3 font-bold">每位管理者通知通道</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map(event => {
                  const rule = rules[event.key] || {};
                  return (
                    <tr key={event.key} className="align-top">
                      <td className="px-4 py-4 min-w-[220px]">
                        <p className="font-bold text-gray-800">{event.label}</p>
                        <p className="text-xs text-gray-400 mt-1">{EVENT_HELP_TEXT[event.key] || ''}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={rule.enabled !== false}
                          onChange={e => updateRule(event.key, { enabled: e.target.checked })}
                          className="w-5 h-5 accent-amberRed"
                        />
                      </td>
                      <td className="px-4 py-4 min-w-[560px]">
                        <div className="space-y-3">
                          {recipients.map(recipient => {
                            const recipientChannels = getRuleRecipientChannels(rule, recipient.id);
                            return (
                              <div key={recipient.id} className="flex flex-col lg:flex-row lg:items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                                <div className="min-w-[160px] font-bold text-gray-700">
                                  {recipient.name || recipient.id}
                                  {recipient.enabled === false && (
                                    <span className="ml-2 text-xs text-gray-400">已停用</span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {CHANNELS.map(channel => (
                                    <label key={channel.key} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-700">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(recipientChannels[channel.key])}
                                        onChange={e => updateRecipientChannel(event.key, recipient.id, channel.key, e.target.checked)}
                                        className="accent-amberRed"
                                      />
                                      {channel.label}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h4 className="text-xl font-bold text-gray-800">通知紀錄</h4>
              <p className="text-sm text-gray-400 mt-1">後台只顯示最近 30 筆；紀錄區固定高度，可在表格內捲動。</p>
            </div>
            <button
              type="button"
              onClick={onRefreshLogs}
              disabled={isLoadingLogs}
              className="px-5 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 disabled:opacity-50"
            >
              {isLoadingLogs ? '更新中...' : '重新整理'}
            </button>
          </div>

          <div className="overflow-auto max-h-[520px] border border-gray-100 rounded-2xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10">
                <tr>
                  <th className="text-left px-4 py-3 font-bold">時間</th>
                  <th className="text-left px-4 py-3 font-bold">事件</th>
                  <th className="text-left px-4 py-3 font-bold">通道</th>
                  <th className="text-left px-4 py-3 font-bold">收件人</th>
                  <th className="text-left px-4 py-3 font-bold">狀態</th>
                  <th className="text-left px-4 py-3 font-bold">錯誤</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(logs || []).map(log => (
                  <tr key={log.id || `${log.createdAt}-${log.channel}-${log.recipientId}`}>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{String(log.createdAt || '').replace('T', ' ').slice(0, 19)}</td>
                    <td className="px-4 py-3 font-bold text-gray-800">{log.eventLabel || log.eventKey}</td>
                    <td className="px-4 py-3 uppercase text-gray-600">{log.channel}</td>
                    <td className="px-4 py-3 text-gray-600">{log.recipientName || log.target}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full font-bold ${log.status === 'success' ? 'bg-green-50 text-green-700' : log.status === 'failure' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-red-600 max-w-[360px] truncate">{log.error || ''}</td>
                  </tr>
                ))}
                {(!logs || logs.length === 0) && (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-400 font-bold" colSpan="6">尚無通知紀錄</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

const hasAnyEnabledChannel = (channels = {}) => CHANNELS.some(channel => channels[channel.key] === true);

const removeRuleRecipient = (rule = {}, recipientId) => {
  const nextRecipientChannels = { ...(rule.recipientChannels || {}) };
  delete nextRecipientChannels[recipientId];
  return {
    ...rule,
    recipientChannels: nextRecipientChannels
  };
};
