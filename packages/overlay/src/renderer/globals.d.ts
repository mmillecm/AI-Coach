import type { RecallRecommendation } from "@ai-coach/core";

declare global {
  interface Window {
    coach: {
      onRecommendation: (callback: (rec: RecallRecommendation | null) => void) => void;
    };
  }
}

export {};