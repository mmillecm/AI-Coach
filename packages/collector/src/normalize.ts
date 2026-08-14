import type { GameState, ObjectiveState, ObjectiveType, PlayerState, Team } from "@ai-coach/core";
import { nextSpawnSeconds } from "@ai-coach/core";
import type { ActivePlayer, EventData, GameStats, PlayerListEntry } from "./liveClient.js";

const OBJECTIVE_EVENT_NAME: Record<ObjectiveType, string> = {
  dragon: "DragonKill",
  baron: "BaronKill",
  herald: "HeraldKill",
};

export function normalizeGameState(
  gameStats: GameStats,
  activePlayer: ActivePlayer,
  playerList: PlayerListEntry[],
  eventData: EventData,
): GameState {
  const playerListByIdentity = new Map(
    playerList.map((entry) => [entry.summonerName, entry]),
  );

  const playerEntry = playerListByIdentity.get(activePlayer.summonerName);
  if (!playerEntry) {
    throw new Error(`Active player "${activePlayer.summonerName}" not found in player list`);
  }

  const allPlayers = playerList.map((entry) =>
    toPlayerState(entry, entry.summonerName === activePlayer.summonerName ? activePlayer : undefined),
  );

  const allies = allPlayers.filter(
    (p) => p.team === playerEntry.team && p.summonerName !== activePlayer.summonerName,
  );
  const enemies = allPlayers.filter((p) => p.team !== playerEntry.team);
  const player = toPlayerState(playerEntry, activePlayer);

  return {
    gameTime: gameStats.gameTime,
    gameMode: gameStats.gameMode,
    mapName: gameStats.mapName,
    player,
    allies,
    enemies,
    objectives: toObjectives(eventData),
  };
}

function toObjectives(eventData: EventData): ObjectiveState[] {
  const types: ObjectiveType[] = ["dragon", "baron", "herald"];
  return types
    .map((type) => {
      const eventName = OBJECTIVE_EVENT_NAME[type];
      const lastKill = eventData.Events.filter((event) => event.EventName === eventName)
        .map((event) => event.EventTime)
        .reduce((max, time) => Math.max(max, time), -1);
      return {
        type,
        nextSpawnSeconds: nextSpawnSeconds(type, lastKill === -1 ? null : lastKill),
      };
    })
    .filter((objective) => objective.nextSpawnSeconds !== null);
}

function toPlayerState(entry: PlayerListEntry, active?: ActivePlayer): PlayerState {
  return {
    summonerName: entry.summonerName,
    championName: entry.championName,
    team: entry.team as Team,
    position: entry.position,
    isDead: entry.isDead,
    level: active?.level ?? entry.level,
    currentHealth: active?.championStats.currentHealth ?? 0,
    maxHealth: active?.championStats.maxHealth ?? 0,
    currentResource: active?.championStats.resourceValue ?? 0,
    maxResource: active?.championStats.resourceMax ?? 0,
    resourceType: active?.championStats.resourceType ?? "NONE",
    currentGold: active?.currentGold ?? 0,
    totalGold: active?.totalGold ?? 0,
    kills: entry.scores.kills,
    deaths: entry.scores.deaths,
    assists: entry.scores.assists,
    creepScore: entry.scores.creepScore,
    items: entry.items.map((item) => item.itemID),
  };
}
