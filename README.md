# 李伯伯糖葫蘆前後台系統

本專案是以 React + Vite 建置的訂購網站，包含前台商品展示、結帳流程、訂單查詢，以及後台訂單管理。資料層使用 Firebase Firestore，訂單 PDF、Email、Google Sheets 報表與提醒通知由 Google Apps Script（GAS）處理。

## 技術棧

- React 19
- Vite 8
- React Router
- Tailwind CSS
- Firebase Firestore
- TanStack React Query（後台訂單資料流）
- Firebase Auth Google Provider / Email Password（後台管理員登入）
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

- Firebase Auth Google 帳戶與 Email/Password 登入 + custom claims 管理員驗證
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
  utils/
    firebase.js                   # Firebase 初始化
    adminOrdersApi.js             # 後台 Firestore / GAS API 封裝
    productAvailability.js        # 商品上下架 Firestore 設定
    orderDetails.js               # 地址與地點資訊格式化

gas/
  Api.gs                          # GAS Web App 入口與 action routing
  AuthService.gs                  # Firebase admin ID token / custom claim 驗證
  OrderActions.gs                 # create_order / update_pdf / resend / delete action 實作
  DrivePdfService.gs              # Drive PDF 查找與檔案 ID 工具
  FirestoreService.gs             # Firestore REST API 寫入
  OrderReportService.gs           # Google Sheets 訂單報表同步
  NotificationService.gs          # LINE / Telegram 通知
  SettingsService.gs              # 後台提醒設定
  EnvConfig.gs                    # GAS 環境變數與常數
  PdfService.gs                   # PDF 產生邏輯
  PdfTemplate.html                # PDF HTML 模板
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

Vite 設定使用 `@vitejs/plugin-basic-ssl`，本機開發會以 HTTPS 啟動，方便 Firebase Auth 與瀏覽器安全限制相關功能測試。

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

### Firestore Rules 與後台安全收斂

後台已改用 Firebase Auth + custom claims 判斷管理員權限。Firestore rules 目前收斂為：

- 前台不可直接建立訂單；訂單建立由 GAS `create_order` 代寫 Firestore。
- 前台僅可補寫 `pdfDownloadUrl` / `sheetSynced` / `sheetSyncError`。
- 後台修改與刪除訂單需 `request.auth.token.admin == true`。
- 商品上下架設定前台可讀，只有 admin 可寫。
- 訂單查詢仍保留公開讀取，因為目前前台查詢流程仍直接 query Firestore。

部署 Firestore rules：

```bash
firebase deploy --only firestore:rules
```

#### 設定管理員 custom claim

1. 在 Firebase Console 啟用 Authentication 的 Google provider 與 Email/Password provider。
2. 先建立 Firebase Authentication user：

Google 帳號：

- 請管理員先到後台登入一次。
- 第一次登入後若看到「無權限」是正常的，目的只是讓 Firebase Authentication 建立該 Google user。
- 到 Firebase Console → Authentication → Users，找到剛剛登入的 Google 帳號並確認 Email。

Email/Password 帳號：

- 到 Firebase Console → Authentication → Users。
- 手動新增 Email/Password user，或讓使用者透過未來的註冊流程建立帳號。
- 確認該 user 的 Email。

