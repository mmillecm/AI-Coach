import https from "node:https";

const HOST = "127.0.0.1";
const PORT = 2999;
const REQUEST_TIMEOUT_MS = 3000;

function requestJson<T>(path: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      {
        hostname: HOST,
        port: PORT,
        path,
        rejectUnauthorized: false,
        timeout: REQUEST_TIMEOUT_MS,
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(body) as T);
          } catch (err) {
            reject(err);
          }
        });
      },
    );

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy(new Error(`Timeout after ${REQUEST_TIMEOUT_MS}ms`));
    });
  });
}

export interface GameStats {
  gameMode: string;
  gameTime: number;
  mapName: string;
  mapNumber: number;
  mapTerrain: string;
}

export interface ActivePlayer {
  currentGold: number;
  level: number;
  summonerName: string;
  totalGold?: number;
  championStats: {
    currentHealth: number;
    maxHealth: number;
    resourceValue: number;
    resourceMax: number;
    resourceType: string;
  };
}

export interface PlayerListEntry {
  championName: string;
  isDead: boolean;
  level: number;
  position: string;
  team: string;
  summonerName: string;
  items: { itemID: number; slot: number }[];
  scores: {
    assists: number;
    creepScore: number;
    deaths: number;
    kills: number;
  };
}

export interface GameEvent {
  EventID: number;
  EventName: string;
  EventTime: number;
}

export interface EventData {
  Events: GameEvent[];
}

export const getGameStats = () => requestJson<GameStats>("/liveclientdata/gamestats");
export const getActivePlayer = () => requestJson<ActivePlayer>("/liveclientdata/activeplayer");
export const getPlayerList = () => requestJson<PlayerListEntry[]>("/liveclientdata/playerlist");
export const getEventData = () => requestJson<EventData>("/liveclientdata/eventdata");