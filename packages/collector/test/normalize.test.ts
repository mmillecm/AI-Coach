import { describe, expect, it } from "vitest";
import { normalizeGameState } from "../src/normalize.js";
import { activePlayerFixture, eventDataFixture, gameStatsFixture, playerListFixture } from "./fixtures/sample.js";

describe("normalizeGameState", () => {
  it("mapeia o tempo de jogo e metadados", () => {
    const state = normalizeGameState(gameStatsFixture, activePlayerFixture, playerListFixture, eventDataFixture);
    expect(state.gameTime).toBe(112.7);
    expect(state.gameMode).toBe("PRACTICETOOL");
  });

  it("mapeia os dados do jogador ativo", () => {
    const state = normalizeGameState(gameStatsFixture, activePlayerFixture, playerListFixture, eventDataFixture);
    expect(state.player.summonerName).toBe("PlayerOne");
    expect(state.player.championName).toBe("Yasuo");
    expect(state.player.currentHealth).toBe(850);
    expect(state.player.maxHealth).toBe(1200);
    expect(state.player.currentGold).toBe(1300);
    expect(state.player.items).toEqual([1053]);
  });

  it("separa aliados e inimigos corretamente", () => {
    const state = normalizeGameState(gameStatsFixture, activePlayerFixture, playerListFixture, eventDataFixture);
    expect(state.allies.map((p) => p.championName)).toEqual(["Lulu"]);
    expect(state.enemies.map((p) => p.championName)).toEqual(["Lux"]);
    expect(state.enemies[0].isDead).toBe(true);
  });

  it("calcula os próximos spawns a partir dos eventos", () => {
    const state = normalizeGameState(gameStatsFixture, activePlayerFixture, playerListFixture, eventDataFixture);
    const byType = new Map(state.objectives.map((o) => [o.type, o.nextSpawnSeconds]));
    expect(byType.get("dragon")).toBe(600); // kill às 300 + 300
    expect(byType.get("baron")).toBe(1200); // sem kill → primeiro spawn
    expect(byType.has("herald")).toBe(false); // morto → não respawna
  });

  it("lança erro se o jogador ativo não estiver na lista", () => {
    expect(() =>
      normalizeGameState(gameStatsFixture, { ...activePlayerFixture, summonerName: "Ghost" }, playerListFixture, eventDataFixture),
    ).toThrow("not found in player list");
  });

  it("usa o último kill quando há múltiplos do mesmo tipo", () => {
    const events = {
      Events: [
        ...eventDataFixture.Events,
        { EventID: 3, EventName: "DragonKill", EventTime: 500 },
      ],
    };
    const state = normalizeGameState(gameStatsFixture, activePlayerFixture, playerListFixture, events);
    const dragon = state.objectives.find((o) => o.type === "dragon");
    expect(dragon?.nextSpawnSeconds).toBe(800); // kill às 500 + 300
  });

  it("sem nenhum kill → primeiro spawn para todos os tipos vivos", () => {
    const state = normalizeGameState(gameStatsFixture, activePlayerFixture, playerListFixture, {
      Events: [{ EventID: 0, EventName: "GameStart", EventTime: 0 }],
    });
    const byType = new Map(state.objectives.map((o) => [o.type, o.nextSpawnSeconds]));
    expect(byType.get("dragon")).toBe(300);
    expect(byType.get("baron")).toBe(1200);
    expect(byType.has("herald")).toBe(true); // sem kill de arauto → primeiro spawn
  });
});