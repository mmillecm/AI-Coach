import type { CoachRecommendation, PlayerState } from "@ai-coach/core";

export interface CoachUpdate {
  connected: boolean;
  player: PlayerState | null;
  recommendation: CoachRecommendation | null;
}
