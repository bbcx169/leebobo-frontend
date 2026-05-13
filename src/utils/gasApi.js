import { GAS_SCRIPT_URL } from '../config';

export const parseGasResponse = async (response) => {
  const responseText = await response.text();
  const trimmedText = responseText.trim();
  const statusLabel = response.ok ? '' : ` HTTP ${response.status}`;

  if (!trimmedText) {
    throw new Error(`GAS returned an empty response.${statusLabel} Please check the Apps Script deployment.`);
  }

  if (trimmedText.startsWith('<')) {
    throw new Error(`GAS returned an HTML page instead of JSON.${statusLabel} Please check the Apps Script Web App URL and access permissions.`);
  }

  let result;
  try {
    result = JSON.parse(trimmedText);
  } catch (error) {
    throw new Error(`Unable to parse GAS response${statusLabel}: ${error.message}`);
  }

  if (!response.ok) {
    throw new Error(result.message || result.error || `GAS request failed with HTTP ${response.status}.`);
  }

  if (result.status === 'error') {
    throw new Error(result.message || 'GAS returned an error.');
  }

  return result;
};

export const postGasApi = async (payload) => {
  const response = await fetch(GAS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  return parseGasResponse(response);
};

export const sendGasRequestWithNoCorsFallback = async (payload, fallbackMessage = '請求已送出，請稍後確認。') => {
  try {
    return await postGasApi(payload);
  } catch (error) {
    console.warn('Readable GAS request failed, retrying as no-cors:', error);

    await fetch(GAS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    return {
      status: 'success',
      message: fallbackMessage
    };
  }
};