3. 準備 Firebase Admin SDK service account JSON，並設定本機 PowerShell 環境變數：

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
$env:FIREBASE_PROJECT_ID="leebobo-frontend"
```

4. 對該 user 設定管理員 claim：

```powershell
npm.cmd run admin:set-claim -- 你的GoogleEmail@gmail.com true
```

或：

```powershell
npm.cmd run admin:set-claim -- admin@example.com true
```

5. 回到後台，按「登出並切換帳號」。
6. 重新用同一個 Google 帳戶或 Email/Password 帳號登入。

重點：設定 custom claim 後，舊 token 不會立刻更新，所以一定要登出再登入，ID token 才會帶入 `admin: true`。

#### GAS admin token 驗證

GAS 高風險 action 已要求 Firebase admin ID token：

- `get_settings`
- `save_settings`
- `update_pdf`
- `admin_resend_pdf`
- `mark_order_deleted`

只有後台使用的 `admin_resend_pdf` 需要 Firebase admin ID token；客戶端補寄使用的 `resendPdf` 不需要 admin token。

前端 Firebase Web API Key 請用 Vite 環境變數設定，不要寫入程式碼：

```text
VITE_FIREBASE_API_KEY
VITE_GAS_SCRIPT_URL
```

本機可複製 `.env.example` 為 `.env.local` 後填入；GitHub Pages / CI 部署則請在部署環境設定同名 secret 或 variable。

GAS 部署後，請確認 Script Properties 有設定：

```text
FIREBASE_WEB_API_KEY
FIREBASE_PROJECT_ID
```

後續安全收斂方向：

1. 訂單查詢改由受控 API 執行，移除 `orders` 公開讀取
2. 後台 Firestore 寫入改由 GAS / Cloud Functions 代寫

## Google Apps Script

GAS API 主要負責：

- 驗證後台管理員
- 建立 Firestore 訂單
- 建立訂單 PDF
- 寄送 Email
- 同步 Google Sheets 訂單報表
- 軟刪除報表列
- 儲存 LINE 提醒設定
- 推送 LINE / Telegram / Email 通知

前端使用的 GAS Web App URL 由 Vite 環境變數集中管理：

```text
VITE_GAS_SCRIPT_URL
src/config.js
```

正式環境需在 GitHub Actions secrets 設定 `VITE_GAS_SCRIPT_URL`，程式碼不得硬編碼 Web App URL。

### GAS 部署注意事項

修改 `gas/` 內檔案後，必須重新部署 Apps Script Web App，前端才會打到新版邏輯。

`gas/` 目錄是 GAS API 的正式維護來源；`Api.gs` 只保留 Web App 入口與 action routing。正式 GAS 程式碼只保留 `.gs` 檔，避免 `.js` 備份與 `.gs` 版本不同步。

本專案使用 clasp 維護 GAS 原始碼。`.clasp.json` 內含 Apps Script `scriptId`，屬本機設定且已由 `.gitignore` 排除；請複製 `.clasp.json.example` 為 `.clasp.json` 並填入實際 `scriptId`。

已設定本機 Git `pre-push` hook：執行 `git push` 時會先跑 `npm run gas:push`，將 `gas/` 目錄內的 GAS 檔案推送到 Apps Script。若臨時只想推 Git、不推 GAS，可使用 `SKIP_GAS_PUSH=1 git push`。

常見需要確認的 GAS Script Properties：

```text
FIREBASE_PROJECT_ID
FIREBASE_WEB_API_KEY
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

1. 呼叫 GAS `create_order`
2. GAS 產生 PDF
3. GAS 建立 Firestore `orders` 文件
4. GAS upsert Google Sheets 訂單報表列
5. GAS 回寫 Sheets / notification 同步狀態到 Firestore
6. GAS 推送 LINE / Telegram / Email 通知

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

- Firebase Auth Google 帳戶登入
- Firebase Auth Email/Password 登入
- Firebase custom claims 驗證 `admin: true`

不再使用 LIFF 或 GAS 後台共用密碼登入。Email/Password 是 Firebase Authentication 帳號，不是舊的共用密碼。

## 已知維護重點

- `gas/` 目錄是 GAS API 正式維護來源；正式 GAS 程式碼只保留 `.gs` 檔。
- 前端有部分文字因歷史編碼問題呈現亂碼，功能未必受影響，但後續應逐步清理。

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

1. 確認本機 `.clasp.json` 已設定 Apps Script `scriptId`
2. 執行 `npm run gas:status` 檢查 clasp 將同步的檔案
3. 執行 `git push`，pre-push hook 會先自動執行 `npm run gas:push`
4. 重新部署 Web App
5. 確認前端使用的是新版 Web App URL
6. 測試 `get_settings` / `save_settings`
7. 測試新訂單 PDF 與 Sheets 同步
