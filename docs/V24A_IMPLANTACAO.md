# Implantação candidata V2.4-alpha.1 — Patch A (Paralegal)

**Base:** V2.3.0 homologada, commit `af1f652515f1f691d0da371ccb82a9301834d49d`.
**Status:** candidata em validação; não homologada e não integrada à main.
**Escopo:** Paralegal operacional simulado. RH/DP é o Patch B, Fiscal Operacional o Patch C.

## Mecânica implementada
- Por estabelecimento: cadastro administrativo fictício (R$ 120 e 2 dias do jogo) e licença operacional fictícia (R$ 360 e 4 dias do jogo).
- A licença exige conclusão prévia do cadastro; permanece válida por 365 dias do calendário do jogo e pode ser renovada após vencimento.
- Solicitar é uma ação explícita do jogador, debitada do caixa central via `EXPENSE/CASH` com lançamento de natureza `PARALEGAL_FEE`, evento auditável e proteção contra duplicidade no dispatcher.
- O processamento ocorre no avanço já existente do calendário; relatório somente lê eventos e não altera o jogo.
- Unidades abertas em saves antigos começam sem processos; não há registro, pagamento, punição, obrigação ou aprovação retroativa.
- O fluxo NÃO cria CNPJ, licença pública, alvará verdadeiro, inscrição municipal ou ato societário real; taxas e prazos não pretendem refletir legislação vigente.
- Não bloqueia atividades anteriores nem altera vendas, mercado, estoque, Fiscal ou regras econômicas existentes.
- Continua em `schemaVersion = 9`, sem campos persistentes novos: histórico do processo deriva dos eventos auditados que já são parte do save.

## Critérios de aceitação
1. `npm run check` aprova build reprodutível e todos os testes, inclusive regressões V2.3.
2. `git diff --exit-code -- index.html` após build confirma HTML offline sincronizado.
3. Carreira antiga importa sem alteração retroativa; nova carreira inicia sem encargos fictícios automáticos.
4. Cadastro/solicitação/licença usam gates de caixa, calendário, duplicidade e integridade do ledger.
5. Alerta explícito na UI: parâmetros fictícios e sem valor legal.
6. Teste visual/manual em Windows do Paralegal, vencimento e importação/exportação antes da homologação.

## Próximos patches
- **B — V2.4-alpha.2 RH/DP:** trabalhadores fictícios, contratação, folha, produtividade e integração ao mesmo caixa/ledger, com salvamento e testes.
- **C — V2.4-alpha.3 Fiscal Operacional:** calendário de tarefas, fechamento, controle de obrigações do jogo e pagamentos simulados, sem inventar regimes ou ampliar cálculo tributário não suportado.
- **V3:** profundidade tributária adicional.

**Não homologar este patch com base apenas na presença do código ou em CI PASS.** A aprovação da candidata requer validação prática e aceite do jogador.
