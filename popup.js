document.addEventListener('DOMContentLoaded', async () => {
  const typeSelect = document.getElementById('timer-type');
  const minInput = document.getElementById('input-min');
  const secInput = document.getElementById('input-sec');
  const addBtn = document.getElementById('add-btn');
  const btnText = document.querySelector('.btn-text');
  const spinner = document.querySelector('.spinner');
  
  // 前回保存した設定を読み込む
  try {
    const data = await chrome.storage.local.get(['dokodemoType', 'dokodemoMin', 'dokodemoSec']);
    if (data.dokodemoType) typeSelect.value = data.dokodemoType;
    if (data.dokodemoMin !== undefined) minInput.value = data.dokodemoMin;
    if (data.dokodemoSec !== undefined) secInput.value = data.dokodemoSec;
  } catch (e) {
    console.log("ストレージ読み込みエラー", e);
  }

  // Toast通知を表示する関数
  function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.innerHTML = message;
    toast.className = `toast ${isError ? 'error' : ''}`;
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }

  // 追加ボタンが押されたときの処理
  addBtn.addEventListener('click', async () => {
    // 1. ローディング表示開始
    addBtn.disabled = true;
    spinner.classList.remove('hidden');

    const type = typeSelect.value;
    const min = parseInt(minInput.value) || 0;
    const sec = parseInt(secInput.value) || 0;

    // 2. 設定を保存 (次回のため)
    await chrome.storage.local.set({
      dokodemoType: type,
      dokodemoMin: min,
      dokodemoSec: sec
    });

    try {
      // 3. 現在のタブにタイマー追加のメッセージを送信
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      if (tabs.length === 0) throw new Error("タブが見つかりません");
      
      const activeTab = tabs[0];
      
      // Chromeのシステムページなどでは実行できないためのエラーハンドリング
      if (activeTab.url.startsWith("chrome://") || activeTab.url.startsWith("edge://")) {
         throw new Error("このページでは<ruby>動作<rt>どうさ</rt></ruby>できません");
      }

      await chrome.tabs.sendMessage(activeTab.id, {
        action: 'ADD_TIMER',
        timerConfig: { type, min, sec }
      });

      showToast("タイマーを<ruby>追加<rt>ついか</rt></ruby>しました！");
    } catch (error) {
      showToast("<ruby>追加<rt>ついか</rt></ruby>に<ruby>失敗<rt>しっぱい</rt></ruby>しました。ページを<ruby>更新<rt>こうしん</rt></ruby>してください。", true);
      console.error(error);
    } finally {
      // 4. ローディング表示終了
      addBtn.disabled = false;
      spinner.classList.add('hidden');
    }
  });
});
