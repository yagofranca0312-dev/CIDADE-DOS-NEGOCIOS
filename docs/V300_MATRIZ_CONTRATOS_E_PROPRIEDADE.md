# V3.0.0 — Inventário de propriedade única, contratos e fluxos da V2

**Data:** 07/11/2026  
**Escopo:** gate `3.0.0-01` (inventário final), `3.0.0-02` (contratos/API única) e parte do `3.0.0-03` (regressão cruzada).  
**Referência:** roadmap HTML original de 04/11/2026, sem antecipar a interface V3.1.  
**Fonte da auditoria:** `src/core/game.js`, `src/ui/*.js`, `tools/build.mjs`, `tests/*.test.mjs`, `docs/ARQUITETURA.md`; branch de auditoria, sem alterar gameplay.  
**Estado:** **INVENTÁRIO DOCUMENTADO / TESTES EM VALIDAÇÃO; HOMOLOGAÇÃO V3.0 PENDENTE.**

## 1. Contrato canônico observável

```text
Interface / timer / formulário
  -> src/ui/app.js::commit(type, payload)
  -> CidadeCore.dispatch(state, { id, type, payload })
      -> clone do estado, validação e registro de comando
      -> handler() ou init()
          -> executores responsáveis: compras / venda diária / finanças / RH /
             fiscal simulado / fiscal operacional / logística / IA
          -> journal() (único push no ledger) e event() (único push nos eventos)
      -> validate(draft) e commit atômico do novo estado
  -> render() + saveLocal() (localStorage com leitura de retorno)
  -> exportSave() V1 ou exportSaveCompact() V2 para portabilidade
  -> importSave() verifica checksum e estrutura antes de substituir estado
```

**Unicidade estática constatada no código da branch:** há **uma** definição `dispatch`, `journal`, `event`, `day`, `registerPurchase` e `registerSale`. Há **um** ponto `draft.economy.ledger.push`, **um** `draft.audit.events.push`, e **um** `Core.dispatch` nos arquivos `src/ui/*.js` (dentro de `commit`). Isso garante um ponto único de *escrita física*, mas não garante sozinho ausência de eventos semanticamente duplicados; exigem testes de fluxo.

**Classificação:** `src/core/game.js` = fonte autoritativa de dados e mutações; `src/ui/*.js` e `src/visual/*` = visualização, interação e estado efêmero; `tools/build.mjs` = agregação de fontes no HTML offline, não motor separado.

## 2. Matriz rastreável — áreas V2, comandos, proprietário e testes

