# AI Coach — Project Context

## 1. Visão do projeto

Estamos desenvolvendo um **AI Coach para League of Legends**, inicialmente como um MVP local para Windows.

O objetivo é ajudar **jogadores intermediários de League of Legends** a tomar decisões melhores durante uma partida.

O público-alvo já conhece as mecânicas básicas do jogo, campeões, habilidades, itens e objetivos. O problema principal não é falta de conhecimento básico, mas dificuldade em transformar o estado atual da partida em boas decisões de macro e micro.

O produto deve funcionar como um **coach contextual**, ajudando o jogador a perceber riscos, oportunidades e prioridades durante a partida.

Exemplos de situações que queremos ajudar:

- uso adequado de wards;
- identificação de oportunidades de farm;
- escolha de lane após uma luta;
- decisões de recall;
- compras de itens adaptadas à situação;
- identificação de lutas favoráveis ou desfavoráveis;
- observações relevantes sobre o estado da partida;
- preparação para objetivos;
- eventualmente, análise personalizada dos erros do jogador.

---

# 2. Problema

Jogadores intermediários frequentemente possuem conhecimento suficiente sobre o funcionamento do League of Legends, mas têm dificuldade em:

- interpretar rapidamente o estado do mapa;
- identificar qual decisão tem maior prioridade;
- distribuir corretamente os recursos disponíveis no mapa;
- adaptar suas compras à composição e ao estado da partida;
- reconhecer quando uma luta é favorável ou desfavorável;
- manter atenção sobre visão, objetivos e recursos enquanto executam outras tarefas.

A hipótese principal do produto é:

> **O jogador não precisa necessariamente de mais informações; ele precisa de ajuda para identificar quais informações são relevantes para a decisão que precisa tomar naquele momento.**

---

# 3. Público-alvo

### Principal

Jogadores intermediários de League of Legends.

Características:

- já conhecem o jogo;
- conseguem jogar suas funções/campeões;
- conhecem itens e objetivos básicos;
- conseguem executar mecânicas básicas;
- mas ainda cometem erros frequentes de macro e tomada de decisão.

O produto NÃO será inicialmente direcionado a:

- iniciantes absolutos;
- jogadores profissionais;
- automação de gameplay;
- bots.

---

# 4. Visão do produto

A visão de longo prazo é criar um:

> **Personal AI League Coach**

O sistema deve acompanhar o contexto das partidas, identificar padrões de comportamento do jogador e ajudá-lo a melhorar suas decisões ao longo do tempo.

A evolução pretendida é:

```text
Partida
   ↓
Game State
   ↓
Interpretação
   ↓
Recomendação
   ↓
Resultado da decisão
   ↓
Histórico
   ↓
Perfil do jogador
   ↓
Coaching personalizado
```

O sistema deve evoluir de um simples sistema de recomendações para um **coach personalizado baseado em dados**.

---

# 5. Escopo inicial do MVP

O MVP deve ser propositalmente pequeno.

### Funcionalidades iniciais

1. Detectar quando uma partida está acontecendo.
2. Coletar dados disponíveis da partida.
3. Identificar o jogador ativo.
4. Criar um Game State normalizado.
5. Avaliar algumas situações através de regras determinísticas.
6. Gerar recomendações.
7. Exibir recomendações em um pequeno overlay.
8. Registrar estados e recomendações para análise posterior.

### Recomendações iniciais desejadas

Começar com poucas categorias:

- compra;
- recall;
- objetivo;
- farm/lane;
- visão.

Não tentar resolver todo o jogo no MVP.

---

# 6. Fora do escopo inicial

NÃO implementar inicialmente:

- LLM;
- ChatGPT;
- Machine Learning;
- Computer Vision;
- OCR;
- leitura de memória do processo do League;
- engenharia reversa;
- automação de cliques;
- compra automática de itens;
- uso automático de habilidades;
- movimentação automática;
- botting;
- qualquer mecanismo que jogue pelo usuário;
- informações que o jogador normalmente não teria acesso.

A arquitetura deve permitir adicionar IA futuramente, mas o MVP deve funcionar sem IA generativa.

---

# 7. Estratégia de IA

Uma decisão arquitetural importante:

**IA não deve ser usada apenas porque o projeto se chama AI Coach.**

No MVP, devemos preferir:

```text
Game State
    ↓
Rules / Decision Engine
    ↓
Recommendation
```

Em fases futuras:

```text
Game State
    ↓
Features
    ↓
Rules + ML
    ↓
Decision
    ↓
LLM
    ↓
Explanation
```

O LLM poderá futuramente ser utilizado para:

- explicar recomendações;
- gerar coaching personalizado;
- analisar partidas;
- identificar padrões;
- conversar com o jogador;
- transformar dados estruturados em explicações naturais.

