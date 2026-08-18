import { describe, expect, it } from "vitest";
import type { GameState, ObjectiveState, PlayerState } from "../src/domain.js";
import { CoachEngine } from "../src/engine.js";

function makePlayer(partial: Partial<PlayerState> = {}): PlayerState {
  return {
    summonerName: "Player",
    championName: "Yasuo",
    team: "ORDER",
    position: "MIDDLE",
    isDead: false,
    level: 10,
    currentHealth: 1000,
    maxHealth: 1000,
    currentResource: 500,
    maxResource: 500,
    resourceType: "MANA",
    currentGold: 0,
    totalGold: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    creepScore: 0,
    items: [],
    healthRegenRate: 0,
    trinketType: "totem",
    ...partial,
  };
}

function makeState(
  partial: { gameTime?: number; player?: Partial<PlayerState>; objectives?: ObjectiveState[] } = {},
): GameState {
  return {
    gameTime: partial.gameTime ?? 0,
    gameMode: "CLASSIC",
    mapName: "Map11",
    player: makePlayer(partial.player),
    allies: [],
    enemies: [],
    objectives: partial.objectives ?? [],
  };
}

function objectiveIn(
  type: ObjectiveState["type"],
  gameTime: number,
  timeLeft: number,
): ObjectiveState {
  return { type, nextSpawnSeconds: gameTime + timeLeft };
}

describe("CoachEngine", () => {
  it("só recall (sem trinket) → retorna RECALL", () => {
    const engine = new CoachEngine();
    const state = makeState({
      gameTime: 500,
      player: { currentHealth: 500, maxHealth: 1000, trinketType: null },
      objectives: [objectiveIn("dragon", 500, 40)],
    });
    expect(engine.evaluate(state)!.type).toBe("RECALL");
  });

  it("só vision (jogador pronto) → retorna VISION", () => {
    const engine = new CoachEngine();
    const state = makeState({
      gameTime: 500,
      player: { currentHealth: 900, maxHealth: 1000, currentGold: 500 },
      objectives: [objectiveIn("dragon", 500, 40)],
    });
    expect(engine.evaluate(state)!.type).toBe("VISION");
  });

  it("empate de prioridade (high) → RECALL vence", () => {
    const engine = new CoachEngine();
    const state = makeState({
      gameTime: 500,
      player: { currentHealth: 500, maxHealth: 1000 },
      objectives: [objectiveIn("dragon", 500, 40)],
    });
    expect(engine.evaluate(state)!.type).toBe("RECALL");
  });

  it("vision critical vence recall high", () => {
    const engine = new CoachEngine();
    const state = makeState({
      gameTime: 500,
      player: { currentHealth: 500, maxHealth: 1000 },
      objectives: [objectiveIn("dragon", 500, 15)],
    });
    const rec = engine.evaluate(state)!;
    expect(rec.type).toBe("VISION");
    expect(rec.priority).toBe("critical");
  });

  it("ambos sem recomendação → null", () => {
    const engine = new CoachEngine();
    const state = makeState({
      gameTime: 500,
      player: { currentHealth: 900, maxHealth: 1000, trinketType: null },
    });
    expect(engine.evaluate(state)).toBeNull();
  });

  it("regressão: recall com motivo ouro continua funcionando via engine", () => {
    const engine = new CoachEngine();
    const state = makeState({
      gameTime: 500,
      player: { currentHealth: 900, maxHealth: 1000, currentGold: 1500, trinketType: null },
      objectives: [objectiveIn("dragon", 500, 40)],
    });
    const rec = engine.evaluate(state)!;
    expect(rec.type).toBe("RECALL");
    expect(rec.reason).toContain("ouro para compra");
  });
});