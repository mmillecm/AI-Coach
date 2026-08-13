import { describe, expect, it } from "vitest";
import { version } from "../src/index.js";

describe("smoke", () => {
  it("core package loads", () => {
    expect(version).toBe("0.1.0");
  });
});