Entretanto, decisões críticas e determinísticas não devem depender inicialmente de um LLM.

---

# 8. Conceito central: Game State

O sistema deve possuir um modelo interno e normalizado do estado da partida.

Exemplo conceitual:

```typescript
interface GameState {
  gameTime: number;

  player: PlayerState;

  allies: PlayerState[];

  enemies: PlayerState[];

  objectives: ObjectiveState[];

  structures: StructureState[];

  metadata: GameMetadata;
}
```

O Game State deve ser independente da implementação específica da API.

A camada responsável por coletar dados deve transformar os dados externos nesse modelo.

Arquitetura:

```text
League Data Source
       ↓
Game Data Collector
       ↓
Game State Normalizer
       ↓
GameState
```

---

# 9. Decision Engine

O Decision Engine é responsável por interpretar o Game State.

Ele não deve estar acoplado à interface.

Exemplo:

```text
GameState
   ↓
PurchaseEvaluator
   ↓
Recommendation
```

Outro exemplo:

```text
GameState
   ↓
ObjectiveEvaluator
   ↓
Recommendation
```

Cada tipo de decisão deve ser implementado de maneira modular.

---

# 10. Recommendation

As recomendações devem possuir uma estrutura semelhante a:

```typescript
interface Recommendation {
  type: RecommendationType;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  reason?: string;
  confidence?: number;
  createdAt: number;
  expiresAt?: number;
}
```

O sistema deve evitar spam.

Uma característica importante do produto é:

> **O coach deve ficar em silêncio quando não houver uma recomendação realmente relevante.**

Não queremos uma interface cheia de notificações.

---

# 11. Exemplo de overlay

O overlay deve ser pequeno e discreto.

Exemplo conceitual:

```text
┌──────────────────────────┐
│ 🧠 AI COACH              │
│                          │
│ 🛒 PRÓXIMA COMPRA        │
│ Item X                   │
│                          │
│ 🏠 RECALL                │
│ Prepare-se para Dragão   │
│                          │
│ 🎯 PRIORIDADE            │
│ Push mid → objetivo      │
└──────────────────────────┘
```

O design final ainda não foi definido.

Prioridades:

1. legibilidade;
2. baixo consumo;
3. pouca distração;
4. atualização em tempo real;
5. possibilidade de esconder/minimizar.

---

# 12. Fonte de dados

A implementação deve utilizar somente métodos permitidos e documentados.

Devemos investigar e utilizar, quando apropriado:

- League of Legends Live Client Data API;
- Riot Developer APIs;
- Data Dragon;
- outras fontes oficiais ou claramente permitidas.

Não utilizar:

- leitura de memória;
- offsets;
- engenharia reversa;
- hooks;
- métodos para contornar proteções;
- dados deliberadamente ocultados do jogador.

Se uma informação necessária não estiver disponível de forma apropriada, devemos documentar a limitação e discutir uma alternativa.

**Nunca tentar contornar a limitação automaticamente.**

---

# 13. Riot Games / compliance

O projeto deve ser desenvolvido considerando as políticas atuais da Riot Games.

É necessário diferenciar:

- tecnicamente possível;
- permitido pela API;
- permitido pelas políticas de terceiros;
- potencialmente considerado vantagem indevida.

Não assumir que uma funcionalidade é permitida apenas porque pode ser tecnicamente implementada.

Antes de implementar funcionalidades de alto risco, devemos verificar a documentação/política atual da Riot.

O sistema NÃO deve:

- controlar o jogo;
- tomar ações automaticamente;
- executar comandos;
- automatizar gameplay;
- fornecer informações ocultas;
- manipular o cliente;
- interferir no processo do jogo.

---

# 14. Stack preferencial

### Backend / Game Agent

- Node.js
- TypeScript

### Frontend

- React
- TypeScript

### Database

Inicialmente:

- SQLite

Futuramente:

- PostgreSQL

### Desktop / Overlay

Avaliar:

- Tauri;
- Electron;
- outras opções apropriadas.

Priorizar baixo consumo de recursos e simplicidade.

### ML futuro

- Python;
- bibliotecas de ML adequadas ao problema.

---

# 15. Filosofia arquitetural

Queremos uma arquitetura modular, mas sem overengineering.

Separar claramente:

```text
Data Collection
       ↓
Normalization
       ↓
Domain / Game State
       ↓
Decision Engine
       ↓
Recommendation
       ↓
Presentation
```

A lógica de negócio não deve ficar nos componentes React.

A UI não deve conhecer detalhes da API do League.

O Decision Engine deve poder ser testado sem League aberto.

---

# 16. Testabilidade

É importante existir um modo de desenvolvimento com Game State mockado.

Devemos conseguir executar:

```text
Mock GameState
      ↓
Decision Engine
      ↓
Recommendation
```

sem abrir League.

