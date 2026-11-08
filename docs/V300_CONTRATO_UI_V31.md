# V3.0 — Checkpoint 3.0.0-07: contrato de apresentação somente-leitura para futura V3.1

**Data:** 07/11/2026 • **Situação:** contrato experimental preparado; não constitui implantação da interface V3.1.  
**Base estável:** V2.9.0 formalmente homologada (`releases/v2.9.0-homologada`, commit `082faa4626cf5cb0fc54c9ef092bddd86ffce54c`).  
**Código de desenvolvimento:** `3.0.0-alpha.1` com Patch A integrado à `main`, **sem homologação da V3.0 final**.  
**Área afetada:** `src/contracts/v31-read-model.mjs`, **não embutido no `index.html` atual**; testes `tests/v31_read_model_contract.test.mjs`.  
**Contrato técnico:** `CIDADE_V31_READ_V1`, `version:1` (versão do **contrato visual**, não do save).

## Objetivo e fronteira técnica

Preparar a interface futura mais visual/imersiva **sem criar um segundo motor de jogo**. A V3.1 deverá consumir projeções observacionais de cidade, lotes, unidades, eventos e intenções permitidas para a apresentação; **todos os efeitos econômicos seguem exclusivamente em `CidadeCore.dispatch`**. O contrato é um ensaio testável e reutilizável, mas **nenhuma tela V3.1 foi implementada ou ativada**.

```text
CidadeCore state (validado após import/dispatch)       ÚNICA FONTE DE VERDADE
                    |
                    v
src/contracts/v31-read-model.mjs                       ADAPTADOR PURO, DEV-ONLY
  createV31ReadModel(core)
    ├─ listCities()                                    CATÁLOGO DE 30 CIDADES
    ├─ readCity(state,{cityId,selectedLot})            PROJEÇÃO DE 18 LOTES
    ├─ readEvents(state,{mode,limit,afterSeq,cityId})  EVENTOS CONFIRMADOS
    ├─ readActionHints(state,{cityId,lot})             AFFORDANCES CONSULTIVAS
    └─ isCurrent(model,state)                          STALE VIEW / REVISÃO
                    |
                    v
V3.1 overlay futuro (ainda NÃO existe)                 DOM / mapa / efeitos visuais
   ↳ seleção visual de lote, pan/zoom, filtros          SOMENTE UI EFÊMERA
   ↳ confirmação explícita de ação real
                    |
                    v
src/ui/app.js::commit → CidadeCore.dispatch             ÚNICA PORTA DE MUTACÃO
  → estado novo com revisão e eventos                   ÚNICA ORIGEM DE TICKS
  → render/persistência                                 SEM DUPLICAÇÃO DE EFEITO
```

**Não criar segundo `dispatch`, `day()`, `journal()`, `event()`, ledger, vendas, despesas, relógio, RNG, save ou geração procedural de economia.** Interface e animação não podem inventar propriedades, cidadãos, trânsito, construções, investidores ou movimentos financeiros. Mapas artísticos poderão ser enriquecidos somente em um patch de interface V3.1 aprovado separadamente, usando entidades presentes no state.

## API experimental e seus contratos

