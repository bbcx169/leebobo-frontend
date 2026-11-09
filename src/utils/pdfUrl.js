/**
 * 將 Google Drive 下載/分享連結轉換為相容手機（iOS Safari / LINE / Android）的原生預覽連結。
 * 若原本為 uc?export=download&id=... 或其他 Drive 連結，一律轉換為 /file/d/{id}/view?usp=sharing。
 * 讓手機瀏覽器與社群 In-App Browser 均可直接線上檢視，避免跳出空白畫面或下載失敗。
 * 
 * @param {string} url - 原始 PDF 連結
 * @returns {string} 預覽連結
 */
export function getPdfViewUrl(url) {
  if (!url) return '';
  const str = String(url).trim();

  // 1. 匹配 uc?export=download&id=FILE_ID 格式
  const ucMatch = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) {
    return `https://drive.google.com/file/d/${ucMatch[1]}/view?usp=sharing`;
  }

  // 2. 匹配 /file/d/FILE_ID/... 格式
  const fileMatch = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/view?usp=sharing`;
  }

  return str;
}
