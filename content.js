// ページ内で重複して読み込まれないためのガード
if (typeof window.gigaTimerInitialized === 'undefined') {
  window.gigaTimerInitialized = true;

  // ポップアップからのメッセージ（指示）を受け取る
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'ADD_TIMER') {
      const config = request.timerConfig;
      const totalSeconds = (config.min || 0) * 60 + (config.sec || 0);
      createTimer(config.type, totalSeconds);
      sendResponse({ status: "ok" });
    }
  });

  // タイマーを画面に生成する関数
  function createTimer(type, initialSeconds) {
    const container = document.createElement('div');
    container.className = 'giga-timer-container size-medium';

    // 複数のタイマーを出した時に重ならないよう、位置を少しずつズラす
    const existingTimers = document.querySelectorAll('.giga-timer-container').length;
    container.style.top = `${20 + (existingTimers * 40)}px`;
    container.style.left = `${20 + (existingTimers * 40)}px`;

    let timeRemaining = type === 'countdown' ? initialSeconds : 0;
    let timerInterval = null;
    let isRunning = false;
    let audioCtx = null;

    // 秒を「分:秒」に変換
    function formatTime(seconds) {
      const m = Math.floor(Math.abs(seconds) / 60);
      const s = Math.abs(seconds) % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // 現在のスケール倍率を取得
    function getScale() {
      if (container.classList.contains('size-small')) return 0.6;
      if (container.classList.contains('size-large')) return 2.5;
      return 1;
    }

    // 全ての漢字にルビを適用したUIを生成
    container.innerHTML = `
      <div class="giga-timer-header">
        <span class="giga-timer-title"><ruby>時間<rt>じかん</rt></ruby>タイマー</span>
        <button class="giga-timer-close">×</button>
      </div>
      <div class="giga-timer-body">
        <div class="giga-timer-display">${formatTime(timeRemaining)}</div>
        <div class="giga-timer-controls">
          <button class="giga-btn giga-btn-start"><ruby>開始<rt>かいし</rt></ruby></button>
          <button class="giga-btn giga-btn-reset"><ruby>戻<rt>もど</rt></ruby>す</button>
        </div>
        <div class="giga-timer-sizes">
          <button class="giga-btn-size" data-size="small"><ruby>小<rt>しょう</rt></ruby></button>
          <button class="giga-btn-size active" data-size="medium"><ruby>中<rt>ちゅう</rt></ruby></button>
          <button class="giga-btn-size" data-size="large"><ruby>大<rt>だい</rt></ruby></button>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // 要素の取得
    const display = container.querySelector('.giga-timer-display');
    const startBtn = container.querySelector('.giga-btn-start');
    const resetBtn = container.querySelector('.giga-btn-reset');
    const closeBtn = container.querySelector('.giga-timer-close');
    const sizeBtns = container.querySelectorAll('.giga-btn-size');
    const header = container.querySelector('.giga-timer-header');

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

    // 時間の表示を更新
    function updateDisplay() {
      display.textContent = formatTime(timeRemaining);
      if (type === 'countdown' && timeRemaining <= 0) {
        display.classList.add('time-up');
        if (isRunning) {
          playTimeUpSound();
        }
        stopTimer();
      } else {
        display.classList.remove('time-up');
      }
    }

    // タイマー開始
    function startTimer() {
      if (isRunning) return;
      if (type === 'countdown' && timeRemaining <= 0) return;

      // ユーザー操作のタイミングでAudioContextを初期化（ブラウザの自動再生ポリシー対策）
      if (type === 'countdown' && !audioCtx) {
        try {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {}
      }

      isRunning = true;
      startBtn.innerHTML = '<ruby>停止<rt>ていし</rt></ruby>';
      startBtn.classList.remove('giga-btn-start');
      startBtn.classList.add('giga-btn-stop');

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
      startBtn.classList.remove('giga-btn-stop');
      startBtn.classList.add('giga-btn-start');
    }

    // クリックイベントの設定
    startBtn.addEventListener('click', () => {
      if (isRunning) stopTimer();
      else startTimer();
    });

    resetBtn.addEventListener('click', () => {
      stopTimer();
      timeRemaining = type === 'countdown' ? initialSeconds : 0;
      display.classList.remove('time-up');
      updateDisplay();
    });

    // サイズ変更（大・中・小）
    sizeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('.giga-btn-size');
        sizeBtns.forEach(b => b.classList.remove('active'));
        targetBtn.classList.add('active');

        container.classList.remove('size-small', 'size-medium', 'size-large');
        container.classList.add(`size-${targetBtn.dataset.size}`);
      });
    });

    // ── ドラッグ＆ドロップ（マウス＋タッチ両対応） ──
    let isDragging = false;
    let offsetX, offsetY;

    // マウスとタッチの座標を統一的に取得するヘルパー
    function getPointerPos(e) {
      if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    }

    function dragStart(e) {
      const target = e.target;
      if (target === header || header.contains(target)) {
        isDragging = true;
        const pos = getPointerPos(e);
        offsetX = pos.x - container.offsetLeft;
        offsetY = pos.y - container.offsetTop;
        e.preventDefault();
      }
    }

    function drag(e) {
      if (!isDragging) return;
      e.preventDefault();
      const pos = getPointerPos(e);
      const newX = pos.x - offsetX;
      const newY = pos.y - offsetY;
      // スケール倍率を考慮して画面外に出ないよう制限
      const scale = getScale();
      const maxX = window.innerWidth - container.offsetWidth * scale;
      const maxY = window.innerHeight - container.offsetHeight * scale;
      container.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
      container.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
    }

    function dragEnd() {
      isDragging = false;
    }

    // マウスイベント
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    // タッチイベント（Chromebook・電子黒板対応）
    header.addEventListener('touchstart', dragStart, { passive: false });
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', dragEnd);

    // タイマーを閉じる時にリスナーもきちんと解除する
    closeBtn.addEventListener('click', () => {
      stopTimer();
      if (audioCtx) {
        audioCtx.close().catch(() => {});
        audioCtx = null;
      }
      header.removeEventListener('mousedown', dragStart);
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', dragEnd);
      header.removeEventListener('touchstart', dragStart);
      document.removeEventListener('touchmove', drag);
      document.removeEventListener('touchend', dragEnd);
      container.remove();
    });
  }
}
