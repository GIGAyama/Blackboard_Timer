# どこでも時間タイマー

**どのページでも使える、常に最前面に表示されるChrome拡張タイマー。**

タブを切り替えても消えません。授業・会議・プレゼンのお供に。

![Chrome](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 特徴

- **常に最前面に表示** — Document Picture-in-Picture APIで、他のウィンドウに隠れない
- **どのページでも動作** — 独立ウィンドウ方式なので、サイトの制約を受けない
- **カウントダウン / カウントアップ** — 2つのモードを切り替え可能
- **時間の追加・変更が自由自在** — 実行中でも -1分 / +1分 / +5分 で柔軟に調整
- **タイムアップ後の延長も可能** — 終了後に +1分 すればそのまま再開
- **ワンクリック開始** — ポップアップの「開始」ボタンで即座にタイマー起動
- **タイムアップ音** — ピピピッ♪ の3連ビープで時間切れをお知らせ
- **サイズ変更** — 小・中・大の3サイズに切り替え可能
- **キーボード操作** — Space/Enterで開始・停止、Rでリセット
- **設定の自動保存** — 前回の設定を記憶して次回に復元
- **ふりがな付き** — すべてのボタンにルビ（ふりがな）を表示

## 使い方

### 1. タイマーを開始する

1. ツールバーのアイコンをクリック
2. 種類（カウントダウン / カウントアップ）を選ぶ
3. 時間を設定する
4. **「開始」** をクリック

### 2. 最前面に固定する

タイマーが起動すると、**「画面をクリックして最前面に固定」** というオーバーレイが表示されます。
クリック（またはSpace/Enter）すると、タイマーが **PiPウィンドウ（常に最前面）** に切り替わります。

### 3. 操作する

| 操作 | 方法 |
|---|---|
| 開始 / 停止 | ボタンクリック or `Space` / `Enter` |
| リセット | 「戻す」ボタン or `R` |
| 時間調整 | `-1分` / `+1分` / `+5分` ボタン |
| サイズ変更 | `小` / `中` / `大` ボタン |
| 最前面に再固定 | PiPを閉じた後に表示される「最前面に再固定」バー |

## インストール

### Chrome Web Store（準備中）

<!-- Chrome Web Store公開後にリンクを追加 -->

### 手動インストール（開発者モード）

1. このリポジトリをダウンロード or `git clone`
2. Chromeで `chrome://extensions` を開く
3. 右上の **「デベロッパーモード」** を有効にする
4. **「パッケージ化されていない拡張機能を読み込む」** をクリック
5. ダウンロードしたフォルダを選択

## ファイル構成

```
Blackboard_Timer/
├── manifest.json      # 拡張機能の設定（Manifest V3）
├── popup.html         # ポップアップUI
├── popup.js           # ポップアップのロジック
├── popup.css          # ポップアップのスタイル
├── timer.html         # タイマーウィンドウUI
├── timer.js           # タイマーのロジック（PiP・音声・調整）
├── timer.css          # タイマーのスタイル
├── icon.png           # アイコン 128x128
├── icon48.png         # アイコン 48x48
└── icon16.png         # アイコン 16x16
```

## 技術スタック

| 技術 | 用途 |
|---|---|
| Chrome Extensions Manifest V3 | 拡張機能の基盤 |
| Document Picture-in-Picture API | 常に最前面に表示 |
| Web Audio API | タイムアップ音の生成 |
| Chrome Storage API | 設定の永続化 |
| Chrome Windows API | タイマーウィンドウの管理 |
| Zen Maru Gothic (Google Fonts) | 丸ゴシック体フォント |

## 動作環境

- Google Chrome 116 以降（Document PiP API対応）
- PiP非対応ブラウザでも通常ウィンドウとして動作可能

## 作者

**GIGA山** — [note](https://note.com/cute_borage86)

## ライセンス

MIT License
