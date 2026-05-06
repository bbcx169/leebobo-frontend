# 李伯伯糖葫蘆前後台系統

本專案是以 React + Vite 建置的訂購網站，包含前台商品展示、結帳流程、訂單查詢，以及後台訂單管理。資料層使用 Firebase Firestore，訂單 PDF、Email、Google Sheets 報表與提醒通知由 Google Apps Script（GAS）處理。

## 技術棧

- React 19
- Vite 8
- React Router
- Tailwind CSS
- Firebase Firestore
- TanStack React Query（後台訂單資料流）
- LINE LIFF（後台管理員登入）
- Google Apps Script
- Google Sheets / Drive / MailApp

## 主要功能

### 前台

- 品牌故事、訂購流程、聯絡資訊頁面
- 商品選購與購物車
- 商品上架 / 停售狀態顯示
- 多步驟結帳流程
- 訂單成立後寫入 Firestore
- 呼叫 GAS 產生 PDF、寄送 Email、同步 Google Sheets 訂單報表
- 訂單查詢與 PDF 收據顯示

### 後台

- LINE LIFF 管理員驗證與密碼備用登入
- 訂單列表分頁載入
- 訂單編號 / 手機 server-side 搜尋
- 修改訂單資訊並重產 PDF
- 補發 PDF
- 刪除訂單：先將 Google Sheets 報表軟刪除，再刪除 Firestore 訂單
- 商品上架 / 停售設定
- LINE 每日提醒設定
- 營收報表與每日備料統計

## 專案結構

```text
src/
  App.jsx                         # 路由、前台外框、lazy loading
  main.jsx                        # React 入口
  constants/data.js               # 商品資料、初始表單資料
  pages/
    BrandStory.jsx
    ProductList.jsx               # 商品選購頁
    Checkout.jsx                  # 多步驟結帳流程
    OrderSuccess.jsx
    OrderInquiry.jsx
    AdminDashboard.jsx            # 後台主頁
  components/
    Admin/                        # 後台表格、統計、Modal
    checkout/                     # 結帳步驟元件
    _archive/                     # 舊版或未引用元件封存
  utils/
    firebase.js                   # Firebase 初始化
    adminOrdersApi.js             # 後台 Firestore / GAS API 封裝
    productAvailability.js        # 商品上下架 Firestore 設定
    orderDetails.js               # 地址與地點資訊格式化

gas/
  Api.gs                          # GAS Web App API，唯一維護來源
  EnvConfig.gs / EnvConfig.js     # GAS 環境變數與常數
  PdfService.gs / PdfService.js   # PDF 產生邏輯
  PdfTemplate.html                # PDF HTML 模板
  _archive/                       # 歷史封存檔案，不得作為部署來源
```

## 本機開發

### 安裝依賴

```bash
npm install
```

### 啟動開發伺服器

```bash
npm run dev
```

Vite 設定使用 `@vitejs/plugin-basic-ssl`，本機開發會以 HTTPS 啟動，方便 LIFF 或瀏覽器安全限制相關功能測試。

### 建置

```bash
npm run build
```

### 預覽 build 結果

```bash
npm run preview
```

### ESLint

```bash
npm run lint
```

## 路由與效能

`src/App.jsx` 已使用 `React.lazy()` 搭配 `Suspense` 進行路由層級 lazy loading。前台頁面與後台 `AdminDashboard` 會被拆成不同 chunk，一般顧客首次進入前台時不會下載完整後台管理程式碼。

Vite `base` 設定為：

```js
base: '/leebobo-frontend/'
```

這是為 GitHub Pages 子路徑部署準備的設定。如部署到不同路徑，需同步調整 `vite.config.js` 與路由 basename。

## Firebase

目前 Firebase 設定寫在：

```text
src/utils/firebase.js
```

Firebase CLI 設定檔：

```text
.firebaserc
firebase.json
firestore.rules
firestore.indexes.json
```

使用的主要 Firestore 資料：

- `orders`：訂單資料
- `settings/productAvailability`：商品上架 / 停售狀態

後台訂單列表使用 TanStack React Query：

- `useInfiniteQuery(['adminOrders'])`：訂單分頁，每頁 50 筆
- `useQuery(['adminOrderSearch', searchMode, keyword])`：訂單編號 / 手機查詢
- `useMutation`：修改訂單、補發 PDF、刪除訂單、儲存設定

### Firestore Rules 遷移狀態

目前已新增 `firestore.rules`，但規則屬於「過渡正式版」：

- 保留前台直接建立訂單
- 保留訂單查詢直接讀取訂單
- 保留後台直接更新 / 刪除訂單
- 保留後台直接寫入商品上下架設定

