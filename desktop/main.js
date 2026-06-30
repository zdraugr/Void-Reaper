// Void Reaper — Electron main process.
//
// The game is a pure-browser canvas app. We serve it over a custom `game://` protocol
// instead of file:// for two reasons:
//   1. The SFX loader uses fetch("sfx/*.mp3"), and Chromium blocks fetch() on file://.
//      A privileged scheme with supportFetchAPI:true makes it work.
//   2. standard+secure gives a stable origin, so localStorage saves (gold/unlocks/runs)
//      persist across launches.

const { app, BrowserWindow, protocol, net, Menu } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const APP_DIR = path.join(__dirname, "app"); // populated by scripts/sync-assets.mjs

protocol.registerSchemesAsPrivileged([
  {
    scheme: "game",
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: "#0a0a18",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // F11 toggles fullscreen (Esc is used by the game itself for pause).
  win.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.key === "F11") {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });

  win.loadURL("game://app/index.html");
}

app.whenReady().then(() => {
  protocol.handle("game", (req) => {
    // game://app/<path>  ->  APP_DIR/<path>, with a traversal guard.
    const rel = decodeURIComponent(new URL(req.url).pathname);
    const fp = path.normalize(path.join(APP_DIR, rel));
    if (fp !== APP_DIR && !fp.startsWith(APP_DIR + path.sep)) {
      return new Response("forbidden", { status: 403 });
    }
    return net.fetch(pathToFileURL(fp).toString());
  });

  Menu.setApplicationMenu(null);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
