import { describe, expect, it } from "vitest";
import type { RecallRecommendation } from "@ai-coach/core";
import { normalizeGameState } from "../src/normalize.js";
import { formatGameState, formatRecommendation, formatTime } from "../src/print.js";
import { activePlayerFixture, eventDataFixture, gameStatsFixture, playerListFixture } from "../src/fixtures/sample.js";

const state = normalizeGameState(gameStatsFixture, activePlayerFixture, playerListFixture, eventDataFixture);

describe("formatTime", () => {
  it("formata segundos como mm:ss", () => {
    expect(formatTime(112.7)).toBe("01:52");
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(600)).toBe("10:00");
  });
});

describe("formatGameState", () => {
  it("exibe o jogador com HP, mana, ouro e nível", () => {
    const output = formatGameState(state);
    expect(output).toContain("Yasuo");
    expect(output).toContain("850/1200");
    expect(output).toContain("200/800");
    expect(output).toContain("Ouro: 1300");
    expect(output).toContain("Nível 8");
  });

  it("exibe aliados e inimigos", () => {
    const output = formatGameState(state);
    expect(output).toContain("Lulu");
    expect(output).toContain("Lux");
    expect(output).toContain("MORTO");
  });

  it("exibe o tempo de jogo formatado", () => {
    expect(formatGameState(state)).toContain("01:52");
  });
});

describe("formatRecommendation", () => {
  it("formata prioridade, título e mensagem", () => {
    const rec: RecallRecommendation = {
      type: "RECALL",
      priority: "high",
      title: "RECALL para Dragão",
      message: "Dragão nasce em 40s — HP baixo. Dê recall para chegar pronto.",
      reason: "HP baixo",
      createdAt: 500,
      expiresAt: 520,
    };
    const output = formatRecommendation(rec);
    expect(output).toContain("HIGH");
    expect(output).toContain("RECALL para Dragão");
    expect(output).toContain("HP baixo");
  });
});