| Leitura | Entrada | Saída estável | Restrições |
|---|---|---|---|
| `listCities()` | Nenhuma | 30 cidades com id/nome/UF/porte; população 2026 e PIB 2023 identificáveis como fontes, fator econômico classificado como **SIMULATED** | Não confundir o índice do jogo com classificação estatística real |
| `readCity(state,{cityId,selectedLot})` | Snapshot válido, cidade opcional, lote 1–18 ou null | Identidade `worldId/revision`, cidade, lotes, posse da rede, setor, estoque, unidade ativa e resumo do grupo em centavos | **UNCLAIMED_BY_PLAYER não prova** ausência de ocupação por terceiros (nenhum sistema de posse de NPC por lote foi fornecido); não expor referências do state |
| `readEvents(state,{mode:'recent',limit,cityId})` | Snapshot, limite 1–100 | Eventos do mais novo ao mais antigo, paginados, com texto **PLAIN_TEXT**; `hasMore` | Não expor `event.data` completo, JSON de saves ou razão; não inferir que evento do jogo é notícia real |
| `readEvents(state,{mode:'delta',afterSeq,limit,cityId})` | Sequência de evento confirmada, limite 1–100 | Eventos após cursor, **ordem cronológica**, `nextSeq`, `hasMore` | Se `hasMore`, consultar próxima página; nenhuma entrada omitida pode ser considerada processada. O índice de eventos é varrido em memória; evitar polling a cada frame |
| `readActionHints(state,{cityId,lot})` | Snapshot, seleção de lote | Opções `UI_ONLY` ou `GAME_COMMAND`, `advisoryEnabled` e campos esperados, `authority:'ADVISORY_ONLY'` | As dicas não autorizam a ação. `Core.dispatch` revalida caixa, ocupação, limite, revisão/cotação e idempotência |
| `isCurrent(model,state)` | Modelo renderizado e snapshot atual | Booleano sobre `worldId`, `revision`, `schemaVersion` e versão do contrato | Ao mudar de carreira, importar save ou avançar tempo, descartar overlay obsoleto |

**Fonte da unidade:** `Core.businesses(state)`; **resumo:** `Core.overview(state)`; **catálogo:** `Core.CITIES`, `Core.SECTORS`. Nenhuma estrutura no contrato presume geocoordenadas, malha viária, trajeto real, motor 3D ou eventos financeiros adicionais. O layout artístico existente continua propriedade de `src/visual/city-scene.js` e `src/visual/tiangua-scene.js`, e não do read-model.

### Exemplo de uso em código de desenvolvimento (NÃO está no jogo atual)

```js
import {createV31ReadModel} from './src/contracts/v31-read-model.mjs';

const view = createV31ReadModel(CidadeCore);
const city = view.readCity(state,{cityId:'CE-TIANGUA',selectedLot:2});
const feed = view.readEvents(state,{mode:'recent',limit:20});
const hints = view.readActionHints(state,{cityId:'CE-TIANGUA',lot:2});

// city/feed/hints são objetos imutáveis sem referência editável ao state.
// Se precisar executar algo, a UI futura deve obter confirmação e chamar
// o commit() já existente, que é o ÚNICO caminho para CidadeCore.dispatch.
// Nem o adapter nem o render chamam dispatch.
```

## Eventos, interações e propagação

1. A camada visual lê **snapshot já validado** pelo motor. Não chama `Core.validate` no `requestAnimationFrame`: validação completa de 20 mil eventos é custosa e já ocorre no despacho/importação.
2. O read-model retorna **objetos congelados recursivamente** com campos selecionados, sem entregar `state`, referências de `products`, o ledger ou `audit.commands`.
3. Os eventos vêm de `state.audit.events`, não da lista concorrencial específica `world.rivalEconomy.events`. A integração futura de eventos rivais exige **outro adaptador distinto e documentado** para não misturar semânticas.
4. O filtro de cidade usa `businessId` da unidade vinculada ou `data.cityId` presente no evento. Eventos globais sem cidade **não são automaticamente atribuídos a uma cidade**.
5. A UI recebe **texto não confiável**; usar `textContent` ou escape adequado. Nunca escrever `text` em `innerHTML` sem sanitização.
6. A seleção de lote é **UI_ONLY**, não é comando econômico, não incrementa revisão nem grava no save. A navegação visual (câmera, zoom, animação, hover, filtros) também pertence ao estado efêmero.
7. Abrir unidade, ativar unidade e avançar dia são **GAME_COMMAND** por **`Core.dispatch`**, sob o caminho já existente `commit`; jamais permitir que botão visual edite `state.world` diretamente.
8. A interface deve preparar um novo ID idempotente por **intenção confirmada**, tratar `APPLIED`, `DUPLICATE` e `REJECTED` do core e não disparar ação novamente no replay de animação.
9. Quando a revisão ou o `worldId` mudar, rejeitar dados de overlays antigos. O contrato não envia transações, não assina eventos e não executa processamento em background.

### Mapa de comandos, apenas indicação visual

