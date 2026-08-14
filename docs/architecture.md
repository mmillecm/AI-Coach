# Arquitetura Técnica — AI Coach

## Decisões tomadas

### D-01 — Estrutura de repositório: monorepo com npm workspaces

Pacotes:

```text
packages/
  core/        # domínio (GameState, types) + Decision Engine + testes
  collector/   # coleta e normalização da Live Client Data API → GameState
  overlay/     # UI/overlay (futuro)
```

- `core` não depende de `collector` nem `overlay` — é testável isoladamente com GameState mockado.
- `collector` depende de `core` (produz `GameState`).
- `overlay` dependerá de `core` (consome `Recommendation`).
- Dependências externas compartilhadas no workspace root.

### D-02 — Stack base

- **Linguagem/runtime**: Node.js + TypeScript (stack preferencial do contexto).
- **Testes**: Vitest em todos os pacotes.
- **Database** (incremento futuro): SQLite.

### D-03 — Fonte de dados primária: Live Client Data API

- Endpoints usados no MVP: `gamestats` (gameTime), `activeplayer` (HP/mana/ouro/level), `playerlist` (isDead/respawn), `eventdata` (DragonKill, BaronKill, HeraldKill para timers de objetivo).
- Complementos (incrementos futuros): Riot Developer APIs e Data Dragon para dados estáticos (itens, campeões).
- **Restrição confirmada**: a Live Client API não expõe posição (x/y) do jogador. Qualquer regra que dependa de posição fica fora do escopo até que haja fonte permitida.

### D-04 — Arquitetura em camadas (filosofia do contexto)

```text
Live Client Data API
        ↓
Collector + Normalizer   (packages/collector)
        ↓
GameState (domínio)      (packages/core)
        ↓
Decision Engine          (packages/core)
        ↓
Recommendation           (packages/core)
        ↓
Overlay / Presentation   (packages/overlay — futuro)
```

Regras: lógica de negócio nunca fica em componentes React; a UI não conhece detalhes da API; o Decision Engine roda sem League aberto.

## Decisões pendentes

### P-01 — Tecnologia do overlay: **RESOLVIDA → Electron (MVP)**

Escolhido **Electron** para o MVP do overlay. Motivos:

- O processo principal do Electron **é Node.js** → reusa `@ai-coach/collector` + `@ai-coach/core` exatamente como estão (polling + avaliação).
- Em Tauri, a webview não aceita o certificado auto-assinado da Live Client API (e tem CORS) → o polling teria que ser reescrito em Rust ou via sidecar Node.
- Stack já dominada pelo desenvolvedor (JS/TS/React).
- Custo: memória maior (~150MB). Se no futuro isso for problema, reavaliar Tauri mantendo o core intacto.

### D-05 — Arquitetura do overlay (Electron)

```text
main process (Node.js)
   ├─ loop: collectGameState() → RecallEvaluator.evaluate()  (a cada 3s)
   └─ IPC "coach:recommendation" → renderer
renderer (HTML/CSS/TS)
   └─ janela transparente, sem borda, sempre-no-topo, click-through
```

- `core` e `collector` continuam reutilizados sem alteração.
- Segurança: `contextIsolation: true`, `nodeIntegration: false`, comunicação só via `preload` + `contextBridge`.

### P-02 — Persistência e histórico (incremento futuro)

SQLite no MVP; reavaliar PostgreSQL na evolução. Fora do incremento atual.

## Constantes de jogo que exigem verificação na patch atual

- Spawn inicial e respawn de dragão/barão/arauto (variam por temporada).
- Devem ser configuração no `core`, não valores hardcoded.