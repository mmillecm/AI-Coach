export type Team = "ORDER" | "CHAOS";

export interface PlayerState {
  summonerName: string;
  championName: string;
  team: Team;
  position: string;
  isDead: boolean;
  level: number;
  currentHealth: number;
  maxHealth: number;
  currentResource: number;
  maxResource: number;
  resourceType: string;
  currentGold: number;
  totalGold: number;
  kills: number;
  deaths: number;
  assists: number;
  creepScore: number;
  items: number[];
  healthRegenRate: number;
  trinketType: "totem" | "farsight" | "lens" | null;
}

export type ObjectiveType = "dragon" | "baron" | "herald";

export interface ObjectiveState {
  type: ObjectiveType;
  nextSpawnSeconds: number | null;
}

export interface GameState {
  gameTime: number;
  gameMode: string;
  mapName: string;
  player: PlayerState;
  allies: PlayerState[];
  enemies: PlayerState[];
  objectives: ObjectiveState[];
}
