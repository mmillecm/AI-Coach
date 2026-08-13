# PRD — Incremento: Recall para Objetivo

## 1. Problema

Jogadores intermediários de League of Legends frequentemente chegam a um objetivo (dragão, barão, arauto) sem estarem prontos: com HP ou mana baixos, ou sem terem gastado o ouro em itens. O custo de um recall mal planejado é perder o timing do objetivo; o custo de não dar recall é chegar ao objetivo em desvantagem ou morrer.

O jogador já vê essas informações na tela (HP, mana, ouro, timer do objetivo no scoreboard), mas tem dificuldade em **converter isso em timing de recall** no meio da execução de outras tarefas.

Hipótese de produto (a ser validada, não é requisito final):

> Um lembrete contextual de "recall agora para chegar pronto ao objetivo" ajuda o jogador a chegar às disputas de objetivo com recursos e itens adequados, melhorando o resultado dessas disputas.

## 2. Objetivo do usuário

Quando um objetivo épico está prestes a nascer, o jogador quer:

1. saber se deve dar recall agora para chegar pronto (HP/mana cheios e item comprado);
2. saber **por que** (qual objetivo, quanto tempo falta, o que está faltando);
3. não ser incomodado quando não houver um recall relevante.

## 3. Requisitos funcionais

Dados de entrada (GameState normalizado, conforme contexto do projeto):

- `gameTime` — tempo da partida em segundos.
- `player.currentHealth / player.maxHealth` — HP atual e máximo.
- `player.currentResource / player.maxResource` — mana/energia atual e máximo.
- `player.isDead` — se o jogador está morto.
- `player.currentGold` — ouro disponível.
- `objectives` — derivado de eventos `DragonKill`, `BaronKill` e `HeraldKill` da Live Client Data API (tempo do último kill de cada tipo).

- **RF-01 — Cálculo do próximo spawn de objetivo épico**
  O sistema deve calcular o próximo instante de spawn de cada objetivo épico (dragão, barão, arauto) a partir dos eventos de kill da partida e de constantes de spawn configuráveis (primeiro spawn e intervalo de respawn por tipo).

- **RF-02 — Detecção de "não pronto para o objetivo"**
  O sistema deve considerar o jogador como "não pronto" quando pelo menos uma das condições for verdadeira:
  - HP abaixo do limiar `minHpPercent` (padrão 60%);
  - mana abaixo do limiar `minResourcePercent` (padrão 40%);
  - ouro disponível ≥ `minGoldForPurchase` (padrão 1000).
  O jogador morto nunca é considerado candidato a recall.

- **RF-03 — Geração da recomendação de recall**
  Para cada objetivo cujo spawn está dentro da janela `[spawnTime - recallLeadTime, spawnTime]`, se o jogador estiver "não pronto", o sistema deve gerar uma recomendação de recall com prioridade determinada pela urgência:
  - `critical`: spawn ≤ `criticalWindow` (padrão 20s) e HP < `criticalHpPercent` (padrão 30%);
  - `high`: spawn ≤ `highWindow` (padrão 45s);
  - `medium`: janela maior (até `recallLeadTime`, padrão 90s).

- **RF-04 — Contexto da recomendação**
  A recomendação deve conter: qual objetivo, tempo restante até o spawn, e o motivo (HP/mana baixos ou ouro disponível para compra). Segue a estrutura `Recommendation` do contexto (`type`, `priority`, `title`, `message`, `reason`, `createdAt`, `expiresAt`).

- **RF-05 — Silêncio quando irrelevante**
  O sistema não deve gerar recomendação quando:
  - nenhum objetivo épico estiver com spawn iminente;
  - o jogador estiver morto;
  - o jogador estiver "pronto" para o objetivo.

- **RF-06 — Anti-spam**
  Uma recomendação de recall ativa não deve ser reemitida enquanto não expirar (`expiresAt`). Após expirar, o mesmo cenário não deve gerar nova recomendação antes de um cooldown configurável (`recallCooldown`, padrão 30s).

