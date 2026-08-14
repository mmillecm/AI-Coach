import { describe, expect, it } from "vitest";
import { nextSpawnSeconds } from "../src/spawn.js";

describe("nextSpawnSeconds", () => {
  it("sem kill → primeiro spawn de cada tipo", () => {
    expect(nextSpawnSeconds("dragon", null)).toBe(300);
    expect(nextSpawnSeconds("baron", null)).toBe(1200);
    expect(nextSpawnSeconds("herald", null)).toBe(900);
  });

  it("com kill → último kill + intervalo", () => {
    expect(nextSpawnSeconds("dragon", 400)).toBe(700);
    expect(nextSpawnSeconds("baron", 1300)).toBe(1660);
  });

  it("nunca antes do primeiro spawn (guard max)", () => {
    const config = { firstSpawnSeconds: 300, respawnAfterKillSeconds: 50 };
    expect(nextSpawnSeconds("dragon", 100, config)).toBe(300);
  });

  it("com kill e sem respawn (arauto) → null", () => {
    expect(nextSpawnSeconds("herald", 900)).toBeNull();
  });
});