function requireFirebaseAdmin(data) {
  const authResult = verifyFirebaseAdminIdToken(data && data.idToken);
  if (!authResult.isAdmin) {
    throw new Error(authResult.message || '未授權：需要 Firebase admin 權限。');
  }
  return authResult;
}

function verifyFirebaseAdminIdToken(idToken) {
  const token = String(idToken || '').trim();
  if (!token) {
    return { isAdmin: false, message: '缺少 Firebase ID token。' };
  }

  const apiKey = getScriptConfigValue(
    'FIREBASE_WEB_API_KEY',
    typeof FIREBASE_WEB_API_KEY !== 'undefined' ? FIREBASE_WEB_API_KEY : ''
  );

  if (!apiKey) {
    return { isAdmin: false, message: 'GAS 尚未設定 FIREBASE_WEB_API_KEY。' };
  }

  try {
    const response = UrlFetchApp.fetch(
      'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(apiKey),
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({ idToken: token }),
        muteHttpExceptions: true
      }
    );

    if (response.getResponseCode() !== 200) {
      Logger.log('Firebase token lookup failed: ' + response.getContentText());
      return { isAdmin: false, message: 'Firebase ID token 驗證失敗。' };
    }

    const result = JSON.parse(response.getContentText());
    const user = result.users && result.users[0];
    if (!user || user.disabled === true) {
      return { isAdmin: false, message: 'Firebase 使用者不存在或已停用。' };
    }

    const customAttributes = user.customAttributes ? JSON.parse(user.customAttributes) : {};
    return {
      isAdmin: customAttributes.admin === true,
      uid: user.localId,
      email: user.email || '',
      role: String(customAttributes.role || 'admin').toLowerCase(),
      message: customAttributes.admin === true ? '' : 'Firebase 使用者沒有 admin custom claim。'
    };
  } catch (err) {
    Logger.log('Firebase token verification error: ' + err.toString());
    return { isAdmin: false, message: 'Firebase ID token 驗證發生錯誤。' };
  }
}

function getScriptConfigValue(keyName, fallbackValue) {
  try {
    return PropertiesService.getScriptProperties().getProperty(keyName) || fallbackValue || '';
  } catch (e) {
    return fallbackValue || '';
  }
}
