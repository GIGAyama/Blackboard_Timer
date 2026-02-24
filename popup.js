document.addEventListener('DOMContentLoaded', async () => {
  const typeSelect = document.getElementById('timer-type');
  const minInput = document.getElementById('input-min');
  const secInput = document.getElementById('input-sec');
  const addBtn = document.getElementById('add-btn');
  const spinner = document.querySelector('.spinner');

  // 前回保存した設定を読み込む
  try {
    const data = await chrome.storage.local.get(['dokodemoType', 'dokodemoMin', 'dokodemoSec']);
    if (data.dokodemoType) typeSelect.value = data.dokodemoType;
    if (data.dokodemoMin !== undefined) minInput.value = data.dokodemoMin;
    if (data.dokodemoSec !== undefined) secInput.value = data.dokodemoSec;
  } catch (e) {
    // ストレージが利用できない場合はデフォルト値を使う
  }

  // タイマー種類に応じて時間入力の有効/無効を切り替える
  function updateTimeInputState() {
    const isCountup = typeSelect.value === 'countup';
    minInput.disabled = isCountup;
    secInput.disabled = isCountup;
  }

  typeSelect.addEventListener('change', updateTimeInputState);
  updateTimeInputState(); // 初期状態を反映

  // Toast通知を表示する関数
  function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${isError ? 'error' : ''}`;
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }

  // 入力値のバリデーションと正規化
  function clampInput(input, min, max) {
    let val = parseInt(input.value);
    if (isNaN(val) || val < min) val = min;
    if (val > max) val = max;
    input.value = val;
    return val;
  }

  // 入力フィールドからフォーカスが外れた時に値を補正する
  minInput.addEventListener('blur', () => clampInput(minInput, 0, 99));
  secInput.addEventListener('blur', () => clampInput(secInput, 0, 59));

  // スクロールホイールで値が変わるのを防ぐ
  minInput.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
  secInput.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });

  // Enterキーで追加できるようにする
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !addBtn.disabled) {
      addBtn.click();
    }
  });

  // 追加ボタンが押されたときの処理
  addBtn.addEventListener('click', async () => {
    // 1. 入力値を検証・補正
    const min = clampInput(minInput, 0, 99);
    const sec = clampInput(secInput, 0, 59);
    const type = typeSelect.value;

    // カウントダウンの場合、0分0秒ではタイマーを追加できない
    if (type === 'countdown' && min === 0 && sec === 0) {
      showToast("時間を1秒以上に設定してください", true);
      return;
    }

    // 2. ローディング表示開始
    addBtn.disabled = true;
    spinner.classList.remove('hidden');

    // 3. 設定を保存 (次回のため)
    try {
      await chrome.storage.local.set({
        dokodemoType: type,
        dokodemoMin: min,
        dokodemoSec: sec
      });
    } catch (e) {
      // 保存失敗は無視して続行する
    }

    try {
      // 4. 現在のタブにタイマー追加のメッセージを送信
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      if (tabs.length === 0) throw new Error("タブが見つかりません");

      const activeTab = tabs[0];

      // Chromeのシステムページなどでは実行できない
      const url = activeTab.url || '';
      if (url.startsWith("chrome://") || url.startsWith("edge://") || url.startsWith("about:") || url.startsWith("chrome-extension://")) {
        showToast("このページでは使えません", true);
        return;
      }

      // コンテンツスクリプトが未注入の場合に備え、先に注入を試みる
      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ['content.js']
        });
        await chrome.scripting.insertCSS({
          target: { tabId: activeTab.id },
          files: ['content.css']
        });
      } catch (e) {
        // 既に注入済みの場合はエラーになるが無視してよい
      }

      await chrome.tabs.sendMessage(activeTab.id, {
        action: 'ADD_TIMER',
        timerConfig: { type, min, sec }
      });

      showToast("タイマーを追加しました！");
    } catch (error) {
      showToast("追加に失敗しました", true);
    } finally {
      // 5. ローディング表示終了
      addBtn.disabled = false;
      spinner.classList.add('hidden');
    }
  });
});
