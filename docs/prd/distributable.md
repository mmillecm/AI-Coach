# PRD — Incremento: Coach compartilhável (executável portátil)

## 1. Problema

O AI Coach hoje funciona apenas como código-fonte: para usar o produto, a pessoa precisa clonar o repositório, ter Node.js e npm instalados, executar `npm install`, `npm run build` e `npm run overlay`. Isso impede que o coach seja **compartilhado** com outros jogadores e validação com pessoas fora do ambiente de desenvolvimento.

O objetivo de produto (MVP) é entregar algo que outro jogador intermediário consiga executar com o mínimo de esforço — idealmente **dar duplo clique em um arquivo**.

## 2. Objetivo do usuário

O jogador que receber o coach quer:

1. abrir e usar o overlay sem instalar nada (Node.js, npm, dependências);
2. ter o mesmo comportamento que na versão de desenvolvimento: coleta da Live Client Data API, recomendações de recall/visão, janela transparente sempre-no-topo;
3. não precisar entender de código para usar.

## 3. Requisitos funcionais

- **RF-01 — Geração do executável portátil**
  O comando de distribuição deve gerar um único arquivo `.exe` (target `portable`) para Windows, contendo o app Electron completo.

- **RF-02 — Lógica embutida no executável**
  O `.exe` deve conter a lógica de `core` (Decision Engine: recall e vision) e `collector` (coleta e normalização da Live Client Data API) embutidas, sem depender de pacotes externos em tempo de execução.

- **RF-03 — Mesmo comportamento do app de desenvolvimento**
  O overlay empacotado deve manter o comportamento existente: polling a cada 3s, janela transparente/sempre-no-topo/click-through, atalho `Ctrl+Shift+X` para sair, comunicação segura via preload (`contextIsolation: true`, `nodeIntegration: false`).

- **RF-04 — Assets do renderer inclusos**
  O executável deve conter `index.html` e o JS do renderer para que a janela funcione.

- **RF-05 — Script de distribuição documentado**
  Deve existir um comando `dist` (no `packages/overlay` e espelhado na raiz) que executa o fluxo completo: build do TypeScript → bundle → empacotamento.

## 4. Requisitos não funcionais

- **RNF-01 — Simplicidade de uso**: o usuário final não deve precisar de Node.js, npm nem conhecimento de terminal.
- **RNF-02 — Tamanho**: aceito o overhead do Electron (~90MB); nada além do necessário deve entrar no pacote (excluir testes, fixtures, mock server, source maps, devDependencies).
- **RNF-03 — Manutenibilidade**: a configuração de empacotamento deve ficar declarativa no `package.json` do overlay e o bundle em um script pequeno e legível.
- **RNF-04 — Compliance**: o executável não adiciona nenhuma capacidade além do que o código atual já faz (apenas leitura via Live Client Data API). Nenhuma nova fonte de dados.
- **RNF-05 — Testável**: o empacotamento deve poder ser verificado com o mock server (partida simulada) sem abrir o League.

## 5. Critérios de aceitação

- **CA-RF-01**: `npm run dist` (raiz) gera um arquivo `release/AI Coach-0.1.0-portable.exe` sem erros.
- **CA-RF-02**: Ao abrir o `.exe` com o mock rodando (`npm run mock`), o overlay aparece e exibe status, HP/mana/ouro e recomendações (ex.: recall) — mesma saída da versão de desenvolvimento.
- **CA-RF-03**: O `.exe` funciona em uma máquina Windows **sem** Node.js/npm instalados.
- **CA-RF-04**: O bundle resultante contém a lógica de core/collector embutida (verificado pelo esbuild); nenhuma dependência externa de runtime além do Electron.
- **CA-RF-05**: `Ctrl+Shift+X` fecha o app empacotado.
- **CA-RF-06**: O pacote não contém `mockServer`, fixtures nem testes (verificável pelo log do electron-builder / inspeção do asar).
- **CA-RF-07**: O script `dist` falha com mensagem clara se o build do TypeScript falhar (não empacota código quebrado).

## 6. Fora do escopo

- Instalador NSIS / atalhos / registro do Windows (será reavaliado se o compartilhamento demandar).
- Assinatura digital / certificado (SmartScreen continuará avisando; ok para MVP).
- Ícone personalizado do executável.
- Atualizador automático / auto-update.
- CLI (`packages/collector/src/cli.ts`) empacotado como `.exe` separado.
- Mock server dentro do executável (ferramenta de desenvolvimento, não do produto).
- Suporte a macOS/Linux (MVP é Windows).
- AppImage/outros formatos Linux.

## 7. Riscos e limitações

- **Symlinks do npm workspaces**: os pacotes `@ai-coach/core` e `@ai-coach/collector` são symlinks no `node_modules` raiz; electron-builder pode não resolver corretamente. Mitigação: **bundle com esbuild** embute todo o código em um arquivo único antes do empacotamento, eliminando o problema.
- **Caminhos no main process**: `main.ts` usa `__dirname` e caminhos relativos para `preload.cjs` e `index.html`; a estrutura do bundle pode mudar esses caminhos. Mitigação: ajustar a resolução de caminhos para a estrutura `dist/bundle/` (CA-RF-03/04 exigem isso).
- **SmartScreen / AV**: executável sem assinatura pode gerar aviso do Windows Defender. É esperado no MVP; documentar para o usuário final.
- **Versão do Electron no workspace**: o overlay depende de `electron` como devDependency do workspace; o electron-builder precisa do binário correto. Verificar se o download do Electron ocorre sem problema no ambiente.
- **Portable vs instalador**: `portable` descompacta para um diretório temporário ao rodar (leve delay na primeira execução); é o trade-off aceito por não exigir instalação.

## Notas para o design técnico (próximo passo)

- Ferramentas: `esbuild` (bundle do main process + preload + renderer) e `electron-builder` (empacotamento `--win portable`).
- Configuração declarativa no `package.json` do overlay (`build` key) + scripts `bundle` e `dist`.
- Estrutura de saída do bundle:
  ```text
  packages/overlay/dist/bundle/
    main.js          ← main process com core+collector embutidos
    preload.cjs      ← preload (electron externo)
    renderer.js      ← lógica da UI
    index.html       ← cópia do renderer
  ```
- Ajustar resolução de caminhos no `main.ts` para a estrutura `dist/bundle/`.
- Verificação: rodar o `.exe` com `npm run mock` em paralelo.