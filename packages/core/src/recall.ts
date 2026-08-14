import type { GameState, ObjectiveState } from "./domain.js";

export type RecallPriority = "critical" | "high" | "medium";

export interface RecallRecommendation {
  type: "RECALL";
  priority: RecallPriority;
  title: string;
  message: string;
  reason: string;
  createdAt: number;
  expiresAt: number;
}

export interface RecallConfig {
  minHpPercent: number;
  minResourcePercent: number;
  minGoldForPurchase: number;
  recallLeadTime: number;
  criticalWindow: number;
  highWindow: number;
  criticalHpPercent: number;
  activeDuration: number;
  recallCooldown: number;
}

export const DEFAULT_RECALL_CONFIG: RecallConfig = {
  minHpPercent: 60,
  minResourcePercent: 40,
  minGoldForPurchase: 1000,
  recallLeadTime: 90,
  criticalWindow: 20,
  highWindow: 45,
  criticalHpPercent: 30,
  activeDuration: 20,
  recallCooldown: 30,
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

export class RecallEvaluator {
  private config: RecallConfig;
  private lastRecommendation: { createdAt: number; expiresAt: number } | null = null;

  constructor(config: RecallConfig = DEFAULT_RECALL_CONFIG) {
    this.config = config;
  }

  evaluate(state: GameState): RecallRecommendation | null {
    const now = state.gameTime;

    if (state.player.isDead) {
      return null;
    }

    const player = state.player;
    const hpPercent = player.maxHealth > 0 ? (player.currentHealth / player.maxHealth) * 100 : 0;
    const resourcePercent =
      player.maxResource > 0 ? (player.currentResource / player.maxResource) * 100 : 0;

    const reasons = buildReasons(this.config, hpPercent, resourcePercent, player.currentGold);
    if (reasons.length === 0) {
      return null;
    }

    const candidates = findCandidates(state, this.config.recallLeadTime, now);
    if (candidates.length === 0) {
      return null;
    }

    if (this.lastRecommendation) {
      const isActive = now < this.lastRecommendation.expiresAt;
      const inCooldown = now - this.lastRecommendation.createdAt < this.config.recallCooldown;
      if (isActive || inCooldown) {
        return null;
      }
    }

    const best = candidates[0];
    const priority = computePriority(this.config, best.timeLeft, hpPercent);

    const createdAt = now;
    const expiresAt = now + this.config.activeDuration;
    this.lastRecommendation = { createdAt, expiresAt };

    return {
      type: "RECALL",
      priority,
      title: `RECALL para ${OBJECTIVE_LABEL[best.objective.type]}`,
      message: `${OBJECTIVE_LABEL[best.objective.type]} nasce em ${Math.ceil(best.timeLeft)}s — ${reasons.join(" e ")}. Dê recall para chegar pronto.`,
      reason: reasons.join(", "),
      createdAt,
      expiresAt,
    };
  }
}

function buildReasons(
  config: RecallConfig,
  hpPercent: number,
  resourcePercent: number,
  gold: number,
): string[] {
  const reasons: string[] = [];
  if (hpPercent < config.minHpPercent) {
    reasons.push("HP baixo");
  }
  if (resourcePercent < config.minResourcePercent) {
    reasons.push("mana baixa");
  }
  if (gold >= config.minGoldForPurchase) {
    reasons.push("ouro para compra");
  }
  return reasons;
}

function findCandidates(state: GameState, recallLeadTime: number, now: number): ObjectiveCandidate[] {
  return state.objectives
    .filter((objective) => objective.nextSpawnSeconds !== null)
    .map((objective) => ({
      objective,
      timeLeft: objective.nextSpawnSeconds! - now,
    }))
    .filter(({ timeLeft }) => timeLeft >= 0 && timeLeft <= recallLeadTime)
    .sort((a, b) => a.timeLeft - b.timeLeft);
}

function computePriority(
  config: RecallConfig,
  timeLeft: number,
  hpPercent: number,
): RecallPriority {
  if (timeLeft <= config.criticalWindow && hpPercent < config.criticalHpPercent) {
    return "critical";
  }
  if (timeLeft <= config.highWindow) {
    return "high";
  }
  return "medium";
}