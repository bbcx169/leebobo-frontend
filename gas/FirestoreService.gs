function createFirestoreOrder(orderData) {
  const projectId = getFirebaseProjectId();
  const url = getFirestoreCollectionUrl(projectId, 'orders');
  const response = callFirestoreApi(url, 'post', {
    fields: toFirestoreFields(orderData)
  });

  const documentName = response.name || '';
  const firestoreDocumentId = documentName.split('/').pop();
  if (!firestoreDocumentId) {
    throw new Error('Firestore did not return a document id.');
  }

  return {
    id: firestoreDocumentId,
    name: documentName
  };
}

function updateFirestoreOrder(documentId, updates) {
  const projectId = getFirebaseProjectId();
  const cleanUpdates = removeUndefinedFields(updates);
  const updateMask = Object.keys(cleanUpdates)
    .map(function(fieldName) { return 'updateMask.fieldPaths=' + encodeURIComponent(fieldName); })
    .join('&');
  const url = getFirestoreDocumentUrl(projectId, 'orders', documentId) + (updateMask ? '?' + updateMask : '');

  return callFirestoreApi(url, 'patch', {
    fields: toFirestoreFields(cleanUpdates)
  });
}

function getFirebaseProjectId() {
  const projectId = getScriptConfigValue(
    'FIREBASE_PROJECT_ID',
    typeof FIREBASE_PROJECT_ID !== 'undefined' ? FIREBASE_PROJECT_ID : ''
  );
  if (!projectId) {
    throw new Error('GAS 尚未設定 FIREBASE_PROJECT_ID。');
  }
  return projectId;
}

function getFirestoreCollectionUrl(projectId, collectionName) {
  return 'https://firestore.googleapis.com/v1/projects/' +
    encodeURIComponent(projectId) +
    '/databases/(default)/documents/' +
    encodeURIComponent(collectionName);
}

function getFirestoreDocumentUrl(projectId, collectionName, documentId) {
  return getFirestoreCollectionUrl(projectId, collectionName) + '/' + encodeURIComponent(documentId);
}

function callFirestoreApi(url, method, payload) {
  const response = UrlFetchApp.fetch(url, {
    method: method,
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const responseText = response.getContentText();
  let result = {};
  if (responseText) {
    try {
      result = JSON.parse(responseText);
    } catch (err) {
      throw new Error('Firestore returned invalid JSON: ' + responseText);
    }
  }

  const statusCode = response.getResponseCode();
  if (statusCode < 200 || statusCode >= 300) {
    const message = result.error && result.error.message ? result.error.message : responseText;
    throw new Error('Firestore request failed (' + statusCode + '): ' + message);
  }

  return result;
}

function toFirestoreFields(data) {
  const fields = {};
  const cleanData = removeUndefinedFields(data || {});
  Object.keys(cleanData).forEach(function(key) {
    fields[key] = toFirestoreValue(cleanData[key]);
  });
  return fields;
}

function toFirestoreValue(value) {
  if (value === null) return { nullValue: null };
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(function(item) { return toFirestoreValue(item); })
      }
    };
  }
  if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  }

  const valueType = typeof value;
  if (valueType === 'boolean') return { booleanValue: value };
  if (valueType === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (valueType === 'object') {
    return {
      mapValue: {
        fields: toFirestoreFields(value)
      }
    };
  }

  return { stringValue: String(value) };
}

function removeUndefinedFields(data) {
  const cleaned = {};
  Object.keys(data || {}).forEach(function(key) {
    if (typeof data[key] !== 'undefined') {
      cleaned[key] = data[key];
    }
  });
  return cleaned;
}
