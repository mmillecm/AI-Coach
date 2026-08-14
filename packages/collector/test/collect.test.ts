import { describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  responses: new Map<string, unknown>(),
  failWith: null as Error | null,
}));

vi.mock("node:https", () => ({
  default: {
    get: (
      options: { path: string },
      callback: (res: {
        setEncoding: (encoding: string) => void;
        on: (event: string, handler: (chunk?: string) => void) => void;
      }) => void,
    ) => {
      if (mock.failWith) {
        return {
          on: (_event: string, handler: (err: Error) => void) => {
            handler(mock.failWith as Error);
          },
        };
      }

      const payload = JSON.stringify(mock.responses.get(options.path));
      const res = {
        setEncoding: () => undefined,
        on: (event: string, handler: (chunk?: string) => void) => {
          if (event === "data") {
            handler(payload);
          }
          if (event === "end") {
            handler();
          }
        },
      };

      callback(res);
      return {
        on: () => undefined,
      };
    },
  },
}));

import { collectGameState } from "../src/index.js";
import { activePlayerFixture, eventDataFixture, gameStatsFixture, playerListFixture } from "./fixtures/sample.js";

describe("collectGameState", () => {
  it("coleta e normaliza com League aberto", async () => {
    mock.responses.set("/liveclientdata/gamestats", gameStatsFixture);
    mock.responses.set("/liveclientdata/activeplayer", activePlayerFixture);
    mock.responses.set("/liveclientdata/playerlist", playerListFixture);
    mock.responses.set("/liveclientdata/eventdata", eventDataFixture);

    const state = await collectGameState();

    expect(state.gameTime).toBe(112.7);
    expect(state.player.summonerName).toBe("PlayerOne");
    expect(state.player.currentGold).toBe(1300);
  });

  it("rejeita quando não há partida (conexão recusada)", async () => {
    mock.responses.clear();
    mock.failWith = new Error("ECONNREFUSED");

    await expect(collectGameState()).rejects.toThrow("ECONNREFUSED");
  });
});