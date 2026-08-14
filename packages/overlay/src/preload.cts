import { contextBridge, ipcRenderer } from "electron";
import type { CoachUpdate } from "./types.js";

contextBridge.exposeInMainWorld("coach", {
  onUpdate: (callback: (update: CoachUpdate) => void) => {
    ipcRenderer.on("coach:update", (_event, update: CoachUpdate) => {
      callback(update);
    });
  },
});