| Área / origem | Porta de entrada ou consulta | Proprietário do efeito | Fonte autoritativa / persistência | Teste / evidência | Situação |
|---|---|---|---|---|---|
| Carreira / grupo / filiais (V2.0–V2.3) | `CARREIRA.CRIAR`, `EMPRESA.ABRIR`, `EMPRESA.ATIVAR` | `init`, `handler` | `world`, `player`, ledger `CAPITAL`, `OPENING` | `multiunit_v15`, `release_v240`, `integration_v300_consolidation` | Implementado; gate global pendente |
| Preços, demanda e vendas (V2.3) | `PRECO.DEFINIR`, `PROMO.DEFINIR`, `TEMPO.*`; `VENDA.REGISTRAR` rejeitado | `day` chama `registerSale` uma vez por unidade com demanda | `b.products`, `b.sales`, ledger `SALE`, evento `VENDA.CONCLUIDA` | `commerce_v12`, `market_v13`, `ownership_v300_contracts` | Dono único identificado |
| Compra manual / múltiplos itens (V2.3) | `ESTOQUE.COMPRAR`, `COMPRAS.REGISTRAR` | `registerPurchase` | `purchaseOrders`, `IN_TRANSIT`, ledger `PURCHASE`, evento `COMPRA.ENCOMENDADA` | `replenishment_v23b`, `ownership_v300_contracts` | Dono único identificado |
| Paralegal simulado (V2.4-A) | `PARALEGAL.PROTOCOLAR` e passagem do tempo | `handler`, `processParalegalDue` | Eventos `PARALEGAL.*`, `PARALEGAL_FEE` | `paralegal_v24a`, `integration_v300_consolidation` | Simulado; sem obrigação legal |
| RH e folha simulada (V2.4-B) | `RH.CONTRATAR`, `RH.DESLIGAR`, `RH.PAGAR_FOLHA`, fechamento de mês | `rhEmployees/rhReport` leem eventos; `accruePayrollMonth` reconhece; `handler` quita | Eventos RH, ledger `PAYROLL_ACCRUAL/PAYROLL_PAYMENT` e `PAYABLE` | `rh_v24b`, `stabilization_v241`, `ownership_v300_contracts` | Sem dupla despesa identificada; risco PR-01 |
| Fiscal operacional interno (V2.4-C) | `FISCAL_OP.ATIVAR/CONCLUIR_TAREFA/FECHAR` | `handler` e `fiscalOperationsReport` | Eventos `FISCAL_OP.*`, **sem apuração de tributos** | `fiscal_operacional_v24c`, `integration_v300_consolidation`, `ownership_v300_contracts` | Distinto do fiscal monetário |
| Despesas e passivos (V2.4.1) | `TEMPO.*`, `PAYABLES.PAGAR_OPERACIONAL` | `day` reconhece `DAILY_EXPENSE`; `handler` baixa `OPERATING_SETTLEMENT` | `PAYABLE` via ledger; `operatingPayablesReport` somente leitura | `stabilization_v241`, `integration_v300_consolidation` | Quitação não repete despesa |
| Tributação didática (V1.9 → V2) | `FISCAL.ATIVAR_CENARIO/PAGAR_SIMULADO`; fechamento do mês | `closeTaxMonth` e `handler` | `state.fiscal`, `TAX_EXPENSE/TAX_PAYABLE` | `fiscal_v19`, `fiscal_operacional_v24c` | Distinto de fiscal operacional; nunca obrigação real |
| Progressão, dilemas, IA, rivais (V2.5–V2.6) | `DILEMA.ESCOLHER`, `MUNDO.CONCORRENCIA_ATIVAR`, `IA.AJUSTAR_PRECO`, `TEMPO.*` | `chooseDilemma`, `rivalAllocation/CompleteDay`; `day` governa ticks | `world.rivalEconomy`, audit; vendas do jogador continuam em `registerSale` | `journey_v250_integral`, `rivals_v260`, `integration_v300_consolidation` | Mercado rival não grava receita do jogador |
| Crédito e dívida (V2.7) | `CREDITO.CONTRATAR/PAGAR/RENEGOCIAR`, calendário | `handleFinanceCommand`, `processFinancingDay`; lançamentos via `journal` | `economy.financing`, `LOAN_PAYABLE`, `INTEREST_PAYABLE`, etc. | `credit_v270`, `integration_v300_consolidation` | Crédito não representa receita |
| Contratos de fornecedor (V2.7) | `CONTRATO.FORNECEDOR.*`, vencimento em `day` | `financeContractCycle` chama **o mesmo `registerPurchase`** | `economy.financing.contracts`, `purchaseOrders`, `CONTRACT_PAYABLE` | `credit_v270`, `ownership_v300_contracts` | Um pedido por ciclo executado |
| CD, transferências, perecibilidade (V2.8) | `LOGISTICA.*` | `handleLogisticsCommand`, `logisticsDue`, `logisticsReceiveTransfer` | `economy.logistics`, `INVENTORY`, `IN_TRANSIT`, `INTERNAL_CLEARING` | `logistics_v280`, `integration_v300_consolidation` | Transferência não gera venda / clearing zera |
| Produção e insumos (V2.8) | `LOGISTICA.PRODUZIR/INSUMO.COMPRAR` | `handleLogisticsCommand`; compra delegada ao **`registerPurchase`** | `products`, `logistics.batches`, ledger `LOGISTICS_PRODUCTION` | `logistics_v280` | Produção capitaliza custo; não gera receita |
| Diagnóstico e backup (V2.9) | `qualityReport`, `saveHealthReport`, `exportSave*`, `importSave` | Consultas puras, validadores e codec do motor | `schemaVersion=9`, envelopes V1 e V2 compacto | `quality_v290`, `integration_v300_consolidation` | Compatibilidade automatizada parcial |
| Patch A presente na V3.0 alpha | `operationalBalanceReport`, `ECONOMIA.COMPRAR_PLANO` | Cotação somente leitura; execução delegada ao **`registerPurchase`** | `purchaseOrders`, ledger `PURCHASE`, evento explicativo `ECONOMIA.COMPRA_PLANEJADA` | `economy_v300_patch_a`, `ownership_v300_contracts` | Preservado; não homologado |
| UI / UX / mapa (V2.0–V2.3) | `src/ui/app.js::commit`, renderizadores e `src/visual/*` | `commit` despacha; visualização não lança ledger | `state` do motor; estado visual efêmero | `visual_v21`, `visual_v22`, `structure` e teste estático de ownership | QA de navegador pendente |

**Interpretação contábil:** `journal()` é o **único escritor** do razão; `financialReport`, `balanceSheet`, `cashFlowStatement`, `reconciliationReport`, `qualityReport`, `operationalBalanceReport` leem o razão e/ou estado para apresentar informações. Consultas podem usar diferentes agregações, mas não podem lançar despesas ou receita.

## 3. Fluxos críticos e invariantes

