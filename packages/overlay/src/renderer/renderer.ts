const champion = document.getElementById("champion")!;
const level = document.getElementById("level")!;
const status = document.getElementById("status")!;
const hpFill = document.getElementById("hp-fill")!;
const hpValue = document.getElementById("hp-value")!;
const manaFill = document.getElementById("mana-fill")!;
const manaValue = document.getElementById("mana-value")!;
const gold = document.getElementById("gold")!;
const recommendation = document.getElementById("recommendation")!;
const priority = document.getElementById("priority")!;
const title = document.getElementById("title")!;
const message = document.getElementById("message")!;

function percent(current: number, max: number): number {
  return max > 0 ? Math.round((current / max) * 100) : 0;
}

function setStatus(text: string, connected: boolean): void {
  status.textContent = text;
  status.classList.toggle("connected", connected);
  status.classList.toggle("disconnected", !connected);
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;

function showRecommendation(rec: {
  type: string;
  priority: string;
  title: string;
  message: string;
  createdAt: number;
  expiresAt: number;
}): void {
  priority.textContent = `${rec.priority.toUpperCase()} · ${rec.type}`;
  priority.classList.remove("critical", "high", "medium", "vision");
  priority.classList.add(rec.priority);
  if (rec.type === "VISION") {
    priority.classList.add("vision");
  }
  title.textContent = rec.title;
  message.textContent = rec.message;
  recommendation.style.display = "flex";

  if (hideTimer) {
    clearTimeout(hideTimer);
  }
  const durationMs = Math.max(rec.expiresAt - rec.createdAt, 0) * 1000;
  hideTimer = setTimeout(() => {
    recommendation.style.display = "none";
    hideTimer = null;
  }, durationMs);
}

function hideRecommendation(): void {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  recommendation.style.display = "none";
}

window.coach.onUpdate((update) => {
  if (!update.connected || !update.player) {
    hideRecommendation();
    setStatus("desconectado", false);
    return;
  }

  const p = update.player;
  champion.textContent = p.championName;
  level.textContent = `Nível ${p.level}`;

  const hpPct = percent(p.currentHealth, p.maxHealth);
  hpFill.style.width = `${hpPct}%`;
  hpValue.textContent = `${Math.round(p.currentHealth)}/${Math.round(p.maxHealth)} (${hpPct}%)`;

  const manaPct = percent(p.currentResource, p.maxResource);
  manaFill.style.width = `${manaPct}%`;
  manaValue.textContent = `${Math.round(p.currentResource)}/${Math.round(p.maxResource)} (${manaPct}%)`;

  gold.textContent = `Ouro: ${Math.round(p.currentGold)}`;

  setStatus(p.isDead ? "morto" : "conectado", !p.isDead);

  if (update.recommendation) {
    showRecommendation(update.recommendation);
  }
});
