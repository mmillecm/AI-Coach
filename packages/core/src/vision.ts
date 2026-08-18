import type { GameState, ObjectiveState } from "./domain.js";

export type VisionPriority = "critical" | "high" | "medium";

export interface VisionRecommendation {
  type: "VISION";
  priority: VisionPriority;
  title: string;
  message: string;
  reason: string;
  createdAt: number;
  expiresAt: number;
}

export interface VisionConfig {
  wardLeadTime: number;
  criticalWindow: number;
  highWindow: number;
  activeDuration: number;
  cooldown: number;
  baseHealthGainPercentPerSecond: number;
}

export const DEFAULT_VISION_CONFIG: VisionConfig = {
  wardLeadTime: 60,
  criticalWindow: 20,
  highWindow: 45,
  activeDuration: 20,
  cooldown: 30,
  baseHealthGainPercentPerSecond: 5,
};

const OBJECTIVE_LABEL: Record<ObjectiveState["type"], string> = {
  dragon: "Dragão",
  baron: "Barão",
  herald: "Arauto",
};

interface ObjectiveCandidate {
  objective: ObjectiveState;
  timeLeft: number;
}

export class VisionEvaluator {
  private config: VisionConfig;
  private lastRecommendation: { createdAt: number; expiresAt: number } | null = null;
  private previousHealth: number | null = null;
  private previousGameTime: number | null = null;

  constructor(config: VisionConfig = DEFAULT_VISION_CONFIG) {
    this.config = config;
  }

  evaluate(state: GameState): VisionRecommendation | null {
    const now = state.gameTime;

    if (state.player.isDead) {
      this.previousHealth = null;
      this.previousGameTime = null;
      return null;
    }

    const inBase = this.isInBase(state.player.currentHealth, state.player.maxHealth, now);
    this.previousHealth = state.player.currentHealth;
    this.previousGameTime = now;

    if (this.lastRecommendation) {
      const isActive = now < this.lastRecommendation.expiresAt;
      const inCooldown = now - this.lastRecommendation.createdAt < this.config.cooldown;
      if (isActive || inCooldown) {
        return null;
      }
    }

    if (inBase) {
      return this.record(now, "medium", "Compre uma Control Ward", "Compre uma Control Ward para garantir visão antes de sair — você está na base.", "compre ward na base");
    }

    const trinket = state.player.trinketType;
    if (trinket === null || trinket === "lens") {
      return null;
    }

    const candidates = findCandidates(state, this.config.wardLeadTime, now);
    if (candidates.length === 0) {
      return null;
    }

    const best = candidates[0];
    const label = OBJECTIVE_LABEL[best.objective.type];

    return this.record(
      now,
      computePriority(this.config, best.timeLeft),
      `WARD para ${label}`,
      `${label} nasce em ${Math.ceil(best.timeLeft)}s — Coloque sua ward para ter visão antes do objetivo.`,
      "coloque ward antes do objetivo",
    );
  }

  private isInBase(currentHealth: number, maxHealth: number, now: number): boolean {
    if (this.previousHealth === null || this.previousGameTime === null) {
      return false;
    }
    const dt = now - this.previousGameTime;
    const delta = currentHealth - this.previousHealth;
    if (dt <= 0 || maxHealth <= 0) {
      return false;
    }
    const gainPercentPerSecond = (delta / dt / maxHealth) * 100;
    return gainPercentPerSecond >= this.config.baseHealthGainPercentPerSecond;
  }

  private record(
    now: number,
    priority: VisionPriority,
    title: string,
    message: string,
    reason: string,
  ): VisionRecommendation {
    const createdAt = now;
    const expiresAt = now + this.config.activeDuration;
    this.lastRecommendation = { createdAt, expiresAt };
    return { type: "VISION", priority, title, message, reason, createdAt, expiresAt };
  }
}

function findCandidates(state: GameState, wardLeadTime: number, now: number): ObjectiveCandidate[] {
  return state.objectives
    .filter((objective) => objective.nextSpawnSeconds !== null)
    .map((objective) => ({
      objective,
      timeLeft: objective.nextSpawnSeconds! - now,
    }))
    .filter(({ timeLeft }) => timeLeft >= 0 && timeLeft <= wardLeadTime)
    .sort((a, b) => a.timeLeft - b.timeLeft);
}

function computePriority(config: VisionConfig, timeLeft: number): VisionPriority {
  if (timeLeft <= config.criticalWindow) {
    return "critical";
  }
  if (timeLeft <= config.highWindow) {
    return "high";
  }
  return "medium";
}