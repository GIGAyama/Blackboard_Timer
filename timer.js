document.addEventListener('DOMContentLoaded', () => {
  // URLパラメータからタイマー設定を取得
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type') || 'countdown';
  const initialSeconds = parseInt(params.get('seconds')) || 180;

  let timeRemaining = type === 'countdown' ? initialSeconds : 0;
  let timerInterval = null;
  let isRunning = false;
  let audioCtx = null;
  let pipWindow = null;

  const display = document.getElementById('timer-display');
  const startBtn = document.getElementById('btn-start');
  const resetBtn = document.getElementById('btn-reset');
  const sizeBtns = document.querySelectorAll('.btn-size');
  const pinBtn = document.getElementById('btn-pin');
  const timerSizes = document.querySelector('.timer-sizes');

  // Document Picture-in-Picture 非対応ならピンボタンを非表示
  if (!('documentPictureInPicture' in window)) {
    pinBtn.style.display = 'none';
  }

  // 小・中・大に応じたウィンドウサイズ
  const windowSizes = {
    small: { width: 250, height: 180 },
    medium: { width: 350, height: 240 },
    large: { width: 500, height: 340 }
  };

  // 秒を「分:秒」に変換
  function formatTime(seconds) {
    const m = Math.floor(Math.abs(seconds) / 60);
    const s = Math.abs(seconds) % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // タイムアップ時の音声を再生 (Web Audio API)
  function playTimeUpSound() {
    try {
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const now = audioCtx.currentTime;
      function beep(startTime, freq, duration) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      }
      // ピピピッ♪ の3連ビープ
      beep(now, 880, 0.15);
      beep(now + 0.2, 880, 0.15);
      beep(now + 0.4, 1100, 0.3);
    } catch (e) {
      // Audio APIが利用できない環境では無視
    }
  }

  // 表示を更新（ウィンドウタイトルも連動）
  function updateDisplay() {
    const timeStr = formatTime(timeRemaining);
    display.textContent = timeStr;
    document.title = `${timeStr} - 時間タイマー`;

    if (type === 'countdown' && timeRemaining <= 0) {
      display.classList.add('time-up');
      if (isRunning) playTimeUpSound();
      stopTimer();
    } else {
      display.classList.remove('time-up');
    }
  }

  // タイマー開始
  function startTimer() {
    if (isRunning) return;
    if (type === 'countdown' && timeRemaining <= 0) return;

    // ユーザー操作のタイミングでAudioContextを初期化（自動再生ポリシー対策）
    if (type === 'countdown' && !audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {}
    }

    isRunning = true;
    startBtn.innerHTML = '<ruby>停止<rt>ていし</rt></ruby>';
    startBtn.classList.remove('btn-start');
    startBtn.classList.add('btn-stop');

    timerInterval = setInterval(() => {
      if (type === 'countdown') {
        timeRemaining--;
      } else {
        timeRemaining++;
      }
      updateDisplay();
    }, 1000);
  }

  // タイマー停止
  function stopTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    timerInterval = null;
    startBtn.innerHTML = '<ruby>開始<rt>かいし</rt></ruby>';
    startBtn.classList.remove('btn-stop');
    startBtn.classList.add('btn-start');
  }

  // 開始/停止 トグル
  startBtn.addEventListener('click', () => {
    if (isRunning) stopTimer();
    else startTimer();
  });

  // リセット
  resetBtn.addEventListener('click', () => {
    stopTimer();
    timeRemaining = type === 'countdown' ? initialSeconds : 0;
    display.classList.remove('time-up');
    updateDisplay();
  });

  // サイズ変更（ウィンドウ自体をリサイズ）
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const size = windowSizes[btn.dataset.size];
      try {
        const win = await chrome.windows.getCurrent();
        await chrome.windows.update(win.id, size);
      } catch (e) {
        // ウィンドウAPIが使えない場合は無視
      }
    });
  });

  // キーボードショートカット
  function handleKeydown(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (isRunning) stopTimer();
      else startTimer();
    } else if (e.key === 'r' || e.key === 'R') {
      resetBtn.click();
    }
  }

  document.addEventListener('keydown', handleKeydown);

  // ── 最前面に固定 (Document Picture-in-Picture API) ──
  pinBtn.addEventListener('click', async () => {
    if (!('documentPictureInPicture' in window)) return;

    try {
      pipWindow = await documentPictureInPicture.requestWindow({
        width: 350,
        height: 240
      });

      // スタイルシートをPiPウィンドウにコピー
      [...document.querySelectorAll('link[rel="stylesheet"], style')].forEach(el => {
        pipWindow.document.head.appendChild(el.cloneNode(true));
      });

      // PiP内ではサイズボタン・ピンボタンは不要（ドラッグでリサイズ可能）
      timerSizes.style.display = 'none';
      pinBtn.style.display = 'none';

      // タイマーのUI要素をPiPウィンドウに移動（scriptタグ以外）
      const elementsToMove = document.querySelectorAll(
        '#btn-pin, .timer-display, .timer-controls, .timer-sizes'
      );
      elementsToMove.forEach(el => pipWindow.document.body.appendChild(el));

      // PiPウィンドウにキーボードイベントを登録
      document.removeEventListener('keydown', handleKeydown);
      pipWindow.document.addEventListener('keydown', handleKeydown);

      // 元ウィンドウに案内メッセージを表示
      const msg = document.createElement('div');
      msg.className = 'pip-placeholder';
      msg.innerHTML = 'タイマーは<ruby>最前面<rt>さいぜんめん</rt></ruby>に<br><ruby>表示中<rt>ひょうじちゅう</rt></ruby>です。<br><br><small>このウィンドウは<ruby>閉<rt>と</rt></ruby>じないでください。</small>';
      document.body.appendChild(msg);

      // PiPウィンドウが閉じられたら元に戻す
      pipWindow.addEventListener('pagehide', () => {
        // pagehide後にブラウザが要素を自動で元のDOMに戻す。
        // setTimeout(0)でその完了を待ってからUIを復元する。
        setTimeout(() => {
          const placeholder = document.querySelector('.pip-placeholder');
          if (placeholder) placeholder.remove();

          timerSizes.style.display = '';
          pinBtn.style.display = '';

          document.addEventListener('keydown', handleKeydown);
          pipWindow = null;
        }, 0);
      });

    } catch (e) {
      // PiP起動失敗時は無視（元のウィンドウで引き続き使える）
    }
  });

  // 初期表示
  updateDisplay();
});
