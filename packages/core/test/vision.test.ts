import { describe, expect, it } from "vitest";
import type { GameState, ObjectiveState, PlayerState } from "../src/domain.js";
import { VisionEvaluator } from "../src/vision.js";

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

describe("VisionEvaluator", () => {
  describe("CA-V1 — lembrete de ward", () => {
    it("objetivo em ≤ 60s com trinket de ward → VISION com motivo", () => {
      const evaluator = new VisionEvaluator();
      const state = makeState({
        gameTime: 500,
        objectives: [objectiveIn("dragon", 500, 40)],
      });
      const rec = evaluator.evaluate(state);
      expect(rec).not.toBeNull();
      expect(rec!.type).toBe("VISION");
      expect(rec!.reason).toContain("coloque ward");
      expect(rec!.title).toContain("Dragão");
    });

    it("farsight também permite ward", () => {
      const evaluator = new VisionEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { trinketType: "farsight" },
        objectives: [objectiveIn("baron", 500, 40)],
      });
      expect(evaluator.evaluate(state)).not.toBeNull();
    });
  });

  describe("CA-V2 — silêncio", () => {
    it("sem objetivo iminente → silêncio", () => {
      const evaluator = new VisionEvaluator();
      const state = makeState({ gameTime: 500 });
      expect(evaluator.evaluate(state)).toBeNull();
    });

    it("jogador morto → silêncio", () => {
      const evaluator = new VisionEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { isDead: true },
        objectives: [objectiveIn("dragon", 500, 40)],
      });
      expect(evaluator.evaluate(state)).toBeNull();
    });

    it("Oracle Lens (não warda) → silêncio", () => {
      const evaluator = new VisionEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { trinketType: "lens" },
        objectives: [objectiveIn("dragon", 500, 40)],
      });
      expect(evaluator.evaluate(state)).toBeNull();
    });

    it("objetivo fora da janela (90s) → silêncio", () => {
      const evaluator = new VisionEvaluator();
      const state = makeState({
        gameTime: 500,
        objectives: [objectiveIn("dragon", 500, 90)],
      });
      expect(evaluator.evaluate(state)).toBeNull();
    });
  });

  describe("CA-V3 — dado indisponível (regra inativa sem erro)", () => {
    it("trinket null → silêncio, sem lançar erro", () => {
      const evaluator = new VisionEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { trinketType: null },
        objectives: [objectiveIn("dragon", 500, 40)],
      });
      expect(() => evaluator.evaluate(state)).not.toThrow();
      expect(evaluator.evaluate(state)).toBeNull();
    });
  });

  describe("detecção de base por tendência de HP", () => {
    it("HP subindo rápido entre polls (na base) → mensagem de comprar ward", () => {
      const evaluator = new VisionEvaluator();
      evaluator.evaluate(
        makeState({ gameTime: 500, player: { currentHealth: 300, maxHealth: 1200 } }),
      );
      const rec = evaluator.evaluate(
        makeState({ gameTime: 503, player: { currentHealth: 1200, maxHealth: 1200 } }),
      );
      expect(rec).not.toBeNull();
      expect(rec!.message).toContain("Compre uma Control Ward");
      expect(rec!.reason).toContain("compre ward");
    });

    it("HP estável (fora da base) → mensagem de colocar ward", () => {
      const evaluator = new VisionEvaluator();
      const state = makeState({
        gameTime: 500,
        player: { currentHealth: 900, maxHealth: 1200 },
        objectives: [objectiveIn("dragon", 500, 40)],
      });
      const rec = evaluator.evaluate(state)!;
      expect(rec.message).toContain("Coloque sua ward");
    });

    it("na base sem objetivo iminente → compre ward mesmo assim", () => {
      const evaluator = new VisionEvaluator();
      evaluator.evaluate(
        makeState({ gameTime: 500, player: { currentHealth: 300, maxHealth: 1200 }, objectives: [] }),
      );
      const rec = evaluator.evaluate(
        makeState({ gameTime: 503, player: { currentHealth: 1200, maxHealth: 1200 }, objectives: [] }),
      );
      expect(rec).not.toBeNull();
      expect(rec.message).toContain("Compre uma Control Ward");
    });

    it("na base sem trinket → compre ward mesmo assim", () => {
      const evaluator = new VisionEvaluator();
      evaluator.evaluate(
        makeState({ gameTime: 500, player: { currentHealth: 300, maxHealth: 1200, trinketType: null } }),
      );
      const rec = evaluator.evaluate(
        makeState({ gameTime: 503, player: { currentHealth: 1200, maxHealth: 1200, trinketType: null } }),
      );
      expect(rec).not.toBeNull();
      expect(rec.message).toContain("Compre uma Control Ward");
    });

    it("primeiro poll (sem histórico) nunca é tratado como base", () => {
      const evaluator = new VisionEvaluator();
      const rec = evaluator.evaluate(
        makeState({ gameTime: 500, player: { currentHealth: 1200, maxHealth: 1200 } }),
      );
      expect(rec).toBeNull();
    });

    it("HP caindo (em luta) → não é tratado como base", () => {
      const evaluator = new VisionEvaluator();
      evaluator.evaluate(
        makeState({ gameTime: 500, player: { currentHealth: 1000, maxHealth: 1200 }, objectives: [] }),
      );
      const rec = evaluator.evaluate(
        makeState({ gameTime: 503, player: { currentHealth: 800, maxHealth: 1200 }, objectives: [] }),
      );
      expect(rec).toBeNull();
    });
  });

  describe("prioridade por tempo", () => {
    it("spawn em 15s → critical", () => {
      const evaluator = new VisionEvaluator();
      const state = makeState({
        gameTime: 500,
        objectives: [objectiveIn("dragon", 500, 15)],
      });
      expect(evaluator.evaluate(state)!.priority).toBe("critical");
    });

    it("spawn em 30s → high", () => {
      const evaluator = new VisionEvaluator();
      const state = makeState({
        gameTime: 500,
        objectives: [objectiveIn("dragon", 500, 30)],
      });
      expect(evaluator.evaluate(state)!.priority).toBe("high");
    });

    it("spawn em 55s → medium", () => {
      const evaluator = new VisionEvaluator();
      const state = makeState({
        gameTime: 500,
        objectives: [objectiveIn("dragon", 500, 55)],
      });
      expect(evaluator.evaluate(state)!.priority).toBe("medium");
    });
  });

  describe("anti-spam", () => {
    it("não reemite enquanto ativa ou no cooldown; emite depois", () => {
      const evaluator = new VisionEvaluator();
      const base = {
        gameTime: 500,
        objectives: [objectiveIn("dragon", 500, 40)],
      };

      expect(evaluator.evaluate(makeState(base))).not.toBeNull();

      const stillActive = makeState({ ...base, gameTime: 505 });
      expect(evaluator.evaluate(stillActive)).toBeNull();

      const afterCooldown = makeState({ ...base, gameTime: 535 });
      expect(evaluator.evaluate(afterCooldown)).not.toBeNull();
    });
  });

  describe("múltiplos objetivos", () => {
    it("escolhe o objetivo mais próximo", () => {
      const evaluator = new VisionEvaluator();
      const state = makeState({
        gameTime: 500,
        objectives: [objectiveIn("baron", 500, 80), objectiveIn("dragon", 500, 30)],
      });
      expect(evaluator.evaluate(state)!.title).toContain("Dragão");
    });
  });
});