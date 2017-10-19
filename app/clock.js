const { remote } = require("electron");
const calc = remote.require("./calc");

// ウィンドウを開く
openWindow();

// 時計の描画処理をスタート
clock();

function openWindow() {
  // ウィンドウのオブジェクトを取得
  const win = remote.getCurrentWindow();

  // ウィンドウ位置を復元
  if (localStorage.getItem("windowPosition")) {
    const pos = JSON.parse(localStorage.getItem("windowPosition"));
    win.setPosition(pos[0], pos[1]);
  }

  // クローズ時にウィンドウ位置を保存
  win.on("close", function() {
    localStorage.setItem("windowPosition", JSON.stringify(win.getPosition()));
  });
}

function clock() {
  // デジタル時計を更新
  updateDigitalClock();

  // 次の「0ミリ秒」に実行されるよう、次の描画処理を予約
  const delay = 1000 - new Date().getMilliseconds();
  setTimeout(clock, delay);
}

// 0埋め
function fillZero(num) {
  return ("00" + num).slice(-2);
}

function updateDigitalClock() {
  const rest = calc.getRest();

  // 背景色
  if (rest < 1 * 60) {
    document.body.className = "alert";
  } else if (rest < 3 * 60) {
    document.body.className = "warn";
  }

  // 表示する文字
  let text;
  if (rest < 0) {
    text = "TIME OVER";
  } else {
    const restDate = new Date(rest * 1000);
    const hh = fillZero(restDate.getUTCHours());
    const mm = fillZero(restDate.getUTCMinutes());
    const ss = fillZero(restDate.getUTCSeconds());
    text = `REST ${hh}:${mm}:${ss}`;
  }
  document.getElementById("digital_clock").innerHTML = text;
}
