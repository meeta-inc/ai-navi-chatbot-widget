# AI Navi チャットボットウィジェット

ウェブサイトに簡単に埋め込める軽量でカスタマイズ可能なチャットボットウィジェットです。

## 特徴

- 🎨 色とスタイルのカスタマイズ
- 📱 レスポンシブデザイン（モバイルフレンドリー）
- 🎯 位置設定可能（左/右）
- ⚡ 軽量で高速ロード
- 🔧 簡単な統合

## インストール

1. HTMLにウィジェットスクリプトを含めます：

```html
<script src="src/chatbot-widget.js"></script>
```

## 使用方法

### 基本的な使用方法

ウィジェットはデフォルト設定で自動初期化されます：

```html
<script src="src/chatbot-widget.js"></script>
```

### カスタム設定

```html
<script>
window.chatbotWidgetOptions = {
    title: '🤖 私のAIアシスタント',
    primaryColor: '#ff6b35',
    secondaryColor: '#f7931e',
    chatbotUrl: 'https://your-chatbot-url.com',
    position: 'right', // 'left' または 'right'
    clientId: 'RS000001', // クライアントID
    appId: '0001' // アプリケーションID
};
</script>
<script src="src/chatbot-widget.js"></script>
```

## 設定オプション

| オプション | タイプ | デフォルト値 | 説明 |
|------|------|--------|------|
| `title` | string | '🤖 AIアシスタント' | ヘッダーに表示されるウィジェットタイトル |
| `primaryColor` | string | '#ff6b35' | グラデーションメインカラー |
| `secondaryColor` | string | '#f7931e' | グラデーションサブカラー |
| `chatbotUrl` | string | 'https://ainavi-dev.meeta.jp/' | チャットボットアプリケーションURL |
| `position` | string | 'right' | トリガーボタン位置（'left' または 'right'） |
| `showTriggerButton` | boolean | true | フローティングトリガーボタンの表示/非表示 |
| `clientId` | string | 'RS000001' | クライアントID（チャットボット設定識別用） |
| `appId` | string | '0001' | アプリケーションID（チャットボットインスタンス識別用） |

## リンクトリガー

ページのリンクやボタンを使用してチャットボットモーダルを開くこともできます：

### データ属性の使用：
```html
<a href="#" data-chatbot-trigger>お問い合わせ</a>
<button data-chatbot-trigger>チャットボットを開く</button>
```

### CSSクラスの使用：
```html
<a href="#" class="chatbot-trigger-link">カスタマーサポート</a>
<span class="chatbot-trigger-link">ヘルプ</span>
```

### プログラミングAPI：
```javascript
// ウィジェットインスタンスの取得（カスタムオプション使用時）
const widget = new ChatbotWidget();

// モーダルを開く
widget.openModal();

// モーダルを閉じる
widget.closeModal();

// モーダルトグル
widget.toggleModal();
```

## リンク専用モード

フローティングトリガーボタンを非表示にしてリンクのみでチャットボットを使用できます：

```html
<script>
window.chatbotWidgetOptions = {
    title: 'カスタマーサポート',
    showTriggerButton: false  // フローティングボタンを非表示
};
</script>
<script src="https://your-amplify-url.com/chatbot-widget.iife.js"></script>

<!-- リンクでチャットボットを開く -->
<a href="#" data-chatbot-trigger>お問い合わせ</a>
<button class="chatbot-trigger-link">カスタマーサポート</button>
```

完全な例は `link-only-sample.html` を参照してください。

## 開発

### 必須要件

- Node.js（バージョン14以上）
- npm または yarn

### セットアップ

1. リポジトリをクローン
2. 依存関係のインストール：
   ```bash
   npm install
   ```

### 開発サーバー

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### プレビュー

```bash
npm run preview
```

## ブラウザサポート

- Chrome（最新）
- Firefox（最新）
- Safari（最新）
- Edge（最新）

## ライセンス

このプロジェクトは非公開および独占所有です。