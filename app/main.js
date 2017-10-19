const electron = require("electron");
const { app, BrowserWindow, Menu, Tray, nativeImage, remote } = electron;
const calc = require("./calc");
let mainWindow = null;
let trayIcon = null;
let fullFlag = false;
let showFlag = false;

function clock() {
  const rest = calc.getRest();

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

  // 次の「0ミリ秒」に実行されるよう、次の描画処理を予約
  var delay = 1000 - new Date().getMilliseconds();
  setTimeout(clock, delay);
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
  mainWindow.setAlwaysOnTop(false);
}

app.on("window-all-closed", function() {
  if (process.platform != "darwin") {
    app.quit();
  }
});

app.on("ready", function() {
  mainWindow = new BrowserWindow({
    // ウィンドウ作成時のオプション
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

  // index.html を開く
  mainWindow.loadURL("file://" + __dirname + "/index.html");

  mainWindow.on("closed", function() {
    mainWindow = null;
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

  // タスクトレイのツールチップをアプリ名に
  trayIcon.setToolTip("Rest Timer");

  // タスクトレイクリックでウィンドウをアクティブ
  trayIcon.on("click", function() {
    show();
  });
  // タスクトレイダブルクリックでリセット
  trayIcon.on("double-click", function() {
    reset();
  });

  // 監視スタート
  clock();
});
