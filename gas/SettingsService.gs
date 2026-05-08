function getAdminSettings() {
  const props = PropertiesService.getScriptProperties();
  const lowercaseEnabled = props.getProperty('reminderEnabled');
  const uppercaseEnabled = props.getProperty('REMINDER_ENABLED');
  const lowercaseTime = props.getProperty('reminderTime');
  const uppercaseTime = props.getProperty('REMINDER_TIME');

  return {
    reminderEnabled: (lowercaseEnabled !== null ? lowercaseEnabled : uppercaseEnabled) !== 'false',
    reminderTime: lowercaseTime || uppercaseTime || '11:00'
  };
}

function saveAdminSettings(data) {
  const reminderEnabled = data.reminderEnabled === true || String(data.reminderEnabled).toLowerCase() === 'true';
  const reminderTime = String(data.reminderTime || '11:00').trim();

  if (!/^\d{2}:\d{2}$/.test(reminderTime)) {
    throw new Error('提醒時間格式錯誤，需為 HH:mm');
  }

  const props = PropertiesService.getScriptProperties();
  props.setProperty('reminderEnabled', reminderEnabled ? 'true' : 'false');
  props.setProperty('reminderTime', reminderTime);
  props.setProperty('REMINDER_ENABLED', reminderEnabled ? 'true' : 'false');
  props.setProperty('REMINDER_TIME', reminderTime);

  if (typeof manageReminderTrigger === 'function') {
    manageReminderTrigger(reminderEnabled, reminderTime);
  }

  return {
    reminderEnabled: reminderEnabled,
    reminderTime: reminderTime
  };
}
