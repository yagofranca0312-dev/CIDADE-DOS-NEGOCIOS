# CIDADE DOS NEGÓCIOS — V3.3.2-A: Indicadores Superiores

**Estado:** implementação candidata, sujeita ao Gate A e ao GO explícito do titular para integração.
**Baseline:** V3.3.1 — commit `46fe340410ba1efde0a47d36adc8cda32b270cc5`.
**Contrato:** `CDN-CONTRATO-V332-001`, seção 9, V3.3.2-A.

## Escopo entregue
- Duas faixas superiores: identidade e oito indicadores; abaixo, controles existentes do tempo e câmera.
- Caixa único: `Core.overview.cash`, consolidado, não lucro.
- Data/turno: `state.calendar.date`.
- Vendas do dia: `Core.financialReport(...,'day').revenue`, apenas vendas lançadas.
- Resultado acumulado: `Core.overview.profit`, líquido de despesas e tributos simulados, com rótulo de período correto.
- Estoque crítico: `Core.inventoryReport(state)` da **unidade ativa**, cujo `alert` considera trânsito.
- Contas a vencer: `Core.financialCommitmentsReport(state,30)`, apenas parcelas com datas explícitas e compromissos contratuais; contas operacionais sem data **não** recebem vencimento arbitrário. Parcela exigível tem rótulo próprio.
- Obrigações fiscais: guias em aberto no estado fiscal, ou checklists da `Core.fiscalOperationsReport`; separação do jogo e da lei real.
- Alertas: `—` e indicação Patch C; o contador de eventos históricos segue como **Eventos**, separado.
- KPIs no desktop em faixa horizontal, e no mobile com rolagem interna, sem oito colunas ilegíveis.
- Mapa inteiro e proporcional, centralizado na área visual entre o HUD e o dock. **Sem alteração de arte, geometria, lotes ou motor.**

## Exclusões preservadas
Sem Central de Gestão, Agenda, atalhos novos, mudança em fórmulas, compra, pagamento, fechamento, persistência ou schema. **Versão no pacote continua 3.3.1 até release aprovado.**

## Validação exigida
1. `npm run check` (Linux) e Chrome/Edge Windows completos.
2. Testes `tests/v332_patch_a.test.mjs` e QA Windows atualizado.
3. Provas visuais nos tamanhos 320, 390, 768 e 1366, com foco em evitar sobreposição de indicadores, tempo, câmera e mapa.
4. Sem aumento da revisão do save somente por ler o HUD.
5. Validação visual do titular sobre a candidata. Não integrar à `main` sem GO.

## Riscos
- KPI de contas a vencer **não equivale** ao total de passivos operacionais: muitos não possuem data de vencimento no motor. Exibir ausência de prazo em vez de falsear data.
- Estoque crítico usa **unidade ativa**, não soma estimada do grupo.
- Os indicadores de alertas só receberão contagem de recomendações no Patch C.

## Gate
`IMPLEMENTADO` → `TESTADO TECNICAMENTE` (se CI passar) → **aguarda GO do titular para publicação e Patch B**.