原因是目前專案尚未導入 Firebase Auth，也尚未將敏感操作全部移到 GAS / Cloud Functions。若現在直接關閉未授權讀寫，前台結帳與後台管理會中斷。

部署 Firestore rules：

```bash
firebase deploy --only firestore:rules
```

後續安全收斂方向：

1. 前台建立訂單改由 GAS 或 Cloud Functions 代寫 Firestore
2. 後台修改 / 刪除訂單改由具權限的 server-side API 處理
3. 或導入 Firebase Auth + custom claims 辨識管理員
4. 最後將 `orders` 的公開讀寫權限收緊

## Google Apps Script

GAS API 主要負責：

- 驗證後台管理員
- 建立訂單 PDF
- 寄送 Email
- 同步 Google Sheets 訂單報表
- 軟刪除報表列
- 儲存 LINE 提醒設定
- 推送 LINE / Telegram / Email 通知

前端目前使用的 GAS Web App URL 定義於：

```text
src/utils/adminOrdersApi.js
src/pages/Checkout.jsx
```

正式環境建議統一改由環境變數管理，避免同一 URL 分散在多個檔案。

### GAS 部署注意事項

修改 `gas/` 內檔案後，必須重新部署 Apps Script Web App，前端才會打到新版邏輯。

`gas/Api.gs` 是 GAS API 的唯一維護來源。`gas/_archive/Api.legacy.js` 僅供歷史參考，不得部署，也不需要同步修改。

本專案已移除 clasp 專案綁定與登入設定，不再透過 clasp push/deploy 維護 GAS。更新 GAS 時，請手動將 `gas/` 內對應檔案內容同步到 Apps Script 編輯器，或另行建立明確的部署流程。

常見需要確認的 GAS Script Properties：

```text
ADMIN_PASSWORD
LINE_CHANNEL_ACCESS_TOKEN
LINE_ADMIN_USER_ID
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
ORDER_REPORT_SPREADSHEET_ID
REMINDER_ENABLED
REMINDER_TIME
reminderEnabled
reminderTime
```

提醒設定目前會同步寫入大小寫兩組 key，以相容既有提醒排程邏輯。

## Google Sheets 訂單報表

新訂單建立時，前端會：

1. 寫入 Firestore `orders`
2. 呼叫 GAS `create_order`
3. GAS 產生 PDF
4. GAS upsert Google Sheets 訂單報表列
5. Firestore 回寫 PDF URL 與 Sheets 同步狀態

後台刪除訂單時，流程為：

1. 呼叫 GAS `mark_order_deleted`
2. Google Sheets 對應列標記為刪除、金額歸零、灰階顯示
3. Firestore 刪除訂單文件

## 商品上下架

商品靜態資料在：

```text
src/constants/data.js
```

商品是否可販售儲存在 Firestore：

```text
settings/productAvailability
```

前台商品頁會讀取此設定：

- 上架商品可加入購物車
- 停售商品灰階顯示並停用數量控制
- 結帳頁會再次檢查購物車，避免停售商品被送出訂單

## 後台登入

後台路由：

```text
/admin
```

登入方式：

- LINE LIFF 管理員驗證
- 管理密碼備用登入

LIFF ID 目前定義在：

```text
src/pages/AdminDashboard.jsx
```

## 已知維護重點

- `gas/Api.gs` 是 GAS API 唯一維護來源；`gas/_archive/Api.legacy.js` 僅保留歷史參考。
- 前端有部分文字因歷史編碼問題呈現亂碼，功能未必受影響，但後續應逐步清理。
- 舊版 `OrderForm` 已封存於 `src/components/_archive/OrderForm.legacy.jsx`，待專案運作穩定後再評估移除。
- GAS URL 與 Firebase config 目前寫在程式碼內，正式維運建議集中到環境變數或設定檔。

## 部署檢查清單

前端部署前：

```bash
npm run build
```

確認事項：

- `vite.config.js` 的 `base` 是否符合部署路徑
- Firebase 專案設定是否正確
- Firestore rules 是否已部署到正確 Firebase project
- GAS Web App URL 是否為最新部署版本
- Apps Script 權限是否允許 Web App 執行
- Google Sheets 報表 ID 是否正確
- 後台商品上下架設定是否已初始化

GAS 修改後：

1. 手動更新 Apps Script 專案檔案
2. 重新部署 Web App
3. 確認前端使用的是新版 Web App URL
4. 測試 `get_settings` / `save_settings`
5. 測試新訂單 PDF 與 Sheets 同步
