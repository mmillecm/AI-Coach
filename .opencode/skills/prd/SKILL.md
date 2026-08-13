---
name: prd
description: Create a Product Requirements Document (PRD) for the AI Coach project. Use when writing or refining the PRD, defining functional requirements, or establishing acceptance criteria for a feature.
---

# PRD Creation

Create a PRD that follows the requirement engineering flow of the project:

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
```

Do not jump directly from "I want a feature" to "write code."

## PRD structure

Use this template:

1. **Problema** — what problem does this solve? Reference the product hypotheses (wards, lane/resource distribution, purchases) as hypotheses, not final requirements.
2. **Objetivo do usuário** — what is the intermediate player trying to achieve?
3. **Requisitos funcionais** — numbered, testable requirements (RF-01, RF-02...).
4. **Requisitos não funcionais** — performance (low resource usage), testability (decision engine testable without League open), logging, compliance.
5. **Critérios de aceitação** — concrete, verifiable conditions for each requirement.
6. **Fora do escopo** — explicitly what is NOT included in this increment.
7. **Riscos e limitações** — data availability, Riot policies, mock limitations.

## Rules

- MVP scope is deliberately small: purchase, recall, objective, farm/lane, vision.
- The coach must stay silent when there is no relevant recommendation (no notification spam).
- Only permitted and documented data sources (Live Client Data API, Riot Developer APIs, Data Dragon).
- Never assume a feature is allowed just because it is technically possible — check Riot policy.
- The Decision Engine must be testable without League open (mock GameState).

Write the PRD to `docs/prd/<feature>.md` when the user confirms the scope.