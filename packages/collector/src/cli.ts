import { RecallEvaluator } from "@ai-coach/core";
import { collectGameState } from "./index.js";
import { formatGameState, formatRecommendation } from "./print.js";

const POLL_INTERVAL_MS = 3000;
const RAW = process.argv.includes("--raw");

const evaluator = new RecallEvaluator();

async function pollOnce(): Promise<boolean> {
  try {
    const state = await collectGameState();
    if (RAW) {
      console.log(JSON.stringify(state, null, 2));
    } else {
      const recommendation = evaluator.evaluate(state);
      console.log(formatGameState(state));
      if (recommendation) {
        console.log(formatRecommendation(recommendation));
      }
    }
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (RAW) {
      console.log(`(sem partida — ${message})`);
    } else {
      console.log(`Aguardando partida... (${message})`);
    }
    return false;
  }
}

console.log("AI Coach — visualizador de dados da partida (Live Client Data API)");
console.log("Inicie uma partida para ver os dados. Ctrl+C para sair.\n");

let inGame = false;
let timer: NodeJS.Timeout | undefined;

async function tick(): Promise<void> {
  const connected = await pollOnce();
  if (connected && !inGame) {
    inGame = true;
  } else if (!connected && inGame) {
    inGame = false;
    console.log("\nPartida terminou. Aguardando nova partida...\n");
  }
  console.log("");
  timer = setTimeout(tick, POLL_INTERVAL_MS);
}

process.on("SIGINT", () => {
  if (timer) clearTimeout(timer);
  console.log("\nEncerrando.");
  process.exit(0);
});

void tick();