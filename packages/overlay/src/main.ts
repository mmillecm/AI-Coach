import { app, BrowserWindow, globalShortcut, screen } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectGameState } from "@ai-coach/collector";
import { RecallEvaluator, type RecallRecommendation } from "@ai-coach/core";

const POLL_INTERVAL_MS = 3000;
const WINDOW_WIDTH = 380;
const WINDOW_HEIGHT = 120;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const evaluator = new RecallEvaluator();

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const { workArea } = screen.getPrimaryDisplay();

  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: workArea.x + workArea.width - WINDOW_WIDTH - 20,
    y: workArea.y + 20,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setIgnoreMouseEvents(true);
  mainWindow.setFocusable(false);
  void mainWindow.loadFile(path.join(__dirname, "../src/renderer/index.html"));
}

function sendRecommendation(recommendation: RecallRecommendation | null): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("coach:recommendation", recommendation);
  }
}

async function poll(): Promise<void> {
  try {
    const state = await collectGameState();
    sendRecommendation(evaluator.evaluate(state));
  } catch {
    sendRecommendation(null);
  }
}

app.whenReady().then(() => {
  createWindow();
  setInterval(poll, POLL_INTERVAL_MS);
  globalShortcut.register("CommandOrControl+Shift+X", () => app.quit());
});

app.on("window-all-closed", () => app.quit());