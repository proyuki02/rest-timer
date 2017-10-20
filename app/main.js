const electron = require("electron");
const { app, BrowserWindow, Menu, Tray, nativeImage, remote } = electron;
const storage = require("electron-json-storage-sync");
let mainWindow = null;
let trayIcon = null;
let fullFlag = false;
let showFlag = false;

function getRest() {
  const now = new Date();

  let hh, mm;
  if (now.getHours() < 12) {
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
  mainWindow.setAlwaysOnTop(false);
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
  var delay = 1000 - new Date().getMilliseconds();
  setTimeout(clock, delay);
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
        mainWindow.hide();
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

function positionSetting(win) {
  const result = storage.get("config");
  console.log(result);
  if (result.status && result.data.windowPosition) {
    const pos = JSON.parse(result.data.windowPosition);
    win.setPosition(pos[0], pos[1]);
  }
  win.on("move", function() {
    const data = {
      windowPosition: JSON.stringify(win.getPosition())
    };
    storage.set("config", data);
  });
}

app.on("window-all-closed", function() {
  if (process.platform != "darwin") {
    app.quit();
  }
});

app.on("ready", function() {
  mainWindow = new BrowserWindow({
    width: 180,
    height: 50,
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
    show();
  });
  trayIcon.on("double-click", function() {
    reset();
  });

  // 監視スタート
  clock();
});
