function createFirestoreOrder(orderData) {
  const response = createFirestoreDocument('orders', orderData);

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
  return updateFirestoreDocument('orders', documentId, updates);
}

function createFirestoreDocument(collectionName, data) {
  const projectId = getFirebaseProjectId();
  const url = getFirestoreCollectionUrl(projectId, collectionName);
  return callFirestoreApi(url, 'post', {
    fields: toFirestoreFields(data)
  });
}

function getFirestoreDocument(collectionName, documentId) {
  const projectId = getFirebaseProjectId();
  const url = getFirestoreDocumentUrl(projectId, collectionName, documentId);
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  if (statusCode === 404) return null;

  const responseText = response.getContentText();
  let result = {};
  if (responseText) {
    try {
      result = JSON.parse(responseText);
    } catch (err) {
      throw new Error('Firestore returned invalid JSON: ' + responseText);
    }
  }

  if (statusCode < 200 || statusCode >= 300) {
    const message = result.error && result.error.message ? result.error.message : responseText;
    throw new Error('Firestore request failed (' + statusCode + '): ' + message);
  }

  return result;
}

function setFirestoreDocument(collectionName, documentId, data) {
  const projectId = getFirebaseProjectId();
  const url = getFirestoreDocumentUrl(projectId, collectionName, documentId);
  return callFirestoreApi(url, 'patch', {
    fields: toFirestoreFields(data)
  });
}

function updateFirestoreDocument(collectionName, documentId, updates) {
  const projectId = getFirebaseProjectId();
  const cleanUpdates = removeUndefinedFields(updates);
  const updateMask = Object.keys(cleanUpdates)
    .map(function(fieldName) { return 'updateMask.fieldPaths=' + encodeURIComponent(fieldName); })
    .join('&');
  const url = getFirestoreDocumentUrl(projectId, collectionName, documentId) + (updateMask ? '?' + updateMask : '');

  return callFirestoreApi(url, 'patch', {
    fields: toFirestoreFields(cleanUpdates)
  });
}

function runFirestoreQuery(structuredQuery) {
  const projectId = getFirebaseProjectId();
  const url = 'https://firestore.googleapis.com/v1/projects/' +
    encodeURIComponent(projectId) +
    '/databases/(default)/documents:runQuery';

  return callFirestoreApi(url, 'post', { structuredQuery: structuredQuery });
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
  const options = {
    method: method,
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  };

  if (typeof payload !== 'undefined') {
    options.payload = JSON.stringify(payload);
  }

  const response = UrlFetchApp.fetch(url, options);

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

function firestoreDocumentToPlainObject(document) {
  if (!document || !document.fields) return null;
  const plainObject = firestoreFieldsToPlainObject(document.fields);
  plainObject.id = String(document.name || '').split('/').pop();
  return plainObject;
}

function firestoreFieldsToPlainObject(fields) {
  const obj = {};
  Object.keys(fields || {}).forEach(function(key) {
    obj[key] = firestoreValueToPlain(fields[key]);
  });
  return obj;
}

function firestoreValueToPlain(value) {
  if (!value) return '';
  if (Object.prototype.hasOwnProperty.call(value, 'stringValue')) return value.stringValue;
  if (Object.prototype.hasOwnProperty.call(value, 'integerValue')) return Number(value.integerValue);
  if (Object.prototype.hasOwnProperty.call(value, 'doubleValue')) return Number(value.doubleValue);
  if (Object.prototype.hasOwnProperty.call(value, 'booleanValue')) return value.booleanValue;
  if (Object.prototype.hasOwnProperty.call(value, 'timestampValue')) return value.timestampValue;
  if (Object.prototype.hasOwnProperty.call(value, 'nullValue')) return null;
  if (value.arrayValue) {
    return (value.arrayValue.values || []).map(function(item) {
      return firestoreValueToPlain(item);
    });
  }
  if (value.mapValue) {
    return firestoreFieldsToPlainObject(value.mapValue.fields || {});
  }
  return '';
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
