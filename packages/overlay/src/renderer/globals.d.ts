import type { CoachUpdate } from "../types.js";

declare global {
  interface Window {
    coach: {
      onUpdate: (callback: (update: CoachUpdate) => void) => void;
    };
  }
}

export {};
