/**
 * ==========================================
 * 李伯伯糖葫蘆 - 微服務 API (Api.gs)
 * ==========================================
 * 此檔只保留 Web App 入口與 action routing。
 * 各 action 的實作請見：
 * - OrderActions.gs
 * - AuthService.gs
 * - SettingsService.gs
 * - DrivePdfService.gs
 * - OrderReportService.gs
 * - NotificationService.gs
 */

const ADMIN_ACTIONS = [
  'get_settings',
  'admin_resend_pdf',
  'update_pdf',
  'mark_order_deleted',
  'save_settings'
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (ADMIN_ACTIONS.indexOf(data.action) !== -1) {
      requireFirebaseAdmin(data);
    }

    switch (data.action) {
      case 'get_settings':
        return jsonResponse({ status: 'success', data: getAdminSettings() });

      case 'save_settings':
        return handleSaveSettings(data);

      case 'admin_resend_pdf':
      case 'resendPdf':
        return handleResendPdf(data);

      case 'update_pdf':
        return handleUpdatePdf(data);

      case 'mark_order_deleted':
        return handleMarkOrderDeleted(data);

      case 'create_order':
        return handleCreateOrder(data);

      default:
        return jsonResponse({ status: 'error', message: `未知的操作指令: ${data.action}` });
    }
  } catch (error) {
    Logger.log(error && error.stack ? error.stack : error.toString());
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

function doGet(e) {
  if (e.parameter && e.parameter.action === 'verify_admin') {
    return jsonResponse({ status: 'success', isAdmin: ADMIN_LINE_IDS.includes(e.parameter.userId) });
  }
  if (e.parameter && e.parameter.action === 'get_settings') {
    return jsonResponse({ status: 'error', message: 'get_settings now requires Firebase admin authentication via POST.' });
  }
  return ContentService.createTextOutput("微服務 API 正常運作中！");
}

function handleSaveSettings(data) {
  try {
    const settings = saveAdminSettings(data);
    return jsonResponse({ status: 'success', data: settings });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
