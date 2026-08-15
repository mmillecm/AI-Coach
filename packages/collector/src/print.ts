import type { GameState, PlayerState, RecallRecommendation } from "@ai-coach/core";

function pad(value: string | number, length: number): string {
  return String(value).padEnd(length);
}

function formatHealth(p: PlayerState): string {
  const hpPercent = p.maxHealth > 0 ? Math.round((p.currentHealth / p.maxHealth) * 100) : 0;
  return `${Math.round(p.currentHealth)}/${Math.round(p.maxHealth)} (${hpPercent}%)`;
}

export function formatRecommendation(rec: RecallRecommendation): string {
  return [
    "",
    `⚠ ${rec.priority.toUpperCase()} — ${rec.title}`,
    `  ${rec.message}`,
  ].join("\n");
}

export function formatGameState(state: GameState): string {
  const lines: string[] = [];
  const { player } = state;

  lines.push(`── GameState ────────────────────────────`);
  lines.push(`Modo: ${state.gameMode}   Mapa: ${state.mapName}   Tempo: ${formatTime(state.gameTime)}`);
  lines.push("");
  lines.push(`─ Você (${player.championName}) ─────────────────────`);
  lines.push(
    `${pad(player.position, 8)} Nível ${pad(player.level, 2)} HP: ${pad(formatHealth(player), 24)} ` +
      `Mana: ${Math.round(player.currentResource)}/${Math.round(player.maxResource)} ` +
      `${player.isDead ? "MORTO" : "vivo"}`,
  );
  lines.push(`Ouro: ${player.currentGold}   Ouro total: ${player.totalGold}`);
  lines.push(`Itens: ${player.items.length > 0 ? player.items.join(", ") : "nenhum"}`);
  lines.push("");
  lines.push(`─ Objetivos ────────────────────────────`);
  if (state.objectives.length === 0) {
    lines.push("nenhum objetivo relevante");
  } else {
    for (const objective of state.objectives) {
      const timeLeft =
        objective.nextSpawnSeconds === null
          ? "não respawna"
          : `em ${formatTime(Math.max(objective.nextSpawnSeconds - state.gameTime, 0))}`;
      lines.push(`${pad(objective.type, 8)} ${timeLeft}`);
    }
  }
  lines.push("");
  lines.push(`─ Aliados ──────────────────────────────`);
  for (const ally of state.allies) {
    lines.push(
      `${pad(ally.championName, 14)} ${pad(ally.position, 8)} lvl ${pad(ally.level, 2)} ` +
        `${ally.kills}/${ally.deaths}/${ally.assists} CS ${pad(ally.creepScore, 3)} ${ally.isDead ? "MORTO" : ""}`,
    );
  }
  lines.push("");
  lines.push(`─ Inimigos ─────────────────────────────`);
  for (const enemy of state.enemies) {
    lines.push(
      `${pad(enemy.championName, 14)} ${pad(enemy.position, 8)} lvl ${pad(enemy.level, 2)} ` +
        `${enemy.kills}/${enemy.deaths}/${enemy.assists} CS ${pad(enemy.creepScore, 3)} ${enemy.isDead ? "MORTO" : ""}`,
    );
  }
  lines.push(`────────────────────────────────────────`);
  return lines.join("\n");
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}