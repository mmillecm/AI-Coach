export const version = "0.1.0";

export type { GameState, PlayerState, Team, ObjectiveState, ObjectiveType } from "./domain.js";
export { DEFAULT_OBJECTIVE_SPAWN_CONFIG, nextSpawnSeconds } from "./spawn.js";
export type { ObjectiveSpawnConfig } from "./spawn.js";
export { DEFAULT_RECALL_CONFIG, RecallEvaluator } from "./recall.js";
export type { RecallConfig, RecallPriority, RecallRecommendation } from "./recall.js";
export { DEFAULT_VISION_CONFIG, VisionEvaluator } from "./vision.js";
export type { VisionConfig, VisionPriority, VisionRecommendation } from "./vision.js";
export { CoachEngine } from "./engine.js";
export type { CoachConfig, CoachRecommendation } from "./engine.js";