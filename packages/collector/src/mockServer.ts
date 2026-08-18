import https from "node:https";
import selfsigned from "selfsigned";
import type { GameEvent } from "./liveClient.js";
import { activePlayerFixture, eventDataFixture, gameStatsFixture, playerListFixture } from "./fixtures/sample.js";

const PORT = Number(process.env.MOCK_PORT ?? 2999);
const START_TIME = Number(process.env.MOCK_START_TIME ?? 210);
const SPEED = Number(process.env.MOCK_SPEED ?? 10);

const ALL_EVENTS: GameEvent[] = [
  { EventID: 0, EventName: "GameStart", EventTime: 0 },
  { EventID: 1, EventName: "DragonKill", EventTime: 300 },
  { EventID: 2, EventName: "HeraldKill", EventTime: 700 },
  { EventID: 3, EventName: "BaronKill", EventTime: 1200 },
];

let gameTime = START_TIME;

function currentEvents(): GameEvent[] {
  return ALL_EVENTS.filter((event) => event.EventTime <= gameTime);
}

function activePlayer() {
  return {
    ...activePlayerFixture,
    currentGold: 500,
    championStats: {
      ...activePlayerFixture.championStats,
      currentHealth: 1000,
      maxHealth: 1200,
      resourceValue: 500,
      resourceMax: 800,
    },
  };
}

function playerList() {
  return playerListFixture;
}

function gameStats() {
  return { ...gameStatsFixture, gameTime };
}

function handleRequest(req: { url?: string }, res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body: string) => void }) {
  const pathname = new URL(req.url ?? "/", "http://mock").pathname;
  let body: unknown;
  let status = 200;

  switch (pathname) {
    case "/liveclientdata/gamestats":
      body = gameStats();
      break;
    case "/liveclientdata/activeplayer":
      body = activePlayer();
      break;
    case "/liveclientdata/playerlist":
      body = playerList();
      break;
    case "/liveclientdata/eventdata":
      body = { ...eventDataFixture, Events: currentEvents() };
      break;
    default:
      status = 404;
      body = { error: `rota desconhecida: ${pathname}` };
  }

  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const pems = await selfsigned.generate(
  [{ name: "commonName", value: "ai-coach-mock" }],
  {
    keySize: 2048,
    notBeforeDate: new Date(Date.now() - 86400000),
    notAfterDate: new Date(Date.now() + 365 * 86400000),
  },
);

const server = https.createServer({ key: pems.private, cert: pems.cert }, handleRequest);

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Mock da Live Client Data API ouvindo em https://127.0.0.1:${PORT}`);
  console.log(`Tempo inicial: ${Math.floor(gameTime)}s  Velocidade: ${SPEED}x (1s real = ${SPEED}s de jogo)`);
  console.log("Rodando até 1500s e reiniciando. Ctrl+C para sair.\n");
});

setInterval(() => {
  gameTime += SPEED;
  if (gameTime > 1500) {
    gameTime = 0;
    console.log("\n(ciclo reiniciado)");
  }
}, 1000);

process.on("SIGINT", () => {
  console.log("\nMock encerrado.");
  process.exit(0);
});
