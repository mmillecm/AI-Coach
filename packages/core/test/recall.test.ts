import { describe, expect, it } from "vitest";
import type { GameState, ObjectiveState, PlayerState } from "../src/domain.js";
import { DEFAULT_RECALL_CONFIG, RecallEvaluator } from "../src/recall.js";

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

function objectiveIn(
  type: ObjectiveState["type"],
  gameTime: number,
  timeLeft: number,
): ObjectiveState {
  return { type, nextSpawnSeconds: gameTime + timeLeft };
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

  describe("CA-RF-02 — outros motivos (mana e ouro)", () => {
    it("mana baixa → recomenda com motivo mana", () => {
      const evaluator = new RecallEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { currentResource: 100, maxResource: 500 },
        objectives: [dragonIn(500, 40)],
      });
      const rec = evaluator.evaluate(state);
      expect(rec).not.toBeNull();
      expect(rec!.reason).toContain("mana baixa");
    });

    it("ouro ≥ limiar → recomenda com motivo ouro", () => {
      const evaluator = new RecallEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { currentGold: 1500 },
        objectives: [dragonIn(500, 40)],
      });
      const rec = evaluator.evaluate(state);
      expect(rec).not.toBeNull();
      expect(rec!.reason).toContain("ouro para compra");
    });

    it("vários motivos juntos são listados", () => {
      const evaluator = new RecallEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { currentHealth: 300, maxHealth: 1000, currentResource: 100, maxResource: 500, currentGold: 1500 },
        objectives: [dragonIn(500, 40)],
      });
      const rec = evaluator.evaluate(state);
      expect(rec).not.toBeNull();
      expect(rec!.reason).toContain("HP baixo");
      expect(rec!.reason).toContain("mana baixa");
      expect(rec!.reason).toContain("ouro para compra");
    });
  });

  describe("RF-03 — múltiplos objetivos", () => {
    it("escolhe o objetivo mais próximo (menor tempo)", () => {
      const evaluator = new RecallEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { currentHealth: 500, maxHealth: 1000 },
        objectives: [objectiveIn("baron", 500, 80), objectiveIn("dragon", 500, 30)],
      });
      const rec = evaluator.evaluate(state);
      expect(rec).not.toBeNull();
      expect(rec!.title).toContain("Dragão");
    });

    it("objetivo sem spawn (null) é ignorado", () => {
      const evaluator = new RecallEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { currentHealth: 500, maxHealth: 1000 },
        objectives: [{ type: "dragon", nextSpawnSeconds: null }, dragonIn(500, 40)],
      });
      const rec = evaluator.evaluate(state);
      expect(rec).not.toBeNull();
      expect(rec!.title).toContain("Dragão");
    });
  });

  describe("edge cases — divisão por zero", () => {
    it("maxHealth 0 não quebra (HP tratado como 0%)", () => {
      const evaluator = new RecallEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { currentHealth: 0, maxHealth: 0 },
        objectives: [dragonIn(500, 40)],
      });
      const rec = evaluator.evaluate(state);
      expect(rec).not.toBeNull();
      expect(rec!.reason).toContain("HP baixo");
    });

    it("maxResource 0 não quebra (recurso tratado como 0%)", () => {
      const evaluator = new RecallEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { currentResource: 0, maxResource: 0 },
        objectives: [dragonIn(500, 40)],
      });
      const rec = evaluator.evaluate(state);
      expect(rec).not.toBeNull();
      expect(rec!.reason).toContain("mana baixa");
    });
  });

  describe("RF-04 — expiração", () => {
    it("expiresAt = createdAt + activeDuration", () => {
      const evaluator = new RecallEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { currentHealth: 500, maxHealth: 1000 },
        objectives: [dragonIn(500, 40)],
      });
      const rec = evaluator.evaluate(state)!;
      expect(rec.expiresAt).toBe(rec.createdAt + 20);
    });
  });

  describe("RNF-02 — configuração customizada", () => {
    it("respeita limiares customizados", () => {
      const evaluator = new RecallEvaluator({ ...DEFAULT_RECALL_CONFIG, minHpPercent: 80 });
      const state = makeState({
        gameTime: 500,
        player: { currentHealth: 750, maxHealth: 1000 }, // 75% < 80% → não pronto
        objectives: [dragonIn(500, 40)],
      });
      const rec = evaluator.evaluate(state);
      expect(rec).not.toBeNull();
      expect(rec!.reason).toContain("HP baixo");
    });

    it("com limiar mais alto, HP 75% é considerado pronto", () => {
      const evaluator = new RecallEvaluator({ ...DEFAULT_RECALL_CONFIG, minHpPercent: 60 });
      const state = makeState({
        gameTime: 500,
        player: { currentHealth: 750, maxHealth: 1000 }, // 75% > 60% → pronto
        objectives: [dragonIn(500, 40)],
      });
      expect(evaluator.evaluate(state)).toBeNull();
    });
  });
});