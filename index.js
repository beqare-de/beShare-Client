const { app, BrowserWindow } = require("electron");
const path = require("node:path");
const fs = require("fs");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    minWidth: 800,
    height: 600,
    minHeight: 600,
    backgroundColor: "#000",
    center: true,
    autoHideMenuBar: true,
    title: "beShare",
    show: true,
    frame: true,
    fullscreen: false,
    icon: path.join(__dirname, "icon.png"),
  });

  win.loadURL("https://beqare.de/share");

  win.webContents.on("did-finish-load", () => {
    try {
      const cssPath = path.join(__dirname, "override.css");
      if (fs.existsSync(cssPath)) {
        const css = fs.readFileSync(cssPath, "utf8");
        win.webContents.insertCSS(css);
      } else {
        console.warn("CSS file not found:", cssPath);
      }

      const jsPath = path.join(__dirname, "override.js");
      if (fs.existsSync(jsPath)) {
        const js = fs.readFileSync(jsPath, "utf8");
        win.webContents.executeJavaScript(js);
      } else {
        console.warn("JS file not found:", jsPath);
      }
    } catch (error) {
      console.error("Error loading resources:", error);
    }
  });
}

app.whenReady().then(() => {
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
