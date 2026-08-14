import type { ObjectiveType } from "./domain.js";

export interface ObjectiveSpawnConfig {
  firstSpawnSeconds: number;
  respawnAfterKillSeconds: number | null;
}

export const DEFAULT_OBJECTIVE_SPAWN_CONFIG: Record<ObjectiveType, ObjectiveSpawnConfig> = {
  dragon: { firstSpawnSeconds: 300, respawnAfterKillSeconds: 300 },
  baron: { firstSpawnSeconds: 1200, respawnAfterKillSeconds: 360 },
  herald: { firstSpawnSeconds: 900, respawnAfterKillSeconds: null },
};

export function nextSpawnSeconds(
  type: ObjectiveType,
  lastKillSeconds: number | null,
  config: ObjectiveSpawnConfig = DEFAULT_OBJECTIVE_SPAWN_CONFIG[type],
): number | null {
  if (lastKillSeconds === null) {
    return config.firstSpawnSeconds;
  }
  if (config.respawnAfterKillSeconds === null) {
    return null;
  }
  return Math.max(config.firstSpawnSeconds, lastKillSeconds + config.respawnAfterKillSeconds);
}