| Fluxo | Condição de unicidade | Efeito econômico permitido |
|---|---|---|
| Compra por formulário, multi-item, logística, contrato ou Patch A | Todos passam por `registerPurchase` | **1** `PURCHASE` por encomenda aceita, saída de `CASH` e entrada `IN_TRANSIT`; nenhuma receita |
| Recebimento de fornecedor | `receiveDueOrders` só processa `PENDING` | `IN_TRANSIT → INVENTORY` exatamente uma vez |
| Venda gerada por demanda | `day → registerSale`, sem venda manual | `CASH/REVENUE` e `COGS/INVENTORY`; uma venda agregada por unidade/dia |
| Transferência entre instalações | `LOGISTICA.TRANSFERIR` e recebimento por `logisticsDue` | `INVENTORY → IN_TRANSIT → INVENTORY`; `INTERNAL_CLEARING = 0`; nunca receita |
| Financiamento | `CREDITO.CONTRATAR` uma vez pelo ID de comando | `CASH/LOAN_PAYABLE`; nenhuma receita/capital fictício |
| Folha | `accruePayrollMonth` no encerramento do mês, `RH.PAGAR_FOLHA` na quitação | Competência `EXPENSE/PAYABLE`; pagamento `PAYABLE/CASH`; sem recontabilizar `EXPENSE` |
| Fiscal operacional | Checklists internos e fechamento com conciliação | Apenas eventos; fechamento não gera tributo e não mexe em caixa |
| Fiscal monetário didático | Apenas opt-in, competência futura, apuração única | `TAX_EXPENSE/TAX_PAYABLE` se e quando a simulação cobrir a regra |
| Relatório / render / exportação | Apenas leitura do snapshot | **0** mutações de ledger, tempo, eventos e RNG |
| Repetição de comando | `audit.commands[id]` confere conteúdo | Resposta `DUPLICATE` sem segundo efeito; IDs conflitantes rejeitados |

**Regras de teste:** `tests/ownership_v300_contracts.test.mjs` verifica estrutura de propriedade única e esses efeitos; `tests/integration_v300_consolidation.test.mjs` verifica coexistência dos sistemas no mesmo save.

## 4. Riscos e divergências identificáveis — não confundir com falha comprovada

- **PR-01 — fórmula duplicada para folha futura x competência.** `estimatedPayrollMonth()` e `accruePayrollMonth()` implementam cálculos de pró-rata semelhantes em funções distintas. A primeira **não** lança contabilidade; a segunda reconhece a obrigação. Não se observou dupla despesa, mas uma futura alteração pode fazer previsão e apuração divergirem. **Tratamento:** teste de paridade; avaliar extração de helper puro em patch específico, com regressão.
- **PR-02 — propostas de reposição paralelas.** O planejamento visual manual em `src/ui/restock-views.part.js` e a cotação gerencial do Patch A (`operationalBalanceReport`) estimam compras de modos diferentes. Ambos executam por comandos que convergem no **mesmo `registerPurchase`**, portanto não há segundo escritor de estoque/ledger. **Tratamento:** manter critérios de cotação explicitados e testar divergência/recusa por orçamento e capacidade antes de unificar UX.
- **PR-03 — persistência dependente do navegador.** `src/ui/app.js::saveLocal` usa `localStorage`; o core exporta/importa JSON portável. Testes Node não demonstram `file://` no Windows, recuperação após quota do navegador ou importação real do jogador. **Tratamento:** gate manual V3.0-04/08.
- **PR-04 — projeções são derivadas.** `financialCommitmentsReport`, `strategyReport` e relatórios de estoque estimam cenários sem afetar razão. Diferença de projeção não constitui duplicação contábil. **Tratamento:** preservar distinção entre previsto, comprometido e realizado.
- **PR-05 — cobertura da árvore V2.** Uma regressão estática sobre os caminhos auditados não equivale a teste de *todo* ramo condicional, ciclo de longa duração em computador real ou revisão de segurança completa. **Tratamento:** manter gate V3.0-03 como parcial até conclusão transversal.

## 5. Critério de encerramento e próximos gates

- **Etapa 3 — inventário e matriz de contratos:** documentação e testes estruturais/semânticos nesta branch; atualizar estado só após confirmar CI no commit do teste.
- **`3.0.0-01` (inventário):** cobertura das áreas do plano rastreada aos módulos, comandos e testes; falta evidência funcional manual dos painéis e matriz detalhada por cada cenário histórico.
- **`3.0.0-02` (contratos):** ponto único de escrita documentado e com testes; PR-01 e PR-02 requerem decisão técnica para impedir divergência futura.
- **`3.0.0-03` (auditoria cruzada):** testes automatizados integrados existentes; pendentes ambientes externos e fluxos pouco exercitados.
- **Próxima etapa sugerida:** matriz de migração e integridade de saves reais de V2, QA de rollback, documentação canônica; depois hardware/browser e aceite da V3.0.

**PROTEÇÃO:** não publicar V3.0.0 como homologada, não fazer merge automático da PR #39, não reverter ou reimplementar o Patch A, não usar dados financeiros ou fiscais reais em testes.
