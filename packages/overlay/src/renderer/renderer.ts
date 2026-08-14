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

window.coach.onUpdate((update) => {
  if (!update.connected || !update.player) {
    recommendation.style.display = "none";
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
    const rec = update.recommendation;
    priority.textContent = rec.priority.toUpperCase();
    title.textContent = rec.title;
    message.textContent = rec.message;
    recommendation.style.display = "flex";
  } else {
    recommendation.style.display = "none";
  }
});
