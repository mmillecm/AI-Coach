import type { PlayerState, RecallRecommendation } from "@ai-coach/core";

export interface CoachUpdate {
  connected: boolean;
  player: PlayerState | null;
  recommendation: RecallRecommendation | null;
}
