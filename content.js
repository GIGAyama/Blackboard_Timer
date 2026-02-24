// ページ内で重複して読み込まれないためのガード
if (typeof window.gigaTimerInitialized === 'undefined') {
  window.gigaTimerInitialized = true;

  // ポップアップからのメッセージ（指示）を受け取る
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'addTimer') {
      createTimer(request.timerType, request.minutes);
      sendResponse({ status: "ok" });
    }
  });

  // タイマーを画面に生成する関数
  function createTimer(type, initialMinutes) {
    const container = document.createElement('div');
    container.className = 'giga-timer-container size-medium';
    
    // 複数のタイマーを出した時に重ならないよう、位置を少しずつズラす
    const existingTimers = document.querySelectorAll('.giga-timer-container').length;
    container.style.top = `${20 + (existingTimers * 40)}px`;
    container.style.left = `${20 + (existingTimers * 40)}px`;

    let timeRemaining = type === 'countdown' ? initialMinutes * 60 : 0;
    let timerInterval = null;
    let isRunning = false;

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

    // 時間の表示を更新
    function updateDisplay() {
      display.textContent = formatTime(timeRemaining);
      if (type === 'countdown' && timeRemaining <= 0) {
        display.classList.add('time-up');
        stopTimer();
      } else {
        display.classList.remove('time-up');
      }
    }

    // 秒を「分:秒」に変換
    function formatTime(seconds) {
      const m = Math.floor(Math.abs(seconds) / 60);
      const s = Math.abs(seconds) % 60;
      const sign = seconds < 0 ? "-" : "";
      return `${sign}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // タイマー開始
    function startTimer() {
      if (isRunning) return;
      if (type === 'countdown' && timeRemaining <= 0) return;

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
      timeRemaining = type === 'countdown' ? initialMinutes * 60 : 0;
      updateDisplay();
    });

    closeBtn.addEventListener('click', () => {
      stopTimer();
      container.remove();
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

    // ドラッグ＆ドロップで自由に移動できる仕組み
    let isDragging = false;
    let initialX, initialY, currentX, currentY;

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
      initialX = e.clientX - container.offsetLeft;
      initialY = e.clientY - container.offsetTop;
      if (e.target === header || header.contains(e.target)) {
        isDragging = true;
      }
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        container.style.left = currentX + 'px';
        container.style.top = currentY + 'px';
      }
    }

    function dragEnd() {
      isDragging = false;
    }
  }
}
