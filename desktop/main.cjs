const { app, BrowserWindow, Menu, nativeImage, shell } = require("electron");
const path = require("path");

const APP_URL = process.env.MDGP_URL || "https://edwin-ai-todo.vercel.app/?space=space-cvo8djdjx8";

function createWindow() {
  const iconPath = path.join(__dirname, "assets", "icon.icns");
  const icon = nativeImage.createFromPath(iconPath);

  const mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    backgroundColor: "#050813",
    height: 920,
    icon: icon.isEmpty() ? undefined : icon,
    minHeight: 760,
    minWidth: 1180,
    show: false,
    title: "My Day Guide Pro",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: {
      x: 18,
      y: 18,
    },
    width: 1480,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const allowedOrigin = new URL(APP_URL).origin;
    if (!url.startsWith(allowedOrigin)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.loadURL(APP_URL);

  return mainWindow;
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
