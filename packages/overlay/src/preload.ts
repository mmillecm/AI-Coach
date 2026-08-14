import { contextBridge, ipcRenderer } from "electron";
import type { RecallRecommendation } from "@ai-coach/core";

contextBridge.exposeInMainWorld("coach", {
  onRecommendation: (callback: (rec: RecallRecommendation | null) => void) => {
    ipcRenderer.on("coach:recommendation", (_event, rec: RecallRecommendation | null) => {
      callback(rec);
    });
  },
});