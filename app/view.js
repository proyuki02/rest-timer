const { ipcRenderer } = require("electron");

// main.jsからの通知で起動
ipcRenderer.on("clock", function(event, rest) {
  updateDigitalClock(rest);
});

function fillZero(num) {
  return ("00" + num).slice(-2);
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
  } else {
    const restDate = new Date(rest * 1000);
    const hh = fillZero(restDate.getUTCHours());
    const mm = fillZero(restDate.getUTCMinutes());
    const ss = fillZero(restDate.getUTCSeconds());
    text = `REST ${hh}:${mm}:${ss}`;
  }
  document.getElementById("digital_clock").innerHTML = text;
}
