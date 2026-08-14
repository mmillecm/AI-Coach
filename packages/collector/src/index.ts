import type { GameState } from "@ai-coach/core";
import { getActivePlayer, getEventData, getGameStats, getPlayerList } from "./liveClient.js";
import { normalizeGameState } from "./normalize.js";

export async function collectGameState(): Promise<GameState> {
  const [gameStats, activePlayer, playerList, eventData] = await Promise.all([
    getGameStats(),
    getActivePlayer(),
    getPlayerList(),
    getEventData(),
  ]);

  return normalizeGameState(gameStats, activePlayer, playerList, eventData);
}

export { normalizeGameState } from "./normalize.js";
export type { ActivePlayer, EventData, GameEvent, GameStats, PlayerListEntry } from "./liveClient.js";