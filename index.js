const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const path = require("node:path");
const fs = require("fs");
const axios = require("axios");
const packageJson = require("./package.json");
const semver = require("semver");

const REPO_OWNER = "beqare";
const REPO_NAME = "beShare";
const CURRENT_VERSION = packageJson.version;
const CSS_PATH = path.join(__dirname, "override.css");
const JS_PATH = path.join(__dirname, "override.js");
const ICON_PATH = path.join(__dirname, "icon.png");

async function checkForUpdates() {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`
    );
    const latestRelease = response.data;
    const latestVersion = latestRelease.tag_name.replace(/^v/, "");

    if (semver.gt(latestVersion, CURRENT_VERSION)) {
      const result = await dialog.showMessageBox({
        type: "info",
        title: "Update Available",
        message: `A new version (${latestVersion}) is available. You are currently on ${CURRENT_VERSION}.`,
        buttons: ["OK", "Download Update"],
      });

      if (result.response === 1) {
        shell.openExternal(latestRelease.html_url);
      }
    } else {
      await dialog.showMessageBox({
        type: "info",
        title: "No Updates",
        message: "You are on the latest version.",
        buttons: ["OK"],
      });
    }
  } catch (error) {
    console.error("Error checking for updates:", error);
    await dialog.showMessageBox({
      type: "error",
      title: "Update Check Failed",
      message: "Failed to check for updates. Please try again later.",
      buttons: ["OK"],
    });
  }
}

function loadResources(win) {
  try {
    if (fs.existsSync(CSS_PATH)) {
      const css = fs.readFileSync(CSS_PATH, "utf8");
      win.webContents.insertCSS(css);
    } else {
      console.warn("CSS file not found:", CSS_PATH);
    }

    if (fs.existsSync(JS_PATH)) {
      const js = fs.readFileSync(JS_PATH, "utf8");
      win.webContents.executeJavaScript(js);
    } else {
      console.warn("JS file not found:", JS_PATH);
    }
  } catch (error) {
    console.error("Error loading resources:", error);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    minWidth: 800,
    height: 600,
    minHeight: 600,
    backgroundColor: "#000",
    center: true,
    autoHideMenuBar: false,
    title: "beShare",
    show: true,
    frame: true,
    fullscreen: false,
    icon: ICON_PATH,
  });

  win.loadURL("https://beqare.de/share");

  win.webContents.on("did-finish-load", () => {
    loadResources(win);
  });

  const menuTemplate = [
    {
      label: "Check for Updates...",
      click: checkForUpdates,
    },
    {
      label: "Repository",
      click: () => shell.openExternal("https://github.com/beqare/beShare"),
    },
    {
      label: "Discord",
      click: () => shell.openExternal("https://beqare.de/discord"),
    },
    {
      label: "Reload",
      submenu: [
        {
          label: "Web",
          click: () => BrowserWindow.getFocusedWindow()?.reload(),
        },
        {
          label: "Client",
          click: () => {
            app.relaunch();
            app.exit(0);
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
