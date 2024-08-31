const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const path = require("node:path");
const fs = require("fs");
const axios = require("axios");
const packageJson = require("./package.json");
const semver = require("semver");

const REPO_OWNER = "beqare";
const REPO_NAME = "beShare";
const CURRENT_VERSION = packageJson.version;

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

  const menuTemplate = [
    {
      label: "Check for Updates...",
      click() {
        checkForUpdates();
      },
    },
    {
      label: "Repository",
      click() {
        shell.openExternal("https://github.com/beqare/beShare");
      },
    },
    {
      label: "Discord",
      click() {
        shell.openExternal("https://beqare.de/discord");
      },
    },
    {
      label: "Reload",
      submenu: [
        {
          label: "Web",
          click() {
            const currentWindow = BrowserWindow.getFocusedWindow();
            if (currentWindow) {
              currentWindow.reload();
            }
          },
        },
        {
          label: "Client",
          click() {
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

app.on("ready", () => {
  createWindow();
});

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
