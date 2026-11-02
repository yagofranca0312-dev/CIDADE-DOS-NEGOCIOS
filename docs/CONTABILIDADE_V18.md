# Contratos contábeis — V1.8.0-rc.1

## Naturezas e contas

| Código | Grupo | Natureza |
|---|---|---|
| CASH | Ativo | Devedora |
| INVENTORY | Ativo | Devedora |
| IN_TRANSIT | Ativo | Devedora |
| RECEIVABLE | Ativo | Devedora |
| PAYABLE | Passivo | Credora |
| CAPITAL | Patrimônio | Credora |
| REVENUE | Receita | Credora |
| COGS | Custo | Devedora |
| EXPENSE | Despesa | Devedora |

## Identidades

- DRE: Receita – CMV – despesas = **resultado operacional antes dos tributos**. Despesa de abertura já reconhecida no ledger histórico não é reclassificada retroativamente.
- Balanço: Ativo (caixa + estoque + trânsito + recebíveis) = Passivo (a pagar) + Patrimônio (capital + resultado acumulado). O balanço sempre é do **grupo**, não por filial.
- Caixa: caixa inicial + entradas – saídas = caixa final; a contribuição por filial não é um saldo bancário. Pedidos pagos reduzem o caixa no pedido; recebimento é mero trânsito para estoque e não integra desembolsos.
- Verificação física: o inventário de produtos e os pedidos pendentes só são comparáveis ao estado contábil na data atual do jogo. Cortes históricos não possuem snapshots físicos.
- Competência mensal: consulta pura, sem fechar o livro, gerar transações, alterar RNG, criar saldo ou imposto.

## Classificação e legado

Journals gerados na V1.8 podem incluir o metadado opcional `kind` (`CAPITAL`, `OPENING`, `SALE`, `PURCHASE`, `RECEIPT`, `DAILY_EXPENSE` ou `UNCLASSIFIED`). Históricos V1.7 não são reescritos: memos legados conhecidos são reconhecidos apenas com os prefixos que o motor efetivamente emitiu. Outros registros permanecem não classificados.

## Limitações explícitas

Jogo simulado **sem tributos** (`NOT_COVERED`). Não equivale a escrituração legal, DRE societária ou fechamento contábil oficial. Não há depreciação, provisão, receitas financeiras, múltiplas contas bancárias, folha, transferências internas, crédito com fornecedor ou tratamento tributário.

## Protocolo de regressão

- `npm run check` e CI GitHub Actions; V1.7 fixture para migração direta de saves schema 8.
- Simulações por filial, consolidadas, 365 dias, sem estoque, contas a pagar, caixa compartilhado e corte histórico.
- Navegador: 320, 390, 768, 1280 px; abas internas, sem horizontal scroll, sem erro JS.
- Versão única em título, onboarding, cabeçalho, rodapé, package e nome de HTML/ZIP.
