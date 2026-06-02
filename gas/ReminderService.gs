const REMINDER_TRIGGER_HANDLER = 'sendDailyShippingReminder';
const REMINDER_TIMEZONE = 'Asia/Taipei';

function manageReminderTrigger(enabled, reminderTime) {
  removeReminderTriggers();

  if (!enabled) return;

  const parsedTime = parseReminderTime(reminderTime);
  ScriptApp.newTrigger(REMINDER_TRIGGER_HANDLER)
    .timeBased()
    .everyDays(1)
    .atHour(parsedTime.hour)
    .nearMinute(parsedTime.minute)
    .inTimezone(REMINDER_TIMEZONE)
    .create();
}

function removeReminderTriggers() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction && trigger.getHandlerFunction() === REMINDER_TRIGGER_HANDLER) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function sendDailyShippingReminder() {
  const settings = getAdminSettings();
  if (settings.reminderEnabled === false) return;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const targetDate = Utilities.formatDate(tomorrow, REMINDER_TIMEZONE, 'yyyy-MM-dd');
  const displayDate = Utilities.formatDate(tomorrow, REMINDER_TIMEZONE, 'yyyy/MM/dd');
  const orders = fetchOrdersByEventDate(targetDate);
  const message = buildShippingReminderMessage(displayDate, orders);

  sendTelegramMessage(message);
}

function fetchOrdersByEventDate(eventDate) {
  const projectId = getFirebaseProjectId();
  const url = 'https://firestore.googleapis.com/v1/projects/' +
    encodeURIComponent(projectId) +
    '/databases/(default)/documents:runQuery';

  const payload = {
    structuredQuery: {
      from: [{ collectionId: 'orders' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'eventDate' },
          op: 'EQUAL',
          value: { stringValue: eventDate }
        }
      }
    }
  };

  const result = callFirestoreApi(url, 'post', payload);
  return result
    .filter(function(item) { return item.document && item.document.fields; })
    .map(function(item) { return firestoreFieldsToObject(item.document.fields); })
    .sort(function(a, b) {
      return String(a.eventTime || '').localeCompare(String(b.eventTime || ''));
    });
}

function buildShippingReminderMessage(displayDate, orders) {
  if (!orders.length) {
    return 'Daily shipping reminder - ' + displayDate + '\nNo orders scheduled for tomorrow.';
  }

  const totals = buildShippingReminderTotals(orders);
  const lines = [
    'Daily shipping reminder - ' + displayDate,
    'Orders: ' + orders.length,
    'Candy total: ' + totals.candyQty,
    'Broom rental: ' + totals.broomQty,
    ''
  ];

  orders.forEach(function(order, index) {
    lines.push(
      String(index + 1) + '. ' +
      String(order.eventTime || 'No time') + ' | ' +
      String(order.orderNumber || 'No order number') + ' | ' +
      String(order.ordererName || 'No customer name')
    );
    lines.push('   Location: ' + String(order.deliveryCity || '') + ' ' + String(order.locationName || '').trim());
    lines.push('   Items: ' + String(order.itemsList || 'No item details').replace(/\n/g, '; '));
    lines.push('   Total: ' + String(order.totalAmount || 0));
    if (order.pdfDownloadUrl) {
      lines.push('   PDF: ' + order.pdfDownloadUrl);
    }
  });

  return lines.join('\n');
}

function buildShippingReminderTotals(orders) {
  return orders.reduce(function(acc, order) {
    const cart = order.cart || {};
    Object.keys(cart).forEach(function(productId) {
      const quantity = Number(cart[productId]) || 0;
      if (String(productId) === '5') {
        acc.broomQty += quantity;
      } else {
        acc.candyQty += quantity;
      }
    });
    return acc;
  }, { candyQty: 0, broomQty: 0 });
}

function firestoreFieldsToObject(fields) {
  const obj = {};
  Object.keys(fields || {}).forEach(function(key) {
    obj[key] = firestoreValueToPlainValue(fields[key]);
  });
  return obj;
}

function firestoreValueToPlainValue(value) {
  if (!value) return '';
  if (Object.prototype.hasOwnProperty.call(value, 'stringValue')) return value.stringValue;
  if (Object.prototype.hasOwnProperty.call(value, 'integerValue')) return Number(value.integerValue);
  if (Object.prototype.hasOwnProperty.call(value, 'doubleValue')) return Number(value.doubleValue);
  if (Object.prototype.hasOwnProperty.call(value, 'booleanValue')) return value.booleanValue;
  if (Object.prototype.hasOwnProperty.call(value, 'timestampValue')) return value.timestampValue;
  if (Object.prototype.hasOwnProperty.call(value, 'nullValue')) return null;
  if (value.arrayValue) {
    return (value.arrayValue.values || []).map(function(item) {
      return firestoreValueToPlainValue(item);
    });
  }
  if (value.mapValue) {
    return firestoreFieldsToObject(value.mapValue.fields || {});
  }
  return '';
}

function parseReminderTime(reminderTime) {
  const normalizedTime = String(reminderTime || '11:00').trim();
  const match = normalizedTime.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error('Reminder time must use HH:mm format.');
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2])
  };
}
