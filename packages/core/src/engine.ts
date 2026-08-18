import { RecallEvaluator } from "./recall.js";
import type { RecallConfig, RecallRecommendation } from "./recall.js";
import { DEFAULT_VISION_CONFIG, VisionEvaluator } from "./vision.js";
import type { VisionConfig, VisionRecommendation } from "./vision.js";
import type { GameState } from "./domain.js";

export type CoachRecommendation = RecallRecommendation | VisionRecommendation;

export interface CoachConfig {
  recall?: RecallConfig;
  vision?: VisionConfig;
}

const PRIORITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
};

export class CoachEngine {
  private recallEvaluator: RecallEvaluator;
  private visionEvaluator: VisionEvaluator;

  constructor(config: CoachConfig = {}) {
    this.recallEvaluator = new RecallEvaluator(config.recall);
    this.visionEvaluator = new VisionEvaluator(config.vision ?? DEFAULT_VISION_CONFIG);
  }

  evaluate(state: GameState): CoachRecommendation | null {
    const recall = this.recallEvaluator.evaluate(state);
    const vision = this.visionEvaluator.evaluate(state);

    if (!recall) {
      return vision;
    }
    if (!vision) {
      return recall;
    }
    if (PRIORITY_RANK[vision.priority] < PRIORITY_RANK[recall.priority]) {
      return vision;
    }
    return recall;
  }
}