import type { ActivePlayer, EventData, GameStats, PlayerListEntry } from "../liveClient.js";

export const gameStatsFixture: GameStats = {
  gameMode: "PRACTICETOOL",
  gameTime: 112.7,
  mapName: "Map11",
  mapNumber: 11,
  mapTerrain: "Default",
};

export const activePlayerFixture: ActivePlayer = {
  currentGold: 1300,
  totalGold: 5600,
  level: 8,
  summonerName: "PlayerOne",
  championStats: {
    currentHealth: 850,
    maxHealth: 1200,
    healthRegenRate: 8,
    resourceValue: 200,
    resourceMax: 800,
    resourceType: "MANA",
  },
};

export const playerListFixture: PlayerListEntry[] = [
  {
    championName: "Yasuo",
    isDead: false,
    level: 8,
    position: "MIDDLE",
    team: "ORDER",
    summonerName: "PlayerOne",
    items: [
      { itemID: 1053, slot: 0 },
      { itemID: 3340, slot: 6 },
    ],
    scores: { assists: 1, creepScore: 42, deaths: 1, kills: 3 },
  },
  {
    championName: "Lulu",
    isDead: false,
    level: 7,
    position: "BOTTOM",
    team: "ORDER",
    summonerName: "SupportAlly",
    items: [{ itemID: 3340, slot: 6 }],
    scores: { assists: 4, creepScore: 8, deaths: 2, kills: 0 },
  },
  {
    championName: "Lux",
    isDead: true,
    level: 6,
    position: "NONE",
    team: "CHAOS",
    summonerName: "MidEnemy",
    items: [],
    scores: { assists: 0, creepScore: 10, deaths: 4, kills: 1 },
  },
];

export const eventDataFixture: EventData = {
  Events: [
    { EventID: 0, EventName: "GameStart", EventTime: 0 },
    { EventID: 1, EventName: "DragonKill", EventTime: 300 },
    { EventID: 2, EventName: "HeraldKill", EventTime: 700 },
  ],
};