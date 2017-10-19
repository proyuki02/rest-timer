const electron = require("electron");
const { app, BrowserWindow, Menu, Tray, nativeImage, remote } = electron;
const storage = require('electron-json-storage');
let mainWindow = null;
let trayIcon = null;
let fullFlag = false;
let showFlag = false;

function getRest() {
  const now = new Date();

  let hh, mm;
  if (now.getHours() < 12) {
    hh = 2;
    mm = 30;
  } else {
    hh = 22;
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
  mainWindow.unmaximize();
  mainWindow.setAlwaysOnTop(false);
}

function clock() {
  if (mainWindow !== null) {
    const rest = getRest();

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

    // 画面側に通知
    mainWindow.webContents.send("clock", rest);
  }

  // 次の「0ミリ秒」に実行されるよう、次の描画処理を予約
  var delay = 1000 - new Date().getMilliseconds();
  setTimeout(clock, delay);
}

app.on("window-all-closed", function() {
  if (process.platform != "darwin") {
    app.quit();
  }
});

app.on("ready", function() {
  mainWindow = new BrowserWindow({
    // ウィンドウ作成時のオプション
    width: 1800,
    height: 500,
    // ウィンドウの背景を透過
    transparent: true,
    // 枠の無いウィンドウ
    frame: false,
    // ウィンドウのリサイズを禁止
    resizable: false,
    // タスクバーに表示しない
    skipTaskbar: true,
    // アプリ起動時にウィンドウを表示しない
    // show: false
  });
  mainWindow.on("closed", function() {
    mainWindow = null;
  });

  // index.html を開く
  mainWindow.loadURL("file://" + __dirname + "/index.html");

  // ウィンドウ位置を復元
  storage.get('config.json', function(error, data) {
    console.log(data);
    if (!error && data.windowPosition) {
      const pos = JSON.parse(data.windowPosition);
      mainWindow.setPosition(pos[0], pos[1]);
    }
  });
  mainWindow.on("close", function() {
    const data = {
      windowPosition: JSON.stringify(mainWindow.getPosition())
    };
    storage.set("config.json", data, function(error) {});
  });

  // タスクトレイに格納
  trayIcon = new Tray(nativeImage.createFromPath(__dirname + "/icon.png"));

  // タスクトレイに右クリックメニューを追加
  const contextMenu = Menu.buildFromTemplate([
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
  trayIcon.setContextMenu(contextMenu);

  // タスクトレイのツールチップ
  trayIcon.setToolTip("Rest Timer");

  // タスクトレイクリック
  trayIcon.on("click", function() {
    show();
  });

  // タスクトレイダブルクリック
  trayIcon.on("double-click", function() {
    reset();
  });

  // 監視スタート
  clock();
});