- **RF-07 — Testável sem League**
  O Decision Engine de recall deve operar exclusivamente sobre o GameState normalizado e ser executável com GameState mockado, sem necessidade de League aberto.

## 4. Requisitos não funcionais

- **RNF-01 — Baixo consumo**: avaliação puramente em memória, sem I/O durante a decisão.
- **RNF-02 — Determinístico**: mesmos dados de entrada geram a mesma recomendação; limiares configuráveis, sem valores mágicos no código.
- **RNF-03 — Testável**: cobertura de testes para cálculo de spawn, prioridades, expiração, cooldown e ausência de dados (ver seção 16 do contexto).
- **RNF-04 — Logging**: logs concisos dos eventos relevantes (recomendação gerada, objetivo identificado, motivo), sem excesso em produção.
- **RNF-05 — Compliance**: usa apenas a Live Client Data API (eventos `DragonKill`/`BaronKill`/`HeraldKill` e estado do jogador). Não usa informação oculta; tudo que recomenda é informação que o jogador já vê na tela.

## 5. Critérios de aceitação

- **CA-RF-01**: Dado um kill de dragão em `t`, o spawn seguinte é calculado como `max(primeiroSpawn, t + intervalo)` e o cálculo é idêntico para os três tipos com suas constantes.
- **CA-RF-02**: Dado GameState com HP 50%, mana 90% e ouro 500, jogador é "não pronto" por HP; com HP 90%, mana 90% e ouro 500, jogador é "pronto".
- **CA-RF-03**: Dado dragão nascendo em 40s e jogador com HP 50%, é gerada recomendação `RECALL` com prioridade `high`; com spawn em 15s e HP 25%, prioridade `critical`.
- **CA-RF-04**: A mensagem da recomendação menciona o objetivo (ex: "Dragão"), o tempo restante e o motivo (ex: "HP baixo").
- **CA-RF-05**: Com spawn a 5 minutos de distância, ou jogador pronto, ou jogador morto, o engine retorna vazio (silêncio).
- **CA-RF-06**: Após gerar uma recomendação, o mesmo cenário não gera outra até `expiresAt` + `recallCooldown`.
- **CA-RF-07**: Um teste executa o engine com GameState mockado e verifica a recomendação sem nenhuma dependência externa (nenhuma chamada de rede/API).

## 6. Fora do escopo

- Recall por HP/recursos baixos sem relação com objetivo.
- Recall para "converter ouro" pós-kill (parsing de `ChampionKill`).
- Recomendações de compra (item específico) — categoria separada.
- Detecção de posição do jogador / se já está na base (API não expõe x/y).
- Overlay ou qualquer apresentação visual — incremento próprio.
- Persistência de histórico de recomendações — incremento próprio.
- Qualquer uso de LLM/ML.

## 7. Riscos e limitações

- **Sem posição do jogador**: a Live Client Data API não expõe coordenadas; não é possível detectar se o jogador já está na base ou recuando. Mitigação: anti-spam (RF-06) e recomendação com janela de validade curta; validação com partida real posteriormente.
- **Constantes de spawn variam por patch**: o primeiro spawn e o respawn de dragão/barão/arauto mudam entre temporadas. Valores iniciais serão configuração (verificar patch atual antes de fixar os padrões).
- **Eventos não capturam todas as nuances**: steals/trocas de objetivo afetam o respawn; o timer é derivado do kill registrado no evento, que é a fonte mais confiável disponível.
- **Live Client Data API não é oficialmente suportada**: pode mudar ou indisponibilizar campos sem aviso (documentação Riot, seção Game Client API).
- **Falso positivo de "não pronto"**: ouro ≥ limiar é proxy de "tem compra relevante a fazer"; não conhece o estado real de compra do item. Validar o limiar `minGoldForPurchase` com partidas reais.

## Notas para o design técnico (próximo passo)

- Modelo: `ObjectiveState` (tipo, próximoSpawn) derivado no normalizador.
- `RecallEvaluator` no Decision Engine com limiares vindos de configuração.
- Prioridade herdada da interface `Recommendation` do contexto.
- Mock factory de `GameState` para testes.