| Ação | Tipo | Quem decide e executa |
|---|---|---|
| Selecionar lote | `SELECT_LOT` — `UI_ONLY` | Estado visual do overlay |
| Abrir estabelecimento | `EMPRESA.ABRIR` — `GAME_COMMAND` | `Core.dispatch` com `cityId,lot,sector` |
| Ativar unidade existente | `EMPRESA.ATIVAR` — `GAME_COMMAND` | `Core.dispatch` com `businessId` |
| Avançar um dia | `TEMPO.AVANCAR_DIA` — `GAME_COMMAND` | `Core.dispatch` uma vez por confirmação/tick do controlador já existente |
| Comprar, vender, financiar, fechar folha/fiscal | **Não disponibilizados pelo adaptador de cidade** | Módulos atuais e seus comandos específicos; expandir interface apenas em contrato aprovado depois |

**`advisoryEnabled` não é uma garantia de sucesso**: o estado, a cotação, caixa e o slot podem mudar; só a resposta do motor confirma o efeito. Ações inexistentes, como venda manual registrada diretamente, não devem aparecer no overlay.

## Requisitos não funcionais (contrato para V3.1)

- **Pureza:** leitura não altera revisão, ledger, events, RNG, tempo, estoque, crédito, contratos ou notas fiscais fictícias.
- **Integridade temporal:** mesma carreira + mesma revisão + mesmos parâmetros = mesma projeção (incluindo ordem de eventos). Não usar relógio de sistema em cálculos.
- **Compatibilidade:** save continua `schemaVersion=9`; nenhum campo novo persistido por este contrato.
- **Desempenho:** não calcular checksum, serializar 21 MB nem varrer relatórios inteiros **a cada frame**; ler por mudança de `revision` e paginar eventos no máximo 100 itens por chamada. `readCity` calcula um resumo de balanço do grupo; na V3.1 definitiva, observar custo e cachear com chave `worldId/revision/cityId` se necessário.
- **Acessibilidade:** o V3.1 deverá preservar teclado, leitores de tela, controles por toque, descrições de lotes e semântica DOM; não inferir isso deste contrato, que ainda não desenha telas.
- **Offline:** a interface atual é HTML único sem CDN. O adaptador proposto não cria rede nem introduz SDK externo.
- **Segurança:** sem avaliação de código, HTML bruto ou exposição de dados pessoais; UI deve escapar conteúdo de saves.
- **Arquitetura:** `tools/build.mjs` **não importa nem incorpora** `src/contracts/v31-read-model.mjs`. A aplicação atual V3.0 e o `index.html` seguem no comportamento anterior. A ativação do read-model no build é decisão exclusiva do futuro patch visual V3.1.

## Critérios de aceitação V3.0-07

1. API de leitura versionada documentada, desacoplada de DOM, storage e motor de tempo.
2. Testes instrumentam **nenhuma chamada de `dispatch`**, estado/RNG/journal/eventos idênticos após 120 leituras repetidas.
3. Cobertura de 30 cidades, 18 lotes, filiais em duas cidades, evento recente e delta com cursor; resultados imutáveis e sem vazamento de payload.
4. `EMPRESA.ABRIR`, `EMPRESA.ATIVAR` e avanço de dia continuam indicações; execução real continua no core.
5. `worldId` e `revision` impedem sobreposição de carreira antiga após importações e ticks.
6. Teste de build demonstra que o adaptador **não** é integrado ao HTML atual; a versão/identidade do simulador e schema permanecem.
7. `npm run check`, benchmarks de estabilidade/consolidação, SHA-256 do HTML e CI do commit da etapa: **PASS verificável antes de declarar etapa concluída**.
8. **QA real Windows/desktop/mobile, consumo de memória, animações, responsividade, jogo com saves reais, V3.1 funcional e homologação integral não fazem parte deste PASS técnico**. Gates 01–05 permanecem parciais; 08 bloqueado.

**Após este gate:** não publicar V3.0.0 nem migrar UI para V3.1 antes de resolver as pendências de homologação da V3.0 (em especial persistência `localStorage`, saves reais e QA Windows). A Etapa 8 é **auditoria de prontidão com possível NO-GO**, nunca homologação automática.