Isso permitirá testar regras rapidamente.

Os testes devem cobrir principalmente:

- normalização;
- regras;
- prioridades;
- expiração;
- ausência de dados;
- mudanças de estado;
- início de partida;
- fim de partida.

---

# 17. Logging

O sistema deve possuir logs úteis para desenvolvimento.

Exemplo:

```text
[19:32:01] Game detected
[19:32:02] Player identified
[19:32:03] Game state updated
[19:32:05] Recommendation generated
[19:32:05] BUY_ITEM
```

Evitar logs excessivos em produção.

---

# 18. Aprendizado do desenvolvedor

Este projeto também é um projeto de **aprendizado**.

A pessoa desenvolvendo o projeto já possui experiência com:

- JavaScript;
- TypeScript;
- Node.js;
- React;
- Angular;
- APIs;
- bancos de dados;
- desenvolvimento web.

O objetivo de aprendizado adicional é:

- engenharia de requisitos;
- product thinking;
- arquitetura;
- sistemas de recomendação;
- processamento de dados;
- Machine Learning;
- LLMs;
- agentes de IA;
- avaliação de IA;
- desenvolvimento assistido por IA.

Portanto, ao trabalhar neste projeto, a IA deve agir também como **mentor técnico**, e não apenas como gerador de código.

---

# 19. Como a IA deve trabalhar comigo

Não gerar grandes quantidades de código sem necessidade.

Antes de implementar uma funcionalidade:

1. entender o requisito;
2. identificar dependências;
3. analisar o código existente;
4. propor uma solução;
5. explicar trade-offs;
6. criar um plano pequeno;
7. só então implementar.

Quando houver dúvida ou requisito ambíguo:

**perguntar antes de assumir.**

Não inventar requisitos.

Não inventar APIs.

Não modificar arquitetura sem explicar o motivo.

Quando implementar algo, explicar brevemente:

- o que foi alterado;
- por que foi alterado;
- como testar;
- quais limitações existem.

---

# 20. Engenharia de requisitos

O desenvolvimento deve seguir aproximadamente:

```text
Problema
   ↓
Objetivo do usuário
   ↓
Requisito
   ↓
Critérios de aceitação
   ↓
Design técnico
   ↓
Task
   ↓
Implementação
   ↓
Teste
   ↓
Review
```

Não pular diretamente de:

```text
"Quero uma funcionalidade"
```

para:

```text
"Criar código"
```

---

# 21. Hipóteses atuais de produto

### Wards

Hipótese:

> O jogador frequentemente não utiliza adequadamente seus recursos de visão, fazendo com que ele e seu time tenham menos informação sobre o mapa e fiquem mais vulneráveis a emboscadas e decisões ruins.

### Lane / distribuição de recursos

Hipótese:

> O jogador tem dificuldade em identificar qual lane oferece a melhor oportunidade de farm após uma luta, fazendo com que jogadores se concentrem na mesma região do mapa e desperdicem recursos disponíveis.

### Compras

Hipótese:

> O jogador tende a seguir recomendações genéricas de itens em vez de adaptar suas compras ao contexto específico da partida, podendo perder oportunidades de obter vantagens contra a composição ou situação atual dos adversários.

Essas são **hipóteses**, não requisitos finais.

Elas devem ser validadas e refinadas antes da implementação.

---

# 22. Visão de longo prazo

A evolução esperada:

### Fase 1
Game State + regras simples.

### Fase 2
Recomendações em tempo real.

### Fase 3
Histórico de partidas.

### Fase 4
Análise pós-jogo.

### Fase 5
Perfil individual do jogador.

### Fase 6
Machine Learning.

### Fase 7
LLM para explicações e coaching.

### Fase 8
Personal AI Coach.

---

# 23. Princípio principal

O projeto não deve tentar responder:

> "Qual é a melhor jogada possível em League of Legends?"

O objetivo inicial é muito mais específico:

> **"Dado o estado atual da partida, existe alguma informação importante que o jogador provavelmente deveria considerar agora?"**

Esse princípio deve orientar o MVP.

---

# 24. Estado atual do projeto

Status:

**Discovery / definição de produto**

Ainda não começar a implementação do MVP.

Próximos passos desejados:

1. finalizar a definição do problema;
2. definir objetivos do usuário;
3. criar PRD;
4. definir requisitos funcionais;
5. definir critérios de aceitação;
6. definir arquitetura técnica;
7. criar roadmap;
8. somente então iniciar implementação.

---

# 25. Regra para este projeto

**Não construir o produto inteiro de uma vez.**

Trabalhar em pequenos incrementos.

Cada incremento deve resultar em algo que possa ser:

- executado;
- testado;
- entendido;
- revisado.

A prioridade é:

> **Aprender a construir o produto usando IA, e não apenas fazer a IA construir o produto.**