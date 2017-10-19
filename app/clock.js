const { ipcRenderer } = require("electron");

// main.jsからの通知で起動
ipcRenderer.on("clock", function(event, arg) {
  updateDigitalClock(arg);
});

function fillZero(num) {
  return ("00" + num).slice(-2);
}

function enableDrag(flag) {
  if (flag) {
    document.body.style["-webkit-app-region"] = "drag";
  } else {
    document.body.style["-webkit-app-region"] = "no-drag";
  }
}

function updateDigitalClock(rest) {
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
    enableDrag(false);
  } else {
    const restDate = new Date(rest * 1000);
    const hh = fillZero(restDate.getUTCHours());
    const mm = fillZero(restDate.getUTCMinutes());
    const ss = fillZero(restDate.getUTCSeconds());
    text = `REST ${hh}:${mm}:${ss}`;
    enableDrag(true);
  }
  document.getElementById("digital_clock").innerHTML = text;
}
