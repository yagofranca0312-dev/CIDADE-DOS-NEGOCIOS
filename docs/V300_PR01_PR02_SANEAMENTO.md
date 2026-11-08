# Cidade dos Negócios — Saneamento P1: PR-01 (folha) e PR-02 (compras)

**Data:** 07/11/2026 — America/Fortaleza.  
**Escopo:** riscos PR-01/PR-02 dos gates `3.0.0-02` e `3.0.0-03`, sem alterar regras contábeis, valores de cargos, motores de compra, saves V1/V2 ou `schemaVersion=9`.  
**Branch:** `audit/v3.0-consolidacao-integral-v2-20261107`, PR #39 permanece DRAFT.  
**Status:** **PR-01 unificado em código; PR-02 corrigido na regra de capacidade total da proposta manual. Ambos sujeitos à CI final e ao QA humano do gate 08.**

## PR-01 — critério único de previsão e competência da folha

**Problema anterior:** `src/core/game.js::estimatedPayrollMonth` (leitura) e `accruePayrollMonth` (escrita) repetiam o cálculo de participação mensal de colaborador. Até aqui **não havia dupla despesa comprovada**, mas modificações em apenas uma fórmula poderiam divergir.

**Correção:** nova função pura interna `payrollPeriodQuote(staff,businessId,period)`, que:
- Filtra quadro ativo no mês com as mesmas regras históricas de contratação e desligamento;
- Calcula dias pró-rata por colaborador, preservando **arredondamento individual** e teto de **30 dias por competência** da V2.4-B;
- Retorna `{amount,eligibleCount}` sem lançar razão ou eventos;
- É usada tanto por `estimatedPayrollMonth` quanto por `accruePayrollMonth`.

**Autoridade contábil:** somente `accruePayrollMonth` lança `PAYROLL_ACCRUAL` de `EXPENSE/PAYABLE`. `RH.PAGAR_FOLHA` baixa `PAYABLE/CASH` uma vez; relatório continua sem mutações. Não foram adicionados encargos, impostos ou regras trabalhistas reais.

**Regressões:** testes de duas unidades, previsão imutável, igualdade entre previsão e fechamento, arredondamento em contratação/desligamento no mês, mês com 31 dias e não duplicação de despesa no pagamento.

**Risco residual:** a fórmula usa **mês-padrão de 30 dias por regra do jogo**, não cálculo legal de folha, 13º, férias, encargos ou pró-rata trabalhista oficial. Não modificá-la silenciosamente em homologação da V3.

## PR-02 — propostas manuais e Patch A com limites consistentes

**Defeito de interface comprovado por inspeção de código:** `restockRoom(unit)` no assistente manual subtraía `stockUnits` e pedidos de fornecedor pendentes da capacidade total `100000`, mas **não subtraía transferências logísticas internas de entrada** (`economy.logistics.transfers` em `PENDING`). Já o escritor canônico `registerPurchase` subtraía essas transferências (`incomingInternal`), assim como a cotação gerencial Patch A. O UI podia considerar uma proposta válida perto de capacidade máxima que o motor recusaria.

**Correção focal:** `restockRoom(unit,groupState)` agora desconta, além de estoque físico e pedidos pendentes, as quantidades de `transfers` pendentes direcionadas à unidade. O estado do grupo é passado explicitamente a:
- `prepareRestockPlan(...,groupState)` — preparação;
- `reviewRestockPlan(...,groupState)` — validação e confirmação;
- `adjustRestockToBudget(...,groupState)` — ajuste por orçamento;
- Os chamadores visuais da interface no painel de reposição.

O parâmetro novo é **opcional**, para não quebrar invocações históricas da API auxiliar da V2.3-B. Quando a UI dispõe do estado real, ele é fornecido. A proposta continua a ser somente leitura; nenhuma transferência cria receita nem pedido ao preparar/revisar.

**Critérios propositalmente distintos — não é erro nem devem ser igualados automaticamente:**
- **Compra manual V2.3-B:** metas e pontos de reposição cadastrados, seleção de itens/fornecedor pelo jogador, ajuste pela disponibilidade integral de caixa, confirmação explícita por `COMPRAS.REGISTRAR`.
- **Patch A gerencial:** estimativa de demanda recente, cobertura de 4/7/12 dias, reserva de custos de 14/7/3 dias e fornecedor predefinido por estratégia, confirmação explícita `ECONOMIA.COMPRAR_PLANO` com `quoteId` e `revision`.
- **Efeito econômico comum:** os dois comandos chamam `registerPurchase`, com **um** `PURCHASE` por compra aceita e **um** evento `COMPRA.ENCOMENDADA`; não há segunda fonte de movimentação de mercadoria.

**Regressões:** transferência verdadeira entre duas unidades no estado do motor, capacidade manual calculada incluindo entrada pendente, cenário de capacidade quase cheia que recusaria quantitativo excessivo, ajuste ao orçamento, testes sem mutação da cotação, compra manual seguida de cotação Patch A renovada, recusa de `quoteId` antigo, restrição de fornecedor/caixa e integridade contábil.

**Risco residual:** planejamentos manuais e estratégicos podem retornar *quantidades diferentes* porque representam políticas diferentes. A aderência entre os números na experiência gráfica precisa ser conferida pelo jogador, inclusive em filiais/CD e compras simultâneas. Uma cotação não garante receita ou entrega.

## Evidência e critérios de encerramento

**Arquivo de regressões:** [`tests/v300_pr01_pr02_consistency.test.mjs`](../tests/v300_pr01_pr02_consistency.test.mjs) — **sete cenários automatizados novos** usando o motor real e as funções reais da UI em VM. As regressões V2.3-B, V2.4-B, V2.9, V3.0 e snapshots antigos permanecem na suíte.

**Arquivo offline:** `index.html` regenerado de `src/core/game.js` e `src/ui/restock-views.part.js`, sem introduzir dependência do browser no motor. A verificação deve comparar hash de bytes no Windows e Linux em commits finais.

**Classificação de risco:**
- `PR-01`: **MITIGATED_CODE_AND_REGRESSION**, aguardando fechamento de CI do SHA final e revisão do teste visual RH;
- `PR-02`: **CONFIRMED_UI_CAPACITY_MISMATCH_FIXED**, aguardando CI final e revisão manual dos limites em telas reais;
- `RG-07` (decisão técnica PR-01/PR-02): **VERIFIED**, com [evidência CI 418/418 no SHA exato](https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS/actions/runs/42435965283); **5/18 requisitos verificados, 13/18 pendentes**;
- `3.0.0-02` e `3.0.0-03`: **ainda PARCIAL** por lacunas de QA pessoal, cenários operacionais e aderência UX; não promovidos automaticamente;
- `3.0.0-08`: **NO-GO**, porque ainda faltam saves pessoais, ambiente desktop do jogador, dispositivos mobile reais, carreiras longas no browser e aceite.

A PR #39 não autoriza merge, tag, release ou homologação; a `main` alpha e a V2.9 homologada permanecem intactas.
