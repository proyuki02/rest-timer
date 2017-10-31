const electron = require("electron");
const { app, BrowserWindow, Menu, Tray, nativeImage, remote } = electron;
const storage = require("electron-json-storage-sync");
const winWidth = 180;
const winHeight = 50;
let mainWindow = null;
let trayIcon = null;
let fullFlag = false;
let showFlag = false;
let morningFlag = false;
let isShowing = false;

setMorningFlag();

function setMorningFlag() {
  morningFlag = new Date().getHours() < 12;
}

function getRest() {
  const now = new Date();

  let hh, mm;
  if (morningFlag) {
    hh = 12;
    mm = 0;
  } else {
    hh = 17;
    mm = 30;
  }

  const restMSec =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hh,
      mm
    ).getTime() - now.getTime();
  const restMin = restMSec / 1000;
  return restMin;
}

function show() {
  mainWindow.show();
  mainWindow.focus();
  isShowing = true;
}

function hide() {
  mainWindow.hide();
  isShowing = false;
}

function full() {
  mainWindow.show();
  mainWindow.focus();
  mainWindow.maximize();
}

function reset() {
  fullFlag = false;
  showFlag = false;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  }
  mainWindow.setSize(winWidth, winHeight);
  mainWindow.setAlwaysOnTop(false);
  loadPosition(mainWindow);
  setMorningFlag();
}

function clock() {
  if (mainWindow !== null) {
    let rest = getRest();

    // 残り3分になったら
    if (rest < 3 * 60 && !showFlag) {
      show();
      mainWindow.setAlwaysOnTop(true);
      showFlag = true;
    }
    // 時間切れになったら
    if (rest < 0 && !fullFlag) {
      full();
      fullFlag = true;
    }

    // リセットされるまでマイナスを通知する
    if (fullFlag) {
      rest = -1;
    }

    // 画面側に通知
    mainWindow.webContents.send("clock", rest);
  }

  // 次の描画処理を予約
  setTimeout(clock, 1000);
}

function getContextMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: "表示する",
      click: function() {
        show();
      }
    },
    {
      label: "隠す",
      click: function() {
        hide();
      }
    },
    {
      label: "リセット",
      click: function() {
        reset();
      }
    },
    {
      label: "終了する",
      click: function() {
        mainWindow.close();
      }
    }
  ]);
  return menu;
}

function loadPosition(win) {
  const result = storage.get("config");
  if (result.status && result.data.windowPosition) {
    const pos = JSON.parse(result.data.windowPosition);
    win.setPosition(pos[0], pos[1]);
  }
}

function positionSetting(win) {
  loadPosition(win);
  win.on("move", function() {
    const pos = win.getPosition();
    if (pos[0] !== 0 && pos[1] !== 0) {
      const data = {
        windowPosition: JSON.stringify(pos)
      };
      storage.set("config", data);
    }
  });
}

app.on("window-all-closed", function() {
  if (process.platform != "darwin") {
    app.quit();
  }
});

app.on("ready", function() {
  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    // ウィンドウの背景を透過
    transparent: true,
    // 枠の無いウィンドウ
    frame: false,
    // ウィンドウのリサイズを禁止
    resizable: false,
    // タスクバーに表示しない
    skipTaskbar: true,
    // アプリ起動時にウィンドウを表示しない
    show: false
  });
  mainWindow.on("closed", function() {
    mainWindow = null;
  });
  mainWindow.loadURL("file://" + __dirname + "/index.html");

  // ウィンドウ位置の復元・保存
  positionSetting(mainWindow);

  // タスクトレイの設定
  trayIcon = new Tray(nativeImage.createFromPath(__dirname + "/icon.png"));
  trayIcon.setContextMenu(getContextMenu());
  trayIcon.setToolTip("Rest Timer");
  trayIcon.on("click", function() {
    if (isShowing) {
      hide();
    } else {
      show();
    }
  });
  trayIcon.on("double-click", function() {
    reset();
  });

  // 監視スタート
  clock();
});
