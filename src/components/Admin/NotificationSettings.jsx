import React from 'react';

const CHANNELS = [
  { key: 'email', label: 'Email' },
  { key: 'line', label: 'LINE' },
  { key: 'telegram', label: 'Telegram' }
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

const getTargetValue = (recipient, channel) => {
  if (channel === 'email') return recipient.email || '';
  if (channel === 'line') return recipient.lineUserId || '';
  if (channel === 'telegram') return recipient.telegramChatId || '';
  return '';
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
          telegramChatId: ''
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
        {
          ...rule,
          recipientIds: (rule.recipientIds || []).filter(id => id !== recipientId)
        }
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

  const updateRuleChannel = (eventKey, channel, enabled) => {
    const rule = rules[eventKey] || {};
    updateRule(eventKey, {
      channels: {
        ...(rule.channels || {}),
        [channel]: enabled
      }
    });
  };

  const toggleRuleRecipient = (eventKey, recipientId, enabled) => {
    const rule = rules[eventKey] || {};
    const currentIds = rule.recipientIds || [];
    updateRule(eventKey, {
      recipientIds: enabled
        ? Array.from(new Set([...currentIds, recipientId]))
        : currentIds.filter(id => id !== recipientId)
    });
  };

  return (
    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">通知規則設定</h3>
          <p className="text-gray-500 mt-1">管理事件、通道、共同管理者與通知紀錄。</p>
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
                        onChange={e => updateRecipient(recipient.id, { name: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amberRed"
                      />
                    </label>
                    <label className="block">
                      <span className="block text-sm font-bold text-gray-500 mb-1">Email</span>
                      <input
                        type="email"
                        value={recipient.email || ''}
                        onChange={e => updateRecipient(recipient.id, { email: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amberRed"
                      />
                    </label>
                    <label className="block">
                      <span className="block text-sm font-bold text-gray-500 mb-1">LINE userId</span>
                      <input
                        value={recipient.lineUserId || ''}
                        onChange={e => updateRecipient(recipient.id, { lineUserId: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amberRed"
                      />
                    </label>
                    <label className="block">
                      <span className="block text-sm font-bold text-gray-500 mb-1">Telegram chatId</span>
                      <input
                        value={recipient.telegramChatId || ''}
                        onChange={e => updateRecipient(recipient.id, { telegramChatId: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amberRed"
                      />
                    </label>
                  </div>

                  <div className="flex md:flex-col gap-3 md:items-end justify-between">
                    <label className="inline-flex items-center gap-2 font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={recipient.enabled !== false}
                        onChange={e => updateRecipient(recipient.id, { enabled: e.target.checked })}
                        className="w-5 h-5 accent-amberRed"
                      />
                      啟用
                    </label>
                    <button
                      type="button"
                      onClick={() => removeRecipient(recipient.id)}
                      disabled={recipients.length <= 1}
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
                      disabled={isTesting || !getTargetValue(recipient, channel.key)}
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:border-amberRed disabled:opacity-40"
                    >
                      測試 {channel.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xl font-bold text-gray-800 mb-4">事件通道</h4>
          <div className="overflow-x-auto border border-gray-100 rounded-2xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3 font-bold">事件</th>
                  <th className="text-center px-4 py-3 font-bold">啟用</th>
                  {CHANNELS.map(channel => (
                    <th key={channel.key} className="text-center px-4 py-3 font-bold">{channel.label}</th>
                  ))}
                  <th className="text-left px-4 py-3 font-bold">收件人</th>
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
                      {CHANNELS.map(channel => (
                        <td key={channel.key} className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(rule.channels?.[channel.key])}
                            onChange={e => updateRuleChannel(event.key, channel.key, e.target.checked)}
                            className="w-5 h-5 accent-amberRed"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-4 min-w-[260px]">
                        <div className="flex flex-wrap gap-2">
                          {recipients.map(recipient => (
                            <label key={recipient.id} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700">
                              <input
                                type="checkbox"
                                checked={(rule.recipientIds || []).includes(recipient.id)}
                                onChange={e => toggleRuleRecipient(event.key, recipient.id, e.target.checked)}
                                className="accent-amberRed"
                              />
                              {recipient.name || recipient.id}
                            </label>
                          ))}
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
            <h4 className="text-xl font-bold text-gray-800">通知紀錄</h4>
            <button
              type="button"
              onClick={onRefreshLogs}
              disabled={isLoadingLogs}
              className="px-5 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 disabled:opacity-50"
            >
              {isLoadingLogs ? '更新中...' : '重新整理'}
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-2xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
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
