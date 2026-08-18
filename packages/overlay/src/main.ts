import { app, BrowserWindow, globalShortcut, screen } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectGameState } from "@ai-coach/collector";
import { CoachEngine } from "@ai-coach/core";
import type { CoachUpdate } from "./types.js";

const POLL_INTERVAL_MS = 3000;
const WINDOW_WIDTH = 300;
const WINDOW_HEIGHT = 230;
const DISCONNECTED_HIDE_DELAY_MS = 3000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const evaluator = new CoachEngine();

let mainWindow: BrowserWindow | null = null;
let wasConnected = false;
let lastUpdate: CoachUpdate = { connected: false, player: null, recommendation: null };

function createWindow(): void {
  const { workArea } = screen.getPrimaryDisplay();

  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: workArea.x + workArea.width - WINDOW_WIDTH - 20,
    y: workArea.y + 20,
    show: false,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setIgnoreMouseEvents(true);
  mainWindow.setFocusable(false);
  mainWindow.setAlwaysOnTop(true, "screen-saver");

  mainWindow.webContents.on("did-finish-load", () => {
    sendUpdate(lastUpdate);
  });

  void mainWindow.loadFile(path.join(__dirname, "../src/renderer/index.html"));
}

function sendUpdate(update: CoachUpdate): void {
  lastUpdate = update;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("coach:update", update);
  }
}

function showDisconnected(): void {
  wasConnected = false;
  sendUpdate({ connected: false, player: null, recommendation: null });
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.hide();
      }
    }, DISCONNECTED_HIDE_DELAY_MS);
  }
}

async function poll(): Promise<void> {
  try {
    const state = await collectGameState();
    wasConnected = true;
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
    }
    sendUpdate({
      connected: true,
      player: state.player,
      recommendation: evaluator.evaluate(state),
    });
  } catch {
    if (wasConnected) {
      showDisconnected();
    }
  }
}

app.whenReady().then(() => {
  createWindow();
  void poll();
  setInterval(poll, POLL_INTERVAL_MS);
  globalShortcut.register("CommandOrControl+Shift+X", () => app.quit());
});

app.on("window-all-closed", () => app.quit());
