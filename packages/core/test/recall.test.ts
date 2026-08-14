import { describe, expect, it } from "vitest";
import type { GameState, ObjectiveState, PlayerState } from "../src/domain.js";
import { RecallEvaluator } from "../src/recall.js";

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

function dragonIn(gameTime: number, timeLeft: number): ObjectiveState {
  return { type: "dragon", nextSpawnSeconds: gameTime + timeLeft };
}

describe("RecallEvaluator", () => {
  describe("CA-RF-02 — jogador pronto vs não pronto", () => {
    it("não pronto por HP baixo (50%) → recomenda com motivo HP", () => {
      const evaluator = new RecallEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { currentHealth: 500, maxHealth: 1000 },
        objectives: [dragonIn(500, 40)],
      });
      const rec = evaluator.evaluate(state);
      expect(rec).not.toBeNull();
      expect(rec!.reason).toContain("HP baixo");
    });

    it("pronto (HP 90%, mana cheia, ouro 500) → silêncio", () => {
      const evaluator = new RecallEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { currentHealth: 900, maxHealth: 1000, currentGold: 500 },
        objectives: [dragonIn(500, 40)],
      });
      expect(evaluator.evaluate(state)).toBeNull();
    });
  });

  describe("CA-RF-03 — prioridade", () => {
    it("spawn em 40s com HP 50% → high", () => {
      const evaluator = new RecallEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { currentHealth: 500, maxHealth: 1000 },
        objectives: [dragonIn(500, 40)],
      });
      expect(evaluator.evaluate(state)!.priority).toBe("high");
    });

    it("spawn em 15s com HP 25% → critical", () => {
      const evaluator = new RecallEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { currentHealth: 250, maxHealth: 1000 },
        objectives: [dragonIn(500, 15)],
      });
      expect(evaluator.evaluate(state)!.priority).toBe("critical");
    });
  });

  describe("CA-RF-04 — contexto da mensagem", () => {
    it("menciona objetivo, tempo restante e motivo", () => {
      const evaluator = new RecallEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { currentHealth: 500, maxHealth: 1000 },
        objectives: [dragonIn(500, 40)],
      });
      const rec = evaluator.evaluate(state)!;
      expect(rec.title).toContain("Dragão");
      expect(rec.message).toContain("40s");
      expect(rec.message).toContain("HP baixo");
    });
  });

  describe("CA-RF-05 — silêncio quando irrelevante", () => {
    it("spawn longe (5 min) → silêncio", () => {
      const evaluator = new RecallEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { currentHealth: 500, maxHealth: 1000 },
        objectives: [{ type: "dragon", nextSpawnSeconds: 800 }],
      });
      expect(evaluator.evaluate(state)).toBeNull();
    });

    it("jogador morto → silêncio", () => {
      const evaluator = new RecallEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { isDead: true, currentHealth: 100, maxHealth: 1000 },
        objectives: [dragonIn(500, 15)],
      });
      expect(evaluator.evaluate(state)).toBeNull();
    });

    it("sem objetivo iminente → silêncio", () => {
      const evaluator = new RecallEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { currentHealth: 500, maxHealth: 1000 },
      });
      expect(evaluator.evaluate(state)).toBeNull();
    });
  });

  describe("CA-RF-06 — anti-spam", () => {
    it("não reemite enquanto ativa ou no cooldown; emite depois", () => {
      const evaluator = new RecallEvaluator();
      const base = {
        gameTime: 500,
        player: { currentHealth: 500, maxHealth: 1000 },
        objectives: [dragonIn(500, 40)],
      };

      expect(evaluator.evaluate(makeState(base))).not.toBeNull();

      const stillActive = makeState({ ...base, gameTime: 505 });
      expect(evaluator.evaluate(stillActive)).toBeNull();

      const afterCooldown = makeState({ ...base, gameTime: 535 });
      expect(evaluator.evaluate(afterCooldown)).not.toBeNull();
    });
